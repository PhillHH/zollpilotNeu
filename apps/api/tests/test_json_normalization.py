"""
Tests for the JSON normalization utility module.

Covers:
- All JSON primitive types (string, number, boolean, null)
- Complex types (dict, list, nested structures)
- Non-serializable type detection (datetime, UUID, Decimal, etc.)
- Error handling modes (API error vs exception)
- Optional value handling

This ensures Prisma Json fields are properly normalized across the codebase.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from prisma import Json

from app.core.json import (
    JsonSerializationError,
    normalize_to_json,
    normalize_to_json_optional,
)


# --- Basic Type Tests ---


class TestNormalizeToJsonBasicTypes:
    """Test normalize_to_json with basic JSON-serializable types."""

    def test_string(self) -> None:
        """String values are properly wrapped."""
        result = normalize_to_json("hello world")
        assert isinstance(result, Json)
        assert result == Json("hello world")

    def test_empty_string(self) -> None:
        """Empty string is properly handled."""
        result = normalize_to_json("")
        assert isinstance(result, Json)
        assert result == Json("")

    def test_integer(self) -> None:
        """Integer values are properly wrapped."""
        result = normalize_to_json(42)
        assert isinstance(result, Json)
        assert result == Json(42)

    def test_negative_integer(self) -> None:
        """Negative integers are properly handled."""
        result = normalize_to_json(-100)
        assert isinstance(result, Json)
        assert result == Json(-100)

    def test_float(self) -> None:
        """Float values are properly wrapped."""
        result = normalize_to_json(3.14159)
        assert isinstance(result, Json)
        assert result == Json(3.14159)

    def test_boolean_true(self) -> None:
        """Boolean True is properly wrapped."""
        result = normalize_to_json(True)
        assert isinstance(result, Json)
        assert result == Json(True)

    def test_boolean_false(self) -> None:
        """Boolean False is properly wrapped."""
        result = normalize_to_json(False)
        assert isinstance(result, Json)
        assert result == Json(False)

    def test_null(self) -> None:
        """None/null is properly wrapped."""
        result = normalize_to_json(None)
        assert isinstance(result, Json)
        assert result == Json(None)

    def test_zero(self) -> None:
        """Zero is properly handled (not confused with null)."""
        result = normalize_to_json(0)
        assert isinstance(result, Json)
        assert result == Json(0)


# --- Complex Type Tests ---


class TestNormalizeToJsonComplexTypes:
    """Test normalize_to_json with complex types (dict, list)."""

    def test_simple_dict(self) -> None:
        """Simple dict is properly wrapped."""
        data = {"name": "Test", "count": 5}
        result = normalize_to_json(data)
        assert isinstance(result, Json)
        assert result == Json(data)

    def test_empty_dict(self) -> None:
        """Empty dict is properly handled."""
        result = normalize_to_json({})
        assert isinstance(result, Json)
        assert result == Json({})

    def test_simple_list(self) -> None:
        """Simple list is properly wrapped."""
        data = [1, 2, 3]
        result = normalize_to_json(data)
        assert isinstance(result, Json)
        assert result == Json(data)

    def test_empty_list(self) -> None:
        """Empty list is properly handled."""
        result = normalize_to_json([])
        assert isinstance(result, Json)
        assert result == Json([])

    def test_mixed_list(self) -> None:
        """List with mixed types is properly wrapped."""
        data = [1, "two", True, None, {"nested": "value"}]
        result = normalize_to_json(data)
        assert isinstance(result, Json)
        assert result == Json(data)

    def test_nested_structure(self) -> None:
        """Deeply nested structures are properly wrapped."""
        data = {
            "level1": {
                "level2": {
                    "level3": ["a", "b", {"c": 3}]
                }
            },
            "array": [1, [2, [3]]]
        }
        result = normalize_to_json(data)
        assert isinstance(result, Json)
        assert result == Json(data)

    def test_tuple_converted_to_list(self) -> None:
        """Tuples are converted to lists during normalization."""
        data = (1, 2, 3)
        result = normalize_to_json(data)
        assert isinstance(result, Json)
        # Tuples become lists after JSON round-trip
        assert result == Json([1, 2, 3])


# --- Non-Serializable Type Tests (API Error Mode) ---


class TestNormalizeToJsonNonSerializableAPIError:
    """Test normalize_to_json raises HTTPException for non-serializable types."""

    def test_datetime_raises_api_error(self) -> None:
        """datetime objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(datetime.now())

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "datetime" in detail["message"]
        assert "isoformat" in detail["details"]["error"]

    def test_date_raises_api_error(self) -> None:
        """date objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(date.today())

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "date" in detail["message"]

    def test_uuid_raises_api_error(self) -> None:
        """UUID objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(uuid4())

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "UUID" in detail["message"]
        assert "str(uuid)" in detail["details"]["error"]

    def test_decimal_raises_api_error(self) -> None:
        """Decimal objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(Decimal("10.50"))

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "Decimal" in detail["message"]

    def test_bytes_raises_api_error(self) -> None:
        """bytes objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(b"binary data")

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "bytes" in detail["message"]
        assert "base64" in detail["details"]["error"]

    def test_set_raises_api_error(self) -> None:
        """set objects raise HTTPException with clear message."""
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json({1, 2, 3})

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert detail["code"] == "VALIDATION_ERROR"
        assert "set" in detail["message"]
        assert "list(value)" in detail["details"]["error"]

    def test_nested_datetime_raises_api_error(self) -> None:
        """datetime nested in dict raises HTTPException with path info."""
        data = {"created_at": datetime.now()}
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(data)

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert "root.created_at" in detail["details"]["error"]

    def test_nested_uuid_in_list_raises_api_error(self) -> None:
        """UUID nested in list raises HTTPException with path info."""
        data = [{"id": uuid4()}]
        with pytest.raises(HTTPException) as exc_info:
            normalize_to_json(data)

        assert exc_info.value.status_code == 400
        detail = exc_info.value.detail
        assert "root[0].id" in detail["details"]["error"]


