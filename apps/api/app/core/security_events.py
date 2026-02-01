"""
Security Event Logging

Centralized logging for security-relevant events.
These logs are critical for audit trails and incident response.

Design principles:
1. No personally identifiable information (PII) in logs
2. Focus on IDs and actions, not content
3. Structured JSON format for machine parsing
4. Events are immutable once written
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any

logger = logging.getLogger("security")


class SecurityEventType(str, Enum):
    """Security event types for audit logging."""

    # Access control violations
    TENANT_SCOPE_VIOLATION = "tenant_scope_violation"
    ROLE_VIOLATION = "role_violation"
    AUTH_REQUIRED = "auth_required"

    # Suspicious activity
    INVALID_SESSION = "invalid_session"
    EXPIRED_SESSION = "expired_session"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"

    # Admin actions (for audit trail)
    ADMIN_ACCESS = "admin_access"
    ADMIN_CREDITS_GRANT = "admin_credits_grant"
    ADMIN_PLAN_CHANGE = "admin_plan_change"
    ADMIN_USER_STATUS_CHANGE = "admin_user_status_change"

    # Authentication events
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    LOGOUT = "logout"
    PASSWORD_RESET = "password_reset"


def log_security_event(
    event_type: SecurityEventType,
    user_id: str | None = None,
    tenant_id: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    request_id: str | None = None,
) -> None:
    """
    Log a security event for audit purposes.

    Args:
        event_type: Type of security event
        user_id: ID of the user involved (if known)
        tenant_id: ID of the tenant involved (if known)
        resource_type: Type of resource accessed (e.g., "Case", "Profile")
        resource_id: ID of the resource accessed
        details: Additional context (NO PII allowed)
        request_id: Request ID for correlation

    Security note:
        - Never log passwords, tokens, or personal data
        - Log only IDs and action metadata
        - These logs may be retained for compliance
    """
    event = {
        "event_type": event_type.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "tenant_id": tenant_id,
    }

    if resource_type:
        event["resource_type"] = resource_type
    if resource_id:
        event["resource_id"] = resource_id
    if request_id:
        event["request_id"] = request_id
    if details:
        # Sanitize details to ensure no PII
        event["details"] = _sanitize_details(details)

    # Log level based on event severity
    if event_type in (
        SecurityEventType.TENANT_SCOPE_VIOLATION,
        SecurityEventType.ROLE_VIOLATION,
    ):
        logger.warning("Security event: %s", event_type.value, extra={"security_event": event})
    elif event_type in (
        SecurityEventType.LOGIN_FAILURE,
        SecurityEventType.RATE_LIMIT_EXCEEDED,
    ):
        logger.warning("Security event: %s", event_type.value, extra={"security_event": event})
    elif event_type in (
        SecurityEventType.ADMIN_ACCESS,
        SecurityEventType.ADMIN_CREDITS_GRANT,
        SecurityEventType.ADMIN_PLAN_CHANGE,
        SecurityEventType.ADMIN_USER_STATUS_CHANGE,
    ):
        logger.info("Admin action: %s", event_type.value, extra={"security_event": event})
    else:
        logger.info("Security event: %s", event_type.value, extra={"security_event": event})


def _sanitize_details(details: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitize details dict to remove potential PII.

    Allowed fields are whitelisted. Unknown fields are dropped.
    """
    allowed_keys = {
        "reason",
        "target_tenant",
        "required_role",
        "actual_role",
        "endpoint",
        "method",
        "ip_address",  # IP is considered metadata, not PII for security logs
        "user_agent",
        "error_code",
        "retry_after",
        "amount",
        "plan_code",
        "status",
    }

    return {k: v for k, v in details.items() if k in allowed_keys}
