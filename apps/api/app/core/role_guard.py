"""
Role-Based Access Control Guards

Strict enforcement of role-based access control.
These guards ensure users can only access resources appropriate to their role.

Non-negotiables:
1. ADMIN and USER are strictly separated
2. Admin endpoints only under /admin/*
3. Explicit 403 for role violations (not silent failures)
"""

from __future__ import annotations

import logging
from functools import wraps
from typing import Callable

from fastapi import HTTPException, Request, status

from app.core.rbac import Role, is_system_admin, role_at_least
from app.core.security_events import log_security_event, SecurityEventType


logger = logging.getLogger(__name__)


class RoleViolation(Exception):
    """Raised when a role violation is detected."""

    def __init__(
        self,
        required_role: Role,
        actual_role: Role,
        endpoint: str | None = None,
    ):
        self.required_role = required_role
        self.actual_role = actual_role
        self.endpoint = endpoint
        super().__init__(
            f"Role violation: required {required_role.value}, "
            f"actual {actual_role.value}"
        )


def require_admin(
    user_id: str,
    tenant_id: str,
    role: Role,
    endpoint: str | None = None,
    request_id: str | None = None,
) -> None:
    """
    Enforce SYSTEM_ADMIN role requirement.

    This is used for system-wide admin operations that should never be
    accessible to regular users, even tenant admins.

    Args:
        user_id: Current user's ID
        tenant_id: Current tenant's ID
        role: Current user's role
        endpoint: Optional endpoint name for logging
        request_id: Optional request ID for correlation

    Raises:
        HTTPException(403): If user is not SYSTEM_ADMIN
    """
    if not is_system_admin(role):
        log_security_event(
            event_type=SecurityEventType.ROLE_VIOLATION,
            user_id=user_id,
            tenant_id=tenant_id,
            details={
                "required_role": Role.SYSTEM_ADMIN.value,
                "actual_role": role.value,
                "endpoint": endpoint,
            },
            request_id=request_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Insufficient permissions for this operation",
            },
        )


def require_tenant_admin(
    user_id: str,
    tenant_id: str,
    role: Role,
    endpoint: str | None = None,
    request_id: str | None = None,
) -> None:
    """
    Enforce tenant admin (ADMIN, OWNER, or SYSTEM_ADMIN) role requirement.

    This is used for tenant-level admin operations like managing team members
    or viewing tenant analytics.

    Args:
        user_id: Current user's ID
        tenant_id: Current tenant's ID
        role: Current user's role
        endpoint: Optional endpoint name for logging
        request_id: Optional request ID for correlation

    Raises:
        HTTPException(403): If user doesn't have admin-level role
    """
    if not role_at_least(role, Role.ADMIN):
        log_security_event(
            event_type=SecurityEventType.ROLE_VIOLATION,
            user_id=user_id,
            tenant_id=tenant_id,
            details={
                "required_role": Role.ADMIN.value,
                "actual_role": role.value,
                "endpoint": endpoint,
            },
            request_id=request_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Insufficient permissions for this operation",
            },
        )


def require_editor(
    user_id: str,
    tenant_id: str,
    role: Role,
    endpoint: str | None = None,
    request_id: str | None = None,
) -> None:
    """
    Enforce EDITOR or higher role requirement.

    This is used for content management operations (blog, FAQ).

    Args:
        user_id: Current user's ID
        tenant_id: Current tenant's ID
        role: Current user's role
        endpoint: Optional endpoint name for logging
        request_id: Optional request ID for correlation

    Raises:
        HTTPException(403): If user doesn't have editor-level role
    """
    if not role_at_least(role, Role.EDITOR):
        log_security_event(
            event_type=SecurityEventType.ROLE_VIOLATION,
            user_id=user_id,
            tenant_id=tenant_id,
            details={
                "required_role": Role.EDITOR.value,
                "actual_role": role.value,
                "endpoint": endpoint,
            },
            request_id=request_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Insufficient permissions for this operation",
            },
        )


def verify_not_admin_endpoint(request: Request) -> None:
    """
    Verify that the current request is NOT targeting an admin endpoint.

    This is a safety check to ensure admin endpoints are only under /admin/*.
    Call this from non-admin routes as an extra layer of protection.

    Args:
        request: FastAPI request object

    Raises:
        HTTPException(403): If request path contains /admin
    """
    path = request.url.path.lower()
    if "/admin" in path and not path.startswith("/admin"):
        # Someone is trying to access admin functionality through non-admin path
        logger.warning(
            "Suspicious admin access attempt",
            extra={
                "path": path,
                "method": request.method,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "Access denied"},
        )


def log_admin_access(
    user_id: str,
    tenant_id: str,
    endpoint: str,
    request_id: str | None = None,
) -> None:
    """
    Log admin endpoint access for audit trail.

    This should be called at the start of every admin endpoint handler.
    """
    log_security_event(
        event_type=SecurityEventType.ADMIN_ACCESS,
        user_id=user_id,
        tenant_id=tenant_id,
        details={"endpoint": endpoint},
        request_id=request_id,
    )
