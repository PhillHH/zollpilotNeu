from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from enum import Enum
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, field_validator

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.core.json import normalize_to_json

router = APIRouter(prefix="/cases", tags=["cases"])

# Constants
FIELD_KEY_PATTERN = re.compile(r"^[a-z0-9_.-]{1,64}$")
FIELD_VALUE_MAX_SIZE = 16 * 1024  # 16KB


class StatusFilter(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    ALL = "all"


class CaseCreateRequest(BaseModel):
    title: str | None = None


class CasePatchRequest(BaseModel):
    title: str | None = None


class FieldResponse(BaseModel):
    key: str
    value: Any
    updated_at: datetime


class CaseSummary(BaseModel):
    id: str
    title: str
    status: str
    created_at: datetime
    updated_at: datetime


class ProcedureInfo(BaseModel):
    code: str
    name: str


class CaseDetail(BaseModel):
    id: str
    title: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None
    archived_at: datetime | None
    procedure: ProcedureInfo | None
    fields: list[FieldResponse]


class CaseListResponse(BaseModel):
    data: list[CaseSummary]


class CaseSummaryResponse(BaseModel):
    data: CaseSummary


class CaseDetailResponse(BaseModel):
    data: CaseDetail


class FieldUpsertRequest(BaseModel):
    value: Any

    @field_validator("value", mode="before")
    @classmethod
    def check_value_size(cls, v: Any) -> Any:
        import json
        serialized = json.dumps(v)
        if sys.getsizeof(serialized) > FIELD_VALUE_MAX_SIZE:
            raise ValueError("Value exceeds maximum allowed size")
        return v


class FieldSingleResponse(BaseModel):
    data: FieldResponse


class FieldListResponse(BaseModel):
    data: list[FieldResponse]


def _validate_field_key(key: str) -> None:
    if not FIELD_KEY_PATTERN.match(key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Invalid field key. Must match pattern [a-z0-9_.-] and be max 64 chars.",
            },
        )


async def _get_case_or_404(case_id: str, tenant_id: str) -> dict:
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id}
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case.model_dump()


@router.post("", response_model=CaseSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreateRequest, context: AuthContext = Depends(get_current_user)
) -> CaseSummaryResponse:
    case = await prisma.case.create(
        data={
            "tenant_id": context.tenant["id"],
            "created_by_user_id": context.user["id"],
            "title": payload.title or "Untitled",
            "status": "DRAFT",
        }
    )
    return CaseSummaryResponse(data=CaseSummary(**case.model_dump()))


@router.get("", response_model=CaseListResponse)
async def list_cases(
    context: AuthContext = Depends(get_current_user),
    status_filter: StatusFilter = Query(default=StatusFilter.ACTIVE, alias="status"),
) -> CaseListResponse:
    where: dict[str, Any] = {"tenant_id": context.tenant["id"]}

    if status_filter == StatusFilter.ACTIVE:
        where["status"] = {"in": ["DRAFT", "SUBMITTED"]}
    elif status_filter == StatusFilter.ARCHIVED:
        where["status"] = "ARCHIVED"
    # ALL: no status filter

    cases = await prisma.case.find_many(
        where=where,
        order={"created_at": "desc"},
    )
    return CaseListResponse(data=[CaseSummary(**case.model_dump()) for case in cases])


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: str, context: AuthContext = Depends(get_current_user)
) -> CaseDetailResponse:
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": context.tenant["id"]},
        include={"fields": True, "procedure": True},
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )

    fields = [
        FieldResponse(key=f.key, value=f.value_json, updated_at=f.updated_at)
        for f in (case.fields or [])
    ]

    procedure_info = None
    if case.procedure:
        procedure_info = ProcedureInfo(code=case.procedure.code, name=case.procedure.name)

    return CaseDetailResponse(
        data=CaseDetail(
            id=case.id,
            title=case.title,
            status=case.status,
            version=case.version,
            created_at=case.created_at,
            updated_at=case.updated_at,
            submitted_at=case.submitted_at,
            archived_at=case.archived_at,
            procedure=procedure_info,
            fields=fields,
        )
    )


@router.patch("/{case_id}", response_model=CaseSummaryResponse)
async def patch_case(
    case_id: str,
    payload: CasePatchRequest,
    context: AuthContext = Depends(get_current_user),
) -> CaseSummaryResponse:
    await _get_case_or_404(case_id, context.tenant["id"])

    update_data: dict[str, Any] = {}
    if payload.title is not None:
        update_data["title"] = payload.title

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "VALIDATION_ERROR", "message": "No fields to update."},
        )

    case = await prisma.case.update(
        where={"id": case_id},
        data=update_data,
    )
    return CaseSummaryResponse(data=CaseSummary(**case.model_dump()))


@router.post("/{case_id}/archive", response_model=CaseSummaryResponse)
async def archive_case(
    case_id: str, context: AuthContext = Depends(get_current_user)
) -> CaseSummaryResponse:
    existing = await _get_case_or_404(case_id, context.tenant["id"])

    # Idempotent: if already archived, just return current state
    if existing["status"] == "ARCHIVED":
        return CaseSummaryResponse(data=CaseSummary(**existing))

    case = await prisma.case.update(
        where={"id": case_id},
        data={"status": "ARCHIVED", "archived_at": datetime.utcnow()},
    )
    return CaseSummaryResponse(data=CaseSummary(**case.model_dump()))


# --- Fields API ---


@router.get("/{case_id}/fields", response_model=FieldListResponse, tags=["case-fields"])
async def get_fields(
    case_id: str, context: AuthContext = Depends(get_current_user)
) -> FieldListResponse:
    await _get_case_or_404(case_id, context.tenant["id"])

    fields = await prisma.casefield.find_many(where={"case_id": case_id})
    return FieldListResponse(
        data=[
            FieldResponse(key=f.key, value=f.value_json, updated_at=f.updated_at)
            for f in fields
        ]
    )


@router.put("/{case_id}/fields/{key}", response_model=FieldSingleResponse, tags=["case-fields"])
async def upsert_field(
    case_id: str,
    key: str,
    payload: FieldUpsertRequest,
    request: Request,
    context: AuthContext = Depends(get_current_user),
) -> FieldSingleResponse:
    _validate_field_key(key)

    # Check payload size via content-length as additional guard
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > FIELD_VALUE_MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "PAYLOAD_TOO_LARGE", "message": "Field value exceeds maximum size."},
        )

    case = await _get_case_or_404(case_id, context.tenant["id"])

    # Block updates for non-DRAFT cases
    if case["status"] != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_NOT_EDITABLE",
                "message": "Fields can only be edited in DRAFT status.",
            },
        )

    # Upsert field with normalized JSON value
    normalized_value = normalize_to_json(payload.value)
    field = await prisma.casefield.upsert(
        where={"case_id_key": {"case_id": case_id, "key": key}},
        data={
            "create": {"case_id": case_id, "key": key, "value_json": normalized_value},
            "update": {"value_json": normalized_value},
        },
    )

    return FieldSingleResponse(
        data=FieldResponse(key=field.key, value=field.value_json, updated_at=field.updated_at)
    )

