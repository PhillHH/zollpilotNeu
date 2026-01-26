"""
Strukturiertes Logging für Observability.

Alle Log-Ausgaben sind JSON-formatiert und enthalten:
- requestId
- path
- userId (falls vorhanden)
- tenantId (falls vorhanden)
- error.code (bei Fehlern)
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from starlette.requests import Request


class StructuredLogFormatter(logging.Formatter):
    """JSON-Formatter für strukturierte Logs."""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Füge extra Felder hinzu (requestId, userId, tenantId, etc.)
        for key in ["request_id", "user_id", "tenant_id", "path", "method", "status_code", "error_code", "duration_ms"]:
            value = getattr(record, key, None)
            if value is not None:
                log_data[key] = value

        # Exception Info hinzufügen wenn vorhanden
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    """
    Konfiguriert das Logging-System mit strukturierter JSON-Ausgabe.

    Args:
        level: Log-Level (DEBUG, INFO, WARNING, ERROR)
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Entferne bestehende Handler
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Neuer Handler mit JSON-Formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredLogFormatter())
    root_logger.addHandler(handler)

    # Uvicorn-Logger konfigurieren
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers = [handler]


def get_logger(name: str) -> logging.Logger:
    """Gibt einen Logger mit dem angegebenen Namen zurück."""
    return logging.getLogger(name)


class RequestLogger:
    """
    Kontextbezogener Logger für Request-spezifische Logs.

    Fügt automatisch requestId, userId und tenantId hinzu.
    """

    def __init__(self, logger: logging.Logger, request: Request | None = None):
        self._logger = logger
        self._request = request
        self._extra = self._build_extra()

    def _build_extra(self) -> dict[str, Any]:
        """Baut das extra-Dict mit Request-Kontext."""
        extra: dict[str, Any] = {}

        if self._request:
            # Request ID
            request_id = getattr(self._request.state, "request_id", None)
            if request_id:
                extra["request_id"] = request_id

            # Path und Method
            extra["path"] = str(self._request.url.path)
            extra["method"] = self._request.method

            # Session-Daten (User, Tenant)
            session = getattr(self._request.state, "session", None)
            if session:
                extra["user_id"] = getattr(session, "user_id", None)
                extra["tenant_id"] = getattr(session, "tenant_id", None)

        return extra

    def _log(self, level: int, msg: str, **kwargs: Any) -> None:
        """Internes Logging mit extra-Feldern."""
        merged_extra = {**self._extra, **kwargs}
        self._logger.log(level, msg, extra=merged_extra)

    def debug(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.DEBUG, msg, **kwargs)

    def info(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.INFO, msg, **kwargs)

    def warning(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.WARNING, msg, **kwargs)

    def error(self, msg: str, error_code: str | None = None, **kwargs: Any) -> None:
        if error_code:
            kwargs["error_code"] = error_code
        self._log(logging.ERROR, msg, **kwargs)

    def exception(self, msg: str, error_code: str | None = None, **kwargs: Any) -> None:
        if error_code:
            kwargs["error_code"] = error_code
        self._logger.exception(msg, extra={**self._extra, **kwargs})


def log_request(request: Request) -> RequestLogger:
    """
    Erzeugt einen RequestLogger für den aktuellen Request.

    Usage:
        logger = log_request(request)
        logger.info("Processing case", case_id=case_id)
        logger.error("Validation failed", error_code="CASE_INVALID")
    """
    return RequestLogger(get_logger("api"), request)

