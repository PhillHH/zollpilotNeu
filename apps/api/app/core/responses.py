from __future__ import annotations

from typing import Any


def success_response(data: Any) -> dict:
    return {"data": data}


def error_response(
    *, code: str, message: str, request_id: str | None, details: Any | None = None
) -> dict:
    payload = {"error": {"code": code, "message": message}, "requestId": request_id}
    if details is not None:
        payload["error"]["details"] = details
    return payload