# --- Non-Serializable Type Tests (Exception Mode) ---


class TestNormalizeToJsonNonSerializableException:
    """Test normalize_to_json raises JsonSerializationError when raise_api_error=False."""

    def test_datetime_raises_exception(self) -> None:
        """datetime objects raise JsonSerializationError."""
        with pytest.raises(JsonSerializationError) as exc_info:
            normalize_to_json(datetime.now(), raise_api_error=False)

        assert exc_info.value.value_type == "datetime"
        assert "isoformat" in exc_info.value.message

    def test_uuid_raises_exception(self) -> None:
        """UUID objects raise JsonSerializationError."""
        with pytest.raises(JsonSerializationError) as exc_info:
            normalize_to_json(uuid4(), raise_api_error=False)

        assert exc_info.value.value_type == "UUID"

    def test_decimal_raises_exception(self) -> None:
        """Decimal objects raise JsonSerializationError."""
        with pytest.raises(JsonSerializationError) as exc_info:
            normalize_to_json(Decimal("99.99"), raise_api_error=False)

        assert exc_info.value.value_type == "Decimal"


# --- Optional Value Tests ---


class TestNormalizeToJsonOptional:
    """Test normalize_to_json_optional for optional Json fields."""

    def test_none_returns_none(self) -> None:
        """None input returns None (not Json(None))."""
        result = normalize_to_json_optional(None)
        assert result is None

    def test_value_returns_json(self) -> None:
        """Non-None values are normalized to Json."""
        result = normalize_to_json_optional({"key": "value"})
        assert isinstance(result, Json)
        assert result == Json({"key": "value"})

    def test_empty_dict_returns_json(self) -> None:
        """Empty dict is not treated as None."""
        result = normalize_to_json_optional({})
        assert isinstance(result, Json)
        assert result == Json({})

    def test_empty_string_returns_json(self) -> None:
        """Empty string is not treated as None."""
        result = normalize_to_json_optional("")
        assert isinstance(result, Json)
        assert result == Json("")

    def test_zero_returns_json(self) -> None:
        """Zero is not treated as None."""
        result = normalize_to_json_optional(0)
        assert isinstance(result, Json)
        assert result == Json(0)

    def test_false_returns_json(self) -> None:
        """False is not treated as None."""
        result = normalize_to_json_optional(False)
        assert isinstance(result, Json)
        assert result == Json(False)

    def test_non_serializable_raises_error(self) -> None:
        """Non-serializable values still raise errors."""
        with pytest.raises(HTTPException):
            normalize_to_json_optional(datetime.now())


