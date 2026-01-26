from __future__ import annotations

import logging
import re
import uuid
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        incoming = request.headers.get("X-Request-Id")
        request_id = _validate_request_id(incoming)
        if not request_id:
            if incoming:
                logging.warning("invalid request id received")
            request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        return response


_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def _validate_request_id(value: str | None) -> str | None:
    if not value:
        return None
    if _REQUEST_ID_PATTERN.match(value) is None:
        return None
    return value

