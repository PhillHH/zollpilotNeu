from __future__ import annotations

import logging
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.responses import error_response


class ContractVersionMiddleware(BaseHTTPMiddleware):
    # Pfade, die keine Contract-Version benötigen (Health-Checks, etc.)
    EXEMPT_PATHS = frozenset(["/health", "/ready", "/docs", "/openapi.json", "/redoc"])

    def __init__(self, app: Callable, *, allowed_version: str) -> None:
        super().__init__(app)
        self._allowed_version = allowed_version

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # OPTIONS-Requests für CORS-Preflight durchlassen
        if request.method == "OPTIONS":
            return await call_next(request)

        # Health-Checks und andere exempt Pfade durchlassen
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        version = request.headers.get("X-Contract-Version")
        if version != self._allowed_version:
            request_id = getattr(request.state, "request_id", None)
            logging.warning(
                "contract version invalid",
                extra={"request_id": request_id, "version": version},
            )
            return JSONResponse(
                status_code=400,
                content=error_response(
                    code="CONTRACT_VERSION_INVALID",
                    message="Contract version missing or invalid.",
                    request_id=request_id,
                ),
            )

        return await call_next(request)

