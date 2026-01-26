"""
Procedure API endpoints.

Provides:
- List active procedures
- Get procedure definition
- Bind procedure to case
- Validate case against procedure
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.domain.procedures import (
    FieldDefinition,
    ProcedureDefinition,
    StepDefinition,
    ValidationError as DomainValidationError,
    procedure_loader,
    validate_case_fields,
)


router = APIRouter(prefix="/procedures", tags=["procedures"])


# --- Response Models ---


class ProcedureSummary(BaseModel):
    code: str
    name: str
    version: str


class FieldDefinitionResponse(BaseModel):
    field_key: str
    field_type: str
    required: bool
    config: dict[str, Any] | None
    order: int


class StepDefinitionResponse(BaseModel):
    step_key: str
    title: str
    order: int
    fields: list[FieldDefinitionResponse]


class ProcedureDefinitionResponse(BaseModel):
    id: str
    code: str
    name: str
    version: str
    is_active: bool
    steps: list[StepDefinitionResponse]


class ProcedureListResponse(BaseModel):
    data: list[ProcedureSummary]


class ProcedureSingleResponse(BaseModel):
    data: ProcedureDefinitionResponse


class BindProcedureRequest(BaseModel):
    procedure_code: str


class BindProcedureResponse(BaseModel):
    data: dict[str, Any]


class ValidationErrorResponse(BaseModel):
    step_key: str
    field_key: str
    message: str


class ValidationResultResponse(BaseModel):
    valid: bool
    errors: list[ValidationErrorResponse] | None = None


class ValidateCaseResponse(BaseModel):
    data: ValidationResultResponse


# --- Helper Functions ---


def _procedure_to_response(proc: ProcedureDefinition) -> ProcedureDefinitionResponse:
    """Convert domain ProcedureDefinition to API response."""
    steps = [
        StepDefinitionResponse(
            step_key=step.step_key,
            title=step.title,
            order=step.order,
            fields=[
                FieldDefinitionResponse(
                    field_key=f.field_key,
                    field_type=f.field_type,
                    required=f.required,
                    config=f.config,
                    order=f.order,
                )
                for f in step.fields
            ],
        )
        for step in proc.steps
    ]

    return ProcedureDefinitionResponse(
        id=proc.id,
        code=proc.code,
        name=proc.name,
        version=proc.version,
        is_active=proc.is_active,
        steps=steps,
    )


async def _get_case_or_404(case_id: str, tenant_id: str) -> dict:
    """Get case by ID and tenant, or raise 404."""
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id}
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case.model_dump()


# --- Endpoints ---


@router.get("", response_model=ProcedureListResponse)
async def list_procedures(
    _context: AuthContext = Depends(get_current_user),
) -> ProcedureListResponse:
    """List all active procedures."""
    procedures = await procedure_loader.list_active()
    return ProcedureListResponse(
        data=[ProcedureSummary(**p) for p in procedures]
    )


@router.get("/{code}", response_model=ProcedureSingleResponse)
async def get_procedure(
    code: str,
    _context: AuthContext = Depends(get_current_user),
) -> ProcedureSingleResponse:
    """Get full procedure definition by code."""
    procedure = await procedure_loader.get_by_code(code)

    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PROCEDURE_NOT_FOUND", "message": f"Procedure '{code}' not found."},
        )

    return ProcedureSingleResponse(data=_procedure_to_response(procedure))


# --- Case Binding Endpoints (mounted under /cases but defined here for organization) ---

cases_procedure_router = APIRouter(prefix="/cases", tags=["cases", "procedures"])


@cases_procedure_router.post("/{case_id}/procedure", response_model=BindProcedureResponse)
async def bind_procedure(
    case_id: str,
    payload: BindProcedureRequest,
    context: AuthContext = Depends(get_current_user),
) -> BindProcedureResponse:
    """
    Bind a procedure to a case.
    
    Sets the case's procedure_id and procedure_version.
    Idempotent: binding the same procedure again is a no-op.
    """
    case = await _get_case_or_404(case_id, context.tenant["id"])

    # Load procedure
    procedure = await procedure_loader.get_by_code(payload.procedure_code)
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PROCEDURE_NOT_FOUND",
                "message": f"Procedure '{payload.procedure_code}' not found.",
            },
        )

    # Idempotent: if already bound to same procedure/version, return success
    if (
        case.get("procedure_id") == procedure.id
        and case.get("procedure_version") == procedure.version
    ):
        return BindProcedureResponse(
            data={
                "case_id": case_id,
                "procedure_code": procedure.code,
                "procedure_version": procedure.version,
            }
        )

    # Update case with procedure binding
    await prisma.case.update(
        where={"id": case_id},
        data={
            "procedure_id": procedure.id,
            "procedure_version": procedure.version,
        },
    )

    return BindProcedureResponse(
        data={
            "case_id": case_id,
            "procedure_code": procedure.code,
            "procedure_version": procedure.version,
        }
    )


@cases_procedure_router.post("/{case_id}/validate", response_model=ValidateCaseResponse)
async def validate_case(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> ValidateCaseResponse:
    """
    Validate a case's fields against its bound procedure.
    
    Returns validation result with any errors.
    """
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": context.tenant["id"]},
        include={"fields": True},
    )

    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )

    # Check if case has a procedure bound
    procedure_id = case.procedure_id
    if not procedure_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NO_PROCEDURE_BOUND",
                "message": "Case has no procedure bound. Bind a procedure first.",
            },
        )

    # Load procedure definition
    procedure_record = await prisma.procedure.find_unique(where={"id": procedure_id})
    if not procedure_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PROCEDURE_NOT_FOUND",
                "message": "Bound procedure not found.",
            },
        )

    procedure = await procedure_loader.get_by_code(
        procedure_record.code, procedure_record.version
    )
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PROCEDURE_NOT_FOUND",
                "message": "Bound procedure definition not found.",
            },
        )

    # Build case fields dict
    case_fields: dict[str, Any] = {}
    for field in (case.fields or []):
        case_fields[field.key] = field.value_json

    # Validate
    result = await validate_case_fields(procedure, case_fields)

    if result.valid:
        return ValidateCaseResponse(data=ValidationResultResponse(valid=True))

    return ValidateCaseResponse(
        data=ValidationResultResponse(
            valid=False,
            errors=[
                ValidationErrorResponse(
                    step_key=e.step_key,
                    field_key=e.field_key,
                    message=e.message,
                )
                for e in result.errors
            ],
        )
    )

