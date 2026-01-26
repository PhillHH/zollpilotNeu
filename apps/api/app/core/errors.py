"""
Error Taxonomy – Zentrale Error Codes für konsistente Fehlerbehandlung.

Alle API-Fehler sollten einen dieser definierten Codes verwenden.
"""

from enum import Enum
from typing import Any

from fastapi import HTTPException, status


class ErrorCode(str, Enum):
    """Zentrale Error Codes für die gesamte API."""

    # Auth Errors (401, 403)
    AUTH_REQUIRED = "AUTH_REQUIRED"
    FORBIDDEN = "FORBIDDEN"
    EMAIL_IN_USE = "EMAIL_IN_USE"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"

    # Not Found (404)
    NOT_FOUND = "NOT_FOUND"
    CASE_NOT_FOUND = "CASE_NOT_FOUND"
    PROCEDURE_NOT_FOUND = "PROCEDURE_NOT_FOUND"
    SNAPSHOT_NOT_FOUND = "SNAPSHOT_NOT_FOUND"
    PLAN_NOT_FOUND = "PLAN_NOT_FOUND"
    TENANT_NOT_FOUND = "TENANT_NOT_FOUND"

    # Validation / Bad Request (400)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    CONTRACT_VERSION_INVALID = "CONTRACT_VERSION_INVALID"
    NO_PROCEDURE_BOUND = "NO_PROCEDURE_BOUND"

    # Conflict (409)
    CASE_INVALID = "CASE_INVALID"
    CASE_NOT_EDITABLE = "CASE_NOT_EDITABLE"
    CASE_NOT_SUBMITTED = "CASE_NOT_SUBMITTED"
    CASE_ARCHIVED = "CASE_ARCHIVED"
    NO_SNAPSHOT = "NO_SNAPSHOT"

    # Payment Required (402)
    INSUFFICIENT_CREDITS = "INSUFFICIENT_CREDITS"

    # Payload (413)
    PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE"

    # Rate Limiting (429)
    RATE_LIMITED = "RATE_LIMITED"

    # Server Error (500)
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


# HTTP Status Code Mapping
ERROR_STATUS_MAP: dict[ErrorCode, int] = {
    # 400 Bad Request
    ErrorCode.VALIDATION_ERROR: status.HTTP_400_BAD_REQUEST,
    ErrorCode.CONTRACT_VERSION_INVALID: status.HTTP_400_BAD_REQUEST,
    ErrorCode.NO_PROCEDURE_BOUND: status.HTTP_400_BAD_REQUEST,
    # 401 Unauthorized
    ErrorCode.AUTH_REQUIRED: status.HTTP_401_UNAUTHORIZED,
    ErrorCode.INVALID_CREDENTIALS: status.HTTP_401_UNAUTHORIZED,
    # 402 Payment Required
    ErrorCode.INSUFFICIENT_CREDITS: status.HTTP_402_PAYMENT_REQUIRED,
    # 403 Forbidden
    ErrorCode.FORBIDDEN: status.HTTP_403_FORBIDDEN,
    # 404 Not Found
    ErrorCode.NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.CASE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.PROCEDURE_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.SNAPSHOT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.PLAN_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    ErrorCode.TENANT_NOT_FOUND: status.HTTP_404_NOT_FOUND,
    # 409 Conflict
    ErrorCode.CASE_INVALID: status.HTTP_409_CONFLICT,
    ErrorCode.CASE_NOT_EDITABLE: status.HTTP_409_CONFLICT,
    ErrorCode.CASE_NOT_SUBMITTED: status.HTTP_409_CONFLICT,
    ErrorCode.CASE_ARCHIVED: status.HTTP_409_CONFLICT,
    ErrorCode.NO_SNAPSHOT: status.HTTP_409_CONFLICT,
    ErrorCode.EMAIL_IN_USE: status.HTTP_409_CONFLICT,
    # 413 Payload Too Large
    ErrorCode.PAYLOAD_TOO_LARGE: status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
    # 429 Too Many Requests
    ErrorCode.RATE_LIMITED: status.HTTP_429_TOO_MANY_REQUESTS,
    # 500 Internal Server Error
    ErrorCode.INTERNAL_SERVER_ERROR: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


# User-friendly default messages
ERROR_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.AUTH_REQUIRED: "Authentifizierung erforderlich.",
    ErrorCode.FORBIDDEN: "Keine Berechtigung für diese Aktion.",
    ErrorCode.EMAIL_IN_USE: "E-Mail ist bereits registriert.",
    ErrorCode.INVALID_CREDENTIALS: "Ungültige Anmeldedaten.",
    ErrorCode.NOT_FOUND: "Ressource nicht gefunden.",
    ErrorCode.CASE_NOT_FOUND: "Fall nicht gefunden.",
    ErrorCode.PROCEDURE_NOT_FOUND: "Verfahren nicht gefunden.",
    ErrorCode.SNAPSHOT_NOT_FOUND: "Snapshot nicht gefunden.",
    ErrorCode.PLAN_NOT_FOUND: "Plan nicht gefunden.",
    ErrorCode.TENANT_NOT_FOUND: "Mandant nicht gefunden.",
    ErrorCode.VALIDATION_ERROR: "Validierungsfehler.",
    ErrorCode.CONTRACT_VERSION_INVALID: "Contract version missing or invalid.",
    ErrorCode.NO_PROCEDURE_BOUND: "Kein Verfahren zugewiesen.",
    ErrorCode.CASE_INVALID: "Fallvalidierung fehlgeschlagen.",
    ErrorCode.CASE_NOT_EDITABLE: "Fall kann nicht bearbeitet werden (nicht im Entwurfsmodus).",
    ErrorCode.CASE_NOT_SUBMITTED: "Fall muss eingereicht sein.",
    ErrorCode.CASE_ARCHIVED: "Archivierte Fälle können nicht geändert werden.",
    ErrorCode.NO_SNAPSHOT: "Kein Snapshot vorhanden.",
    ErrorCode.INSUFFICIENT_CREDITS: "Nicht genügend Credits.",
    ErrorCode.PAYLOAD_TOO_LARGE: "Anfrage zu groß.",
    ErrorCode.RATE_LIMITED: "Zu viele Anfragen. Bitte später erneut versuchen.",
    ErrorCode.INTERNAL_SERVER_ERROR: "Interner Serverfehler.",
}


def api_error(
    code: ErrorCode,
    message: str | None = None,
    details: Any | None = None,
    headers: dict[str, str] | None = None,
) -> HTTPException:
    """
    Erstellt eine HTTPException mit standardisiertem Error-Format.

    Args:
        code: ErrorCode aus der Taxonomy
        message: Optionale Custom-Message (sonst Default)
        details: Optionale zusätzliche Details
        headers: Optionale Response-Headers (z.B. Retry-After)

    Returns:
        HTTPException mit strukturiertem Detail
    """
    status_code = ERROR_STATUS_MAP.get(code, status.HTTP_500_INTERNAL_SERVER_ERROR)
    final_message = message or ERROR_MESSAGES.get(code, "Ein Fehler ist aufgetreten.")

    detail: dict[str, Any] = {
        "code": code.value,
        "message": final_message,
    }
    if details is not None:
        detail["details"] = details

    return HTTPException(
        status_code=status_code,
        detail=detail,
        headers=headers,
    )

