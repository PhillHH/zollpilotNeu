from __future__ import annotations

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class HealthData(BaseModel):
    status: str


class HealthResponse(BaseModel):
    data: HealthData


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    return HealthResponse(data=HealthData(status="ok"))