# --- Real-world Scenario Tests ---


class TestNormalizeToJsonRealWorldScenarios:
    """Test normalize_to_json with real-world data patterns."""

    def test_case_field_value_string(self) -> None:
        """Case field with simple string value (bug reproduction)."""
        # This was the original bug: "dsadasdasd" caused Prisma error
        result = normalize_to_json("dsadasdasd")
        assert isinstance(result, Json)

    def test_case_snapshot_fields_json(self) -> None:
        """CaseSnapshot.fields_json pattern."""
        fields_dict = {
            "tracking_number": "1Z999AA10123456784",
            "weight_kg": 5.5,
            "origin_country": "US",
            "recipient_name": "Max Mustermann",
            "is_business": False,
        }
        result = normalize_to_json(fields_dict)
        assert isinstance(result, Json)
        assert result == Json(fields_dict)

    def test_case_snapshot_validation_json(self) -> None:
        """CaseSnapshot.validation_json pattern."""
        validation = {"valid": True, "errors": []}
        result = normalize_to_json(validation)
        assert isinstance(result, Json)
        assert result == Json(validation)

    def test_validation_errors_structure(self) -> None:
        """Validation errors with error list."""
        validation = {
            "valid": False,
            "errors": [
                {"step_key": "step1", "field_key": "field1", "message": "Required"},
                {"step_key": "step2", "field_key": "field2", "message": "Invalid"},
            ]
        }
        result = normalize_to_json(validation)
        assert isinstance(result, Json)
        assert result == Json(validation)

    def test_credit_ledger_metadata(self) -> None:
        """CreditLedgerEntry.metadata_json pattern."""
        metadata = {
            "note": "Admin grant for testing",
            "case_id": "550e8400-e29b-41d4-a716-446655440000",
            "version": 1,
        }
        result = normalize_to_json(metadata)
        assert isinstance(result, Json)
        assert result == Json(metadata)

    def test_procedure_field_config(self) -> None:
        """ProcedureField.config_json pattern."""
        config = {
            "maxLength": 50,
            "min": 0.01,
            "max": 1000,
            "default": "DE",
        }
        result = normalize_to_json(config)
        assert isinstance(result, Json)
        assert result == Json(config)


# --- Edge Cases ---


class TestNormalizeToJsonEdgeCases:
    """Test normalize_to_json with edge cases."""

    def test_unicode_string(self) -> None:
        """Unicode strings are properly handled."""
        result = normalize_to_json("Musterstraße 1, 12345 München")
        assert isinstance(result, Json)
        assert result == Json("Musterstraße 1, 12345 München")

    def test_emoji_string(self) -> None:
        """Emoji strings are properly handled."""
        result = normalize_to_json("Status: OK ✅")
        assert isinstance(result, Json)

    def test_large_number(self) -> None:
        """Large numbers are properly handled."""
        result = normalize_to_json(10**15)
        assert isinstance(result, Json)
        assert result == Json(10**15)

    def test_special_float_values(self) -> None:
        """Very small floats are properly handled."""
        result = normalize_to_json(0.0001)
        assert isinstance(result, Json)

    def test_deeply_nested_structure(self) -> None:
        """Very deeply nested structures don't cause stack overflow."""
        # Create 20 levels of nesting
        data: dict[str, Any] = {"value": "deepest"}
        for i in range(20):
            data = {"level": i, "nested": data}

        result = normalize_to_json(data)
        assert isinstance(result, Json)
