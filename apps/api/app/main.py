from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.responses import error_response
from app.db.prisma_client import connect_prisma, disconnect_prisma
from app.middleware.contract_version import ContractVersionMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.session import SessionMiddleware
from app.routes.auth import router as auth_router
from app.routes.cases import router as cases_router
from app.routes.health import router as health_router


def create_app() -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        await connect_prisma()
        yield
        await disconnect_prisma()

    app = FastAPI(title="ZollPilot API", lifespan=lifespan)

    app.add_middleware(
        SessionMiddleware,
        secret=settings.session_secret,
        cookie_name=settings.session_cookie_name,
    )
    app.add_middleware(ContractVersionMiddleware, allowed_version="1")
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.web_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            code = str(detail.get("code", "UNKNOWN_ERROR"))
            message = str(detail.get("message", "Request failed."))
            details = detail.get("details")
        else:
            code = str(detail).upper()
            message = str(detail)
            details = None

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                code=code,
                message=message,
                details=details,
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content=error_response(
                code="VALIDATION_ERROR",
                message="Request validation failed.",
                details=exc.errors(),
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content=error_response(
                code="INTERNAL_SERVER_ERROR",
                message="Internal server error.",
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(cases_router)
    return app


app = create_app()

