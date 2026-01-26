from __future__ import annotations

from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from datetime import datetime, timezone

from app.core.security import hash_session_token
from app.db.prisma_client import prisma


class SessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Callable, *, secret: str, cookie_name: str) -> None:
        super().__init__(app)
        self._secret = secret
        self._cookie_name = cookie_name

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        token = request.cookies.get(self._cookie_name)
        request.state.session = None
        request.state.session_token_hash = None

        if token:
            token_hash = hash_session_token(token, self._secret)
            session = await prisma.session.find_unique(where={"token_hash": token_hash})

            if session and session.expires_at <= datetime.now(timezone.utc):
                await prisma.session.delete(where={"token_hash": token_hash})
                session = None

            if session:
                request.state.session = session
                request.state.session_token_hash = token_hash

        response = await call_next(request)
        return response

