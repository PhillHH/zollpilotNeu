"""
JSON Normalization Utilities for Prisma Json Fields.

Prisma-client-py has specific requirements for values passed to Json fields:
- Raw Python values (str, dict, list, etc.) can cause runtime errors
- Values must be wrapped in prisma.Json after proper serialization

This module provides a centralized, hardened helper for all Json field writes.

CRITICAL RULE:
    All writes to Prisma Json fields MUST pass through normalize_to_json().
    Do NOT pass raw Python values directly to Prisma Json fields.

See: apps/api/docs/PRISMA_JSON_NORMALIZATION.md for full documentation.
"""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from prisma import Json


class JsonSerializationError(Exception):
    """Raised when a value cannot be serialized to JSON."""

    def __init__(self, message: str, value_type: str, original_error: str | None = None):
        self.message = message
        self.value_type = value_type
        self.original_error = original_error
        super().__init__(message)


def _check_for_non_serializable_types(value: Any, path: str = "root") -> None:
    """
    Recursively check for common non-JSON-serializable types.

    Raises JsonSerializationError with a clear message indicating what type
    failed and where in the structure it was found.

    Args:
        value: The value to check
        path: The current path in the object (for error messages)
    """
    # Check for common non-serializable types
    if isinstance(value, datetime):
        raise JsonSerializationError(
            f"datetime objects are not JSON-serializable. "
            f"Convert to ISO string first: value.isoformat(). Found at: {path}",
            value_type="datetime",
        )

    if isinstance(value, date) and not isinstance(value, datetime):
        raise JsonSerializationError(
            f"date objects are not JSON-serializable. "
            f"Convert to ISO string first: value.isoformat(). Found at: {path}",
            value_type="date",
        )

    if isinstance(value, Decimal):
        raise JsonSerializationError(
            f"Decimal objects are not JSON-serializable. "
            f"Convert to float or string first. Found at: {path}",
            value_type="Decimal",
        )

    if isinstance(value, UUID):
        raise JsonSerializationError(
            f"UUID objects are not JSON-serializable. "
            f"Convert to string first: str(uuid). Found at: {path}",
            value_type="UUID",
        )

    if isinstance(value, bytes):
        raise JsonSerializationError(
            f"bytes objects are not JSON-serializable. "
            f"Convert to base64 string first. Found at: {path}",
            value_type="bytes",
        )

    if isinstance(value, set):
        raise JsonSerializationError(
            f"set objects are not JSON-serializable. "
            f"Convert to list first: list(value). Found at: {path}",
            value_type="set",
        )

    # Recursively check dicts
    if isinstance(value, dict):
        for key, val in value.items():
            _check_for_non_serializable_types(val, f"{path}.{key}")

    # Recursively check lists/tuples
    elif isinstance(value, (list, tuple)):
        for i, item in enumerate(value):
            _check_for_non_serializable_types(item, f"{path}[{i}]")


def normalize_to_json(value: Any, *, raise_api_error: bool = True) -> Json:
    """
    Normalize a Python value for safe storage in a Prisma Json field.

    Prisma-client-py interprets raw Python strings as JSON content to be parsed,
    not as JSON string values. This function ensures all values are properly
    serialized for the Json field type.

    The function performs:
    1. Pre-validation to detect common non-serializable types with clear errors
    2. JSON round-trip (dumps -> loads) to ensure the value is serializable
    3. Wrapping in prisma.Json for proper Prisma handling

    Args:
        value: Any JSON-serializable Python value (str, int, float, bool, None, dict, list)
        raise_api_error: If True, raises HTTPException with 400 status on error.
                        If False, raises JsonSerializationError.

    Returns:
        A prisma.Json wrapper containing the properly serialized value.

    Raises:
        HTTPException: If raise_api_error=True and value is not JSON-serializable
        JsonSerializationError: If raise_api_error=False and value is not JSON-serializable

    Examples:
        >>> normalize_to_json("hello")  # stored as JSON string "hello"
        >>> normalize_to_json(123)      # stored as JSON number 123
        >>> normalize_to_json({"a": 1}) # stored as JSON object
        >>> normalize_to_json(None)     # stored as JSON null
        >>> normalize_to_json([1, 2])   # stored as JSON array
    """
    try:
        # Step 1: Pre-validate for common non-serializable types
        # This provides much clearer error messages than json.dumps
        _check_for_non_serializable_types(value)

        # Step 2: Round-trip through JSON to ensure serializability
        # and normalize the value (e.g., convert tuples to lists)
        serialized = json.dumps(value)
        normalized = json.loads(serialized)

        # Step 3: Wrap in prisma.Json
        return Json(normalized)

    except JsonSerializationError as e:
        if raise_api_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": f"Value contains non-serializable type: {e.value_type}",
                    "details": {"error": e.message},
                },
            )
        raise

    except (TypeError, ValueError, OverflowError) as e:
        error_message = f"Value is not JSON-serializable: {str(e)}"

        if raise_api_error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": "Value is not JSON-serializable",
                    "details": {"error": error_message},
                },
            )

        raise JsonSerializationError(
            message=error_message,
            value_type=type(value).__name__,
            original_error=str(e),
        )


def normalize_to_json_optional(value: Any | None, *, raise_api_error: bool = True) -> Json | None:
    """
    Normalize a Python value for safe storage in an optional Prisma Json field.

    Same as normalize_to_json, but returns None for None input.
    Use this for optional Json fields (e.g., config_json?, metadata_json?).

    Args:
        value: Any JSON-serializable Python value, or None
        raise_api_error: If True, raises HTTPException with 400 status on error.
                        If False, raises JsonSerializationError.

    Returns:
        A prisma.Json wrapper, or None if value is None.
    """
    if value is None:
        return None
    return normalize_to_json(value, raise_api_error=raise_api_error)
