"""
Procedure API endpoints.

Provides:
- List active procedures
- Get procedure definition
- Bind procedure to case
- Validate case against procedure
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma

logger = logging.getLogger(__name__)
from app.domain.procedures import (
    FieldDefinition,
    ProcedureDefinition,
    StepDefinition,
    ValidationError as DomainValidationError,
    procedure_loader,
    validate_case_fields,
)
from app.domain.case_status import can_bind_procedure, CaseStatus


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


class BindProcedureResult(BaseModel):
    """Ergebnis einer Verfahrensbindung."""
    case_id: str
    procedure_code: str
    procedure_version: str
    status: str
    is_rebind: bool = False


class BindProcedureResponse(BaseModel):
    data: BindProcedureResult


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
    Bind a procedure to a case - SYSTEMGRENZE.

    Die Verfahrensauswahl ist ein explizites Domänenereignis:
    - Markiert den verbindlichen Start des Prozesses
    - Case wechselt von DRAFT zu IN_PROCESS
    - Ab diesem Moment kann der Wizard starten

    Status-Übergänge:
    - DRAFT → IN_PROCESS (automatisch bei erster Bindung)
    - IN_PROCESS: Re-Binding zu anderem Verfahren erlaubt (explizit)

    Re-Binding-Regel:
    - Nur in IN_PROCESS erlaubt
    - Bestehende CaseFields bleiben erhalten (keine Datenverluste)
    - Felder sind oft verfahrensübergreifend (sender, recipient, value)
    - Benutzer kann Felder manuell anpassen

    Fehlerfälle:
    - PROCEDURE_NOT_FOUND: Ungültiges Verfahren
    - CASE_NOT_EDITABLE: Status nicht DRAFT oder IN_PROCESS
    - CASE_ALREADY_SUBMITTED: Verfahren bereits eingereicht
    """
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    try:
        case = await _get_case_or_404(case_id, tenant_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DATABASE_ERROR", "message": f"Failed to fetch case: {str(e)}"},
        )
    current_status = case.get("status", "")
    current_procedure_id = case.get("procedure_id")

    # Validate procedure code format
    valid_procedures = ["IZA", "IAA", "IPK"]
    if payload.procedure_code.upper() not in valid_procedures:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_PROCEDURE_CODE",
                "message": f"Invalid procedure code '{payload.procedure_code}'. Valid codes: {', '.join(valid_procedures)}",
            },
        )

    # Load procedure from database
    procedure = await procedure_loader.get_by_code(payload.procedure_code)
    if not procedure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PROCEDURE_NOT_FOUND",
                "message": f"Procedure '{payload.procedure_code}' not found or not active.",
            },
        )

    # === STATUS-BASIERTE VALIDIERUNG ===

    # Case bereits eingereicht oder archiviert?
    if current_status == CaseStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_ALREADY_SUBMITTED",
                "message": "Cannot change procedure after submission.",
            },
        )

    if current_status == CaseStatus.ARCHIVED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_ARCHIVED",
                "message": "Cannot change procedure on archived case.",
            },
        )

    # Idempotent: gleiche Prozedur/Version bereits gebunden
    if (
        case.get("procedure_id") == procedure.id
        and case.get("procedure_version") == procedure.version
    ):
        return BindProcedureResponse(
            data={
                "case_id": case_id,
                "procedure_code": procedure.code,
                "procedure_version": procedure.version,
                "status": current_status,
                "is_rebind": False,
            }
        )

    # === ERLAUBTE ÜBERGÄNGE ===

    is_first_binding = current_status == CaseStatus.DRAFT.value
    is_rebinding = current_status == CaseStatus.IN_PROCESS.value and current_procedure_id is not None

    if not (is_first_binding or current_status == CaseStatus.IN_PROCESS.value):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CASE_NOT_EDITABLE",
                "message": f"Cannot bind procedure in status '{current_status}'. Only DRAFT or IN_PROCESS allowed.",
            },
        )

    # === ATOMARE AKTUALISIERUNG ===

    update_data: dict[str, Any] = {
        "procedure_id": procedure.id,
        "procedure_version": procedure.version,
    }

    # Erster Bind: Status-Übergang DRAFT → IN_PROCESS
    if is_first_binding:
        update_data["status"] = CaseStatus.IN_PROCESS.value

    # Re-Binding: Status bleibt IN_PROCESS, nur Verfahren wechselt
    # Bestehende CaseFields werden NICHT gelöscht (bewusste Entscheidung)
    # Begründung: Viele Felder sind verfahrensübergreifend nutzbar

    try:
        updated_case = await prisma.case.update(
            where={"id": case_id},
            data=update_data,
        )
    except Exception as e:
        logger.exception(f"Error binding procedure to case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "PROCEDURE_BIND_ERROR", "message": f"Failed to bind procedure: {str(e)}"},
        )

    return BindProcedureResponse(
        data={
            "case_id": case_id,
            "procedure_code": procedure.code,
            "procedure_version": procedure.version,
            "status": updated_case.status,
            "is_rebind": is_rebinding,
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
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    try:
        case = await prisma.case.find_first(
            where={"id": case_id, "tenant_id": tenant_id},
            include={"fields": True},
        )
    except Exception as e:
        logger.exception(f"Error fetching case {case_id} for validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DATABASE_ERROR", "message": f"Failed to fetch case: {str(e)}"},
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

