"""
Tenant Isolation Guards

Central utilities for enforcing strict tenant isolation at the application layer.
Every data access MUST go through these guards - no exceptions.

Non-negotiables:
1. Tenant isolation is absolute (not best effort)
2. Server decides (no client trust)
3. 404 response for access violations (don't leak existence)
"""

from __future__ import annotations

import logging
from typing import Any, TypeVar

from fastapi import HTTPException, status

from app.core.security_events import log_security_event, SecurityEventType


logger = logging.getLogger(__name__)

T = TypeVar("T")


class TenantScopeViolation(Exception):
    """Raised when a tenant scope violation is detected."""

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        requested_tenant_id: str,
        actual_tenant_id: str | None = None,
    ):
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.requested_tenant_id = requested_tenant_id
        self.actual_tenant_id = actual_tenant_id
        super().__init__(
            f"Tenant scope violation: {resource_type}:{resource_id} "
            f"requested by tenant {requested_tenant_id}"
        )


def require_tenant_scope(
    resource: T | None,
    resource_type: str,
    resource_id: str,
    current_tenant_id: str,
    user_id: str | None = None,
) -> T:
    """
    Enforce tenant scope for a resource.

    CRITICAL: This function MUST be called for every data access that returns
    tenant-scoped data. No fallback, no optional.

    Args:
        resource: The resource to check (dict, object, or None)
        resource_type: Type of resource (e.g., "Case", "Profile")
        resource_id: ID of the resource being accessed
        current_tenant_id: Tenant ID from the current auth context
        user_id: Optional user ID for logging

    Returns:
        The resource if tenant scope is valid

    Raises:
        HTTPException(404): If resource is None or tenant doesn't match

    Security note:
        - Returns 404 (not 403) to avoid leaking existence of resources
        - Logs all violations for security auditing
    """
    if resource is None:
        # Resource doesn't exist - log as potential probe
        log_security_event(
            event_type=SecurityEventType.TENANT_SCOPE_VIOLATION,
            user_id=user_id,
            tenant_id=current_tenant_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details={"reason": "resource_not_found"},
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": f"{resource_type.upper()}_NOT_FOUND", "message": "Resource not found"},
        )

    # Extract tenant_id from resource
    resource_tenant_id = _get_tenant_id(resource)

    if resource_tenant_id is None:
        # Resource has no tenant_id - this is a bug
        logger.error(
            "Security: Resource has no tenant_id",
            extra={
                "resource_type": resource_type,
                "resource_id": resource_id,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": f"{resource_type.upper()}_NOT_FOUND", "message": "Resource not found"},
        )

    if resource_tenant_id != current_tenant_id:
        # CRITICAL: Tenant scope violation
        log_security_event(
            event_type=SecurityEventType.TENANT_SCOPE_VIOLATION,
            user_id=user_id,
            tenant_id=current_tenant_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details={
                "reason": "tenant_mismatch",
                "target_tenant": resource_tenant_id,
            },
        )
        # Return 404 to not leak existence
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": f"{resource_type.upper()}_NOT_FOUND", "message": "Resource not found"},
        )

    return resource


def require_tenant_scope_or_none(
    resource: T | None,
    resource_type: str,
    resource_id: str,
    current_tenant_id: str,
    user_id: str | None = None,
) -> T | None:
    """
    Variant of require_tenant_scope that allows None resources.

    Use this only when a missing resource is expected and valid.
    Still enforces tenant scope if resource exists.
    """
    if resource is None:
        return None

    return require_tenant_scope(
        resource=resource,
        resource_type=resource_type,
        resource_id=resource_id,
        current_tenant_id=current_tenant_id,
        user_id=user_id,
    )


def build_tenant_where(tenant_id: str, **additional_filters: Any) -> dict[str, Any]:
    """
    Build a WHERE clause that always includes tenant_id.

    This is a helper to ensure tenant_id is never forgotten in queries.

    Args:
        tenant_id: Current tenant ID (from auth context)
        **additional_filters: Other WHERE conditions

    Returns:
        Dict suitable for Prisma where clause

    Example:
        where = build_tenant_where(
            tenant_id=context.tenant["id"],
            id=case_id,
            status="DRAFT"
        )
        # Returns: {"tenant_id": "...", "id": "...", "status": "DRAFT"}
    """
    return {"tenant_id": tenant_id, **additional_filters}


def _get_tenant_id(resource: Any) -> str | None:
    """Extract tenant_id from various resource types."""
    if isinstance(resource, dict):
        return resource.get("tenant_id")
    if hasattr(resource, "tenant_id"):
        return resource.tenant_id
    return None
