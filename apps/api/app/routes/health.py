from __future__ import annotations

from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db.prisma_client import prisma

router = APIRouter()


class HealthData(BaseModel):
    status: str


class HealthResponse(BaseModel):
    data: HealthData


class ReadinessData(BaseModel):
    status: str
    database: str
    version: str


class ReadinessResponse(BaseModel):
    data: ReadinessData


# Application version (should match release)
APP_VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    """
    Liveness probe - checks if the application is running.
    Does NOT check external dependencies.
    Use for Kubernetes liveness probe.
    """
    return HealthResponse(data=HealthData(status="ok"))


@router.get("/ready", response_model=ReadinessResponse)
async def ready(request: Request) -> JSONResponse:
    """
    Readiness probe - checks if the application can serve traffic.
    Verifies database connectivity.
    Use for Kubernetes readiness probe and load balancer health checks.
    """
    db_status = "ok"
    overall_status = "ok"
    
    try:
        # Simple query to verify DB connection
        await prisma.execute_raw("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"
        overall_status = "degraded"
    
    response_data = ReadinessResponse(
        data=ReadinessData(
            status=overall_status,
            database=db_status,
            version=APP_VERSION,
        )
    )
    
    if overall_status != "ok":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response_data.model_dump(),
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=response_data.model_dump(),
    )

