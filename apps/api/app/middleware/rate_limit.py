"""
Rate Limiting Middleware – Schutz vor Missbrauch.

Implementiert ein einfaches, tenant-scoped Rate Limit:
- In-Memory Storage (MVP)
- Sliding Window Counter
- 429 RATE_LIMITED bei Überschreitung
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

from app.core.responses import error_response


class RateLimitStore:
    """
    In-Memory Rate Limit Store mit Sliding Window.

    Thread-Safe genug für MVP (GIL in CPython).
    Für Produktion: Redis-basierter Store empfohlen.
    """

    def __init__(self, window_seconds: int = 60, max_requests: int = 60):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int, int]:
        """
        Prüft ob ein Request erlaubt ist.

        Args:
            key: Identifier (z.B. tenant_id oder IP)

        Returns:
            Tuple (allowed, remaining, retry_after)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Alte Einträge entfernen
        self._requests[key] = [
            ts for ts in self._requests[key] if ts > window_start
        ]

        current_count = len(self._requests[key])

        if current_count >= self.max_requests:
            # Rate Limit überschritten
            oldest_in_window = min(self._requests[key]) if self._requests[key] else now
            retry_after = int(oldest_in_window + self.window_seconds - now) + 1
            return False, 0, max(1, retry_after)

        # Request erlauben und tracken
        self._requests[key].append(now)
        remaining = self.max_requests - current_count - 1
        return True, remaining, 0

    def cleanup(self) -> None:
        """Entfernt alte Einträge aus dem Store."""
        now = time.time()
        window_start = now - self.window_seconds

        keys_to_delete = []
        for key, timestamps in self._requests.items():
            self._requests[key] = [ts for ts in timestamps if ts > window_start]
            if not self._requests[key]:
                keys_to_delete.append(key)

        for key in keys_to_delete:
            del self._requests[key]


# Globale Rate Limit Stores
# Unterschiedliche Limits für verschiedene Endpunkte
_rate_limit_stores: dict[str, RateLimitStore] = {
    "default": RateLimitStore(window_seconds=60, max_requests=60),
    "pdf": RateLimitStore(window_seconds=60, max_requests=10),
    "validation": RateLimitStore(window_seconds=60, max_requests=30),
    "fields": RateLimitStore(window_seconds=60, max_requests=120),  # Autosave braucht mehr
}


def get_rate_limit_store(category: str = "default") -> RateLimitStore:
    """Gibt den Rate Limit Store für eine Kategorie zurück."""
    return _rate_limit_stores.get(category, _rate_limit_stores["default"])


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate Limiting Middleware.

    Wendet unterschiedliche Limits je nach Endpunkt an:
    - /cases/{id}/pdf: 10/min (teuer, Credit-relevant)
    - /cases/{id}/validate: 30/min
    - /cases/{id}/fields/*: 120/min (Autosave)
    - Sonstige: 60/min
    """

    # Pfad-Patterns für Kategorien
    RATE_LIMIT_PATTERNS = [
        ("/pdf", "pdf"),
        ("/validate", "validation"),
        ("/fields/", "fields"),
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Rate Limiting nur für authentifizierte Requests mit Tenant
        session = getattr(request.state, "session", None)
        if not session:
            return await call_next(request)

        tenant_id = getattr(session, "tenant_id", None)
        if not tenant_id:
            return await call_next(request)

        # Kategorie basierend auf Pfad bestimmen
        path = str(request.url.path)
        category = "default"
        for pattern, cat in self.RATE_LIMIT_PATTERNS:
            if pattern in path:
                category = cat
                break

        # Rate Limit prüfen
        store = get_rate_limit_store(category)
        key = f"{tenant_id}:{category}"
        allowed, remaining, retry_after = store.is_allowed(key)

        if not allowed:
            request_id = getattr(request.state, "request_id", None)
            return JSONResponse(
                status_code=429,
                content=error_response(
                    code="RATE_LIMITED",
                    message="Zu viele Anfragen. Bitte später erneut versuchen.",
                    request_id=request_id,
                ),
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(store.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + retry_after),
                },
            )

        # Request durchlassen
        response = await call_next(request)

        # Rate Limit Headers hinzufügen
        response.headers["X-RateLimit-Limit"] = str(store.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response

