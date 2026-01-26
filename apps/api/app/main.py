from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import ErrorCode
from app.core.logging import setup_logging, log_request
from app.core.responses import error_response
from app.db.prisma_client import connect_prisma, disconnect_prisma
from app.middleware.contract_version import ContractVersionMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.session import SessionMiddleware
from app.routes.admin import router as admin_router
from app.routes.auth import router as auth_router
from app.routes.billing import router as billing_router
from app.routes.cases import router as cases_router
from app.routes.health import router as health_router
from app.routes.procedures import router as procedures_router
from app.routes.procedures import cases_procedure_router
from app.routes.lifecycle import router as lifecycle_router
from app.routes.pdf import router as pdf_router


def create_app() -> FastAPI:
    settings = get_settings()

    # Strukturiertes Logging einrichten
    setup_logging(level="INFO")

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        await connect_prisma()
        yield
        await disconnect_prisma()

    app = FastAPI(title="ZollPilot API", lifespan=lifespan)

    # Middleware-Reihenfolge ist wichtig: von außen nach innen
    # 1. CORS (äußerste)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.web_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Request ID (für Tracing)
    app.add_middleware(RequestIdMiddleware)

    # 3. Contract Version
    app.add_middleware(ContractVersionMiddleware, allowed_version="1")

    # 4. Session (Auth)
    app.add_middleware(
        SessionMiddleware,
        secret=settings.session_secret,
        cookie_name=settings.session_cookie_name,
    )

    # 5. Rate Limiting (innerste, nach Auth)
    app.add_middleware(RateLimitMiddleware)

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        """Logging Middleware für Request/Response."""
        start_time = time.time()
        logger = log_request(request)

        response = await call_next(request)

        duration_ms = (time.time() - start_time) * 1000
        logger.info(
            f"{request.method} {request.url.path}",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            code = str(detail.get("code", ErrorCode.INTERNAL_SERVER_ERROR.value))
            message = str(detail.get("message", "Request failed."))
            details = detail.get("details")
        else:
            code = str(detail).upper()
            message = str(detail)
            details = None

        request_id = getattr(request.state, "request_id", None)

        # Error loggen
        logger = log_request(request)
        logger.error(f"HTTP {exc.status_code}: {message}", error_code=code)

        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(
                code=code,
                message=message,
                details=details,
                request_id=request_id,
            ),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)

        logger = log_request(request)
        logger.warning("Validation error", error_code=ErrorCode.VALIDATION_ERROR.value)

        return JSONResponse(
            status_code=400,
            content=error_response(
                code=ErrorCode.VALIDATION_ERROR.value,
                message="Request validation failed.",
                details=exc.errors(),
                request_id=request_id,
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)

        logger = log_request(request)
        logger.exception(
            f"Unhandled exception: {type(exc).__name__}",
            error_code=ErrorCode.INTERNAL_SERVER_ERROR.value,
        )

        return JSONResponse(
            status_code=500,
            content=error_response(
                code=ErrorCode.INTERNAL_SERVER_ERROR.value,
                message="Internal server error.",
                request_id=request_id,
            ),
        )

    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(billing_router)
    app.include_router(cases_router)
    app.include_router(cases_procedure_router)
    app.include_router(lifecycle_router)
    app.include_router(pdf_router)
    app.include_router(procedures_router)
    app.include_router(admin_router)
    return app


app = create_app()
