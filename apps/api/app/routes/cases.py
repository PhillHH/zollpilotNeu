from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseCreateRequest(BaseModel):
    title: str | None = None


class CaseResponse(BaseModel):
    id: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime


class CaseListResponse(BaseModel):
    data: list[CaseResponse]


class CaseSingleResponse(BaseModel):
    data: CaseResponse


@router.post("", response_model=CaseSingleResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreateRequest, context: AuthContext = Depends(get_current_user)
) -> CaseSingleResponse:
    case = await prisma.case.create(
        data={
            "tenant_id": context.tenant["id"],
            "created_by_user_id": context.user["id"],
            "title": payload.title or "Untitled",
            "status": "DRAFT",
        }
    )
    return CaseSingleResponse(data=CaseResponse(**case))


@router.get("", response_model=CaseListResponse)
async def list_cases(context: AuthContext = Depends(get_current_user)) -> CaseListResponse:
    cases = await prisma.case.find_many(
        where={"tenant_id": context.tenant["id"]},
        order={"created_at": "desc"},
    )
    return CaseListResponse(data=[CaseResponse(**case) for case in cases])


@router.get("/{case_id}", response_model=CaseSingleResponse)
async def get_case(case_id: str, context: AuthContext = Depends(get_current_user)) -> CaseSingleResponse:
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": context.tenant["id"]}
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return CaseSingleResponse(data=CaseResponse(**case))

