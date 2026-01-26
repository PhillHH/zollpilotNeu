"""
Case Lifecycle API endpoints.

Provides:
- Submit case (with validation gate)
- List snapshots
- Get snapshot detail
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.domain.procedures import procedure_loader, validate_case_fields
from app.domain.summary import generate_case_summary, SummaryItem, SummarySection


router = APIRouter(prefix="/cases", tags=["case-lifecycle"])


# --- Response Models ---


class SubmitResponse(BaseModel):
    status: str
    version: int
    snapshot_id: str


class SubmitResponseWrapper(BaseModel):
    data: SubmitResponse


class SnapshotSummary(BaseModel):
    id: str
    version: int
    created_at: datetime


class SnapshotListResponse(BaseModel):
    data: list[SnapshotSummary]


class SnapshotDetail(BaseModel):
    id: str
    case_id: str
    version: int
    procedure_code: str
    procedure_version: str
    fields_json: dict[str, Any]
    validation_json: dict[str, Any]
    created_at: datetime


class SnapshotDetailResponse(BaseModel):
    data: SnapshotDetail


class ProcedureInfo(BaseModel):
    code: str
    version: str
    name: str


class SummaryItemResponse(BaseModel):
    label: str
    value: str


class SummarySectionResponse(BaseModel):
    title: str
    items: list[SummaryItemResponse]


class CaseSummaryData(BaseModel):
    procedure: ProcedureInfo
    sections: list[SummarySectionResponse]


class CaseSummaryResponse(BaseModel):
    data: CaseSummaryData


# --- Helper Functions ---


async def _get_case_with_fields(case_id: str, tenant_id: str):
    """Get case with fields or raise 404."""
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id},
        include={"fields": True, "procedure": True},
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case


# --- Endpoints ---


@router.post("/{case_id}/submit", response_model=SubmitResponseWrapper)
async def submit_case(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> SubmitResponseWrapper:
    """
    Submit a case.
    
    - Validates the case
    - If invalid, returns 409 CASE_INVALID
    - Creates a snapshot
    - Sets status to SUBMITTED
    - Idempotent: if already SUBMITTED, returns existing info
    """
    case = await _get_case_with_fields(case_id, context.tenant["id"])

    # Idempotent: if already submitted, return existing state
    if case.status == "SUBMITTED":
        # Find existing snapshot
        snapshot = await prisma.casesnapshot.find_first(
            where={"case_id": case_id, "version": case.version},
            order={"created_at": "desc"},
        )
        if snapshot:
            return SubmitResponseWrapper(
                data=SubmitResponse(
                    status="SUBMITTED",
                    version=case.version,
                    snapshot_id=snapshot.id,
                )
            )

    # Check if case is in DRAFT status
    if case.status == "ARCHIVED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_ARCHIVED",
                "message": "Archived cases cannot be submitted.",
            },
        )

    # Check if procedure is bound
    if not case.procedure_id or not case.procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NO_PROCEDURE_BOUND",
                "message": "Case has no procedure bound. Bind a procedure first.",
            },
        )

    # Load procedure definition
    procedure = await procedure_loader.get_by_code(
        case.procedure.code, case.procedure.version
    )
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PROCEDURE_NOT_FOUND",
                "message": "Bound procedure definition not found.",
            },
        )

    # Build fields dict
    fields_dict: dict[str, Any] = {}
    for field in (case.fields or []):
        fields_dict[field.key] = field.value_json

    # Validate
    validation_result = await validate_case_fields(procedure, fields_dict)

    if not validation_result.valid:
        # Return 409 with validation errors
        errors = [
            {"step_key": e.step_key, "field_key": e.field_key, "message": e.message}
            for e in validation_result.errors
        ]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_INVALID",
                "message": "Case validation failed. Fix errors before submitting.",
                "details": {"errors": errors},
            },
        )

    # Create snapshot
    snapshot = await prisma.casesnapshot.create(
        data={
            "case_id": case_id,
            "version": case.version,
            "procedure_code": case.procedure.code,
            "procedure_version": case.procedure.version,
            "fields_json": fields_dict,
            "validation_json": {"valid": True, "errors": []},
        }
    )

    # Update case status
    await prisma.case.update(
        where={"id": case_id},
        data={
            "status": "SUBMITTED",
            "submitted_at": datetime.now(timezone.utc),
        },
    )

    return SubmitResponseWrapper(
        data=SubmitResponse(
            status="SUBMITTED",
            version=case.version,
            snapshot_id=snapshot.id,
        )
    )


@router.get("/{case_id}/snapshots", response_model=SnapshotListResponse)
async def list_snapshots(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> SnapshotListResponse:
    """List all snapshots for a case."""
    # Verify case access
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": context.tenant["id"]}
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )

    snapshots = await prisma.casesnapshot.find_many(
        where={"case_id": case_id},
        order={"version": "desc"},
    )

    return SnapshotListResponse(
        data=[
            SnapshotSummary(
                id=s.id,
                version=s.version,
                created_at=s.created_at,
            )
            for s in snapshots
        ]
    )


@router.get("/{case_id}/snapshots/{version}", response_model=SnapshotDetailResponse)
async def get_snapshot(
    case_id: str,
    version: int,
    context: AuthContext = Depends(get_current_user),
) -> SnapshotDetailResponse:
    """Get a specific snapshot by version."""
    # Verify case access
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": context.tenant["id"]}
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )

    snapshot = await prisma.casesnapshot.find_first(
        where={"case_id": case_id, "version": version}
    )
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SNAPSHOT_NOT_FOUND", "message": "Snapshot not found."},
        )

    return SnapshotDetailResponse(
        data=SnapshotDetail(
            id=snapshot.id,
            case_id=snapshot.case_id,
            version=snapshot.version,
            procedure_code=snapshot.procedure_code,
            procedure_version=snapshot.procedure_version,
            fields_json=snapshot.fields_json,
            validation_json=snapshot.validation_json,
            created_at=snapshot.created_at,
        )
    )


@router.get("/{case_id}/summary", response_model=CaseSummaryResponse)
async def get_case_summary(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> CaseSummaryResponse:
    """
    Get structured summary for a case.
    
    Returns formatted, human-readable data organized into sections.
    Values are properly formatted (currency, country names, etc.).
    """
    case = await _get_case_with_fields(case_id, context.tenant["id"])

    # Check if procedure is bound
    if not case.procedure_id or not case.procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NO_PROCEDURE_BOUND",
                "message": "Case has no procedure bound.",
            },
        )

    # Build fields dict
    fields_dict: dict[str, Any] = {}
    for field in (case.fields or []):
        fields_dict[field.key] = field.value_json

    # Generate summary
    summary = generate_case_summary(
        procedure_code=case.procedure.code,
        procedure_version=case.procedure.version,
        procedure_name=case.procedure.name,
        fields=fields_dict
    )

    return CaseSummaryResponse(
        data=CaseSummaryData(
            procedure=ProcedureInfo(
                code=summary.procedure_code,
                version=summary.procedure_version,
                name=summary.procedure_name,
            ),
            sections=[
                SummarySectionResponse(
                    title=section.title,
                    items=[
                        SummaryItemResponse(label=item.label, value=item.value)
                        for item in section.items
                    ]
                )
                for section in summary.sections
            ]
        )
    )

