from __future__ import annotations

from typing import Callable
from datetime import datetime, timezone
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.security import hash_session_token
from app.db.prisma_client import prisma

logger = logging.getLogger("auth")


def _make_aware(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class SessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Callable, *, secret: str, cookie_name: str) -> None:
        super().__init__(app)
        self._secret = secret
        self._cookie_name = cookie_name

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # --- RESET AUTH STATE ---
        request.state.session = None
        request.state.session_token_hash = None

        # --- READ COOKIE ---
        raw_cookie_header = request.headers.get("cookie")
        token = request.cookies.get(self._cookie_name)

        # --- DEBUG LOG (TEMPORARY) ---
        logger.error(
            "AUTH DEBUG (SessionMiddleware)",
            extra={
                "expected_cookie_name": self._cookie_name,
                "raw_cookie_header": raw_cookie_header,
                "parsed_cookies": dict(request.cookies),
                "token_present": token is not None,
                "path": request.url.path,
                "method": request.method,
            },
        )

        # --- NO COOKIE → CONTINUE UNAUTHENTICATED ---
        if not token:
            return await call_next(request)

        # --- HASH + LOOKUP SESSION ---
        token_hash = hash_session_token(token, self._secret)
        session = await prisma.session.find_unique(
            where={"token_hash": token_hash}
        )

        if not session:
            logger.error(
                "AUTH DEBUG: session not found in DB",
                extra={
                    "token_hash": token_hash,
                    "path": request.url.path,
                },
            )
            return await call_next(request)

        # --- CHECK EXPIRY ---
        expires_at = _make_aware(session.expires_at)
        now = datetime.now(timezone.utc)

        if expires_at <= now:
            logger.error(
                "AUTH DEBUG: session expired",
                extra={
                    "token_hash": token_hash,
                    "expires_at": expires_at.isoformat(),
                    "now": now.isoformat(),
                },
            )
            await prisma.session.delete(where={"token_hash": token_hash})
            return await call_next(request)

        # --- SESSION VALID ---
        request.state.session = session
        request.state.session_token_hash = token_hash

        logger.info(
            "AUTH DEBUG: session attached",
            extra={
                "user_id": session.user_id,
                "token_hash": token_hash,
                "path": request.url.path,
            },
        )

        response = await call_next(request)
        return response
