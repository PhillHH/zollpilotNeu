"""
Case Lifecycle API endpoints.

Provides:
- Submit case (with validation gate) -> PREPARED
- Reopen case (Daten korrigieren) -> IN_PROCESS
- Complete case (Zollanmeldung eingereicht) -> COMPLETED
- List snapshots
- Get snapshot detail

WICHTIG zur Abgabe (Submit):
- Submit ist ein explizites Domänenereignis
- Markiert die interne Vorbereitung als abgeschlossen (Status: PREPARED)
- ZollPilot übermittelt NICHT an den Zoll
- Nach Submit ist der Case/Wizard read-only

WICHTIG zu Reopen:
- Erlaubt Korrektur der Daten (PREPARED -> IN_PROCESS)
- Nur möglich vor COMPLETED

WICHTIG zu Complete:
- Nutzer bestätigt, dass Zollanmeldung beim Zoll eingereicht wurde
- PREPARED/SUBMITTED -> COMPLETED
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.domain.procedures import procedure_loader, validate_case_fields
from app.domain.summary import generate_case_summary, SummaryItem, SummarySection
from app.domain.case_status import (
    can_submit,
    can_reopen,
    can_complete,
    CaseStatus,
    normalize_status,
)
from app.core.json import normalize_to_json

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/cases", tags=["case-lifecycle"])


# --- Response Models ---


class SubmitResultData(BaseModel):
    """Ergebnis einer erfolgreichen Abgabe."""
    case_id: str
    status: str
    procedure_code: str
    prepared_at: datetime  # Zeitpunkt der Vorbereitung
    version: int
    snapshot_id: str
    # Legacy alias
    submitted_at: datetime | None = None  # Deprecated, use prepared_at


class SubmitResponse(BaseModel):
    """API-Response für Abgabe."""
    data: SubmitResultData


# Legacy response for backwards compatibility
class SubmitResponseLegacy(BaseModel):
    status: str
    version: int
    snapshot_id: str


class SubmitResponseWrapper(BaseModel):
    data: SubmitResponseLegacy


class ReopenResultData(BaseModel):
    """Ergebnis eines Reopen."""
    case_id: str
    status: str
    previous_status: str


class ReopenResponse(BaseModel):
    """API-Response für Reopen."""
    data: ReopenResultData


class CompleteResultData(BaseModel):
    """Ergebnis eines Complete."""
    case_id: str
    status: str
    completed_at: datetime


class CompleteResponse(BaseModel):
    """API-Response für Complete."""
    data: CompleteResultData


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
        include={"fields": True, "procedure": True, "wizard_progress": True},
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case


# --- Endpoints ---


@router.post("/{case_id}/submit", response_model=SubmitResponse)
async def submit_case(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> SubmitResponse:
    """
    Submit a case - EXPLIZITES DOMÄNENEREIGNIS.

    Die Abgabe ist ein irreversibler Vorgang, der:
    - Die interne Vorbereitung als abgeschlossen markiert
    - Den Case-Status auf SUBMITTED setzt
    - Den Wizard als abgeschlossen markiert
    - Einen Zeitstempel (submitted_at) setzt

    WICHTIG:
    - ZollPilot übermittelt NICHT an den Zoll
    - Nach Submit ist der Case/Wizard read-only
    - Kein automatisches Submit - nur expliziter Benutzeraktionen

    Voraussetzungen:
    - case.status == IN_PROCESS
    - wizard.is_completed == true (alle Steps abgeschlossen)
    - Alle Pflichtfelder ausgefüllt

    Status transition: IN_PROCESS → SUBMITTED (irreversibel)

    Fehlerfälle:
    - WIZARD_NOT_COMPLETED: Wizard nicht vollständig abgeschlossen
    - CASE_NOT_IN_PROCESS: Falscher Case-Status
    - CASE_INVALID: Validierungsfehler bei Pflichtfeldern
    """
    # Defensive tenant_id extraction
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    case = await _get_case_with_fields(case_id, tenant_id)

    # Idempotent: if already submitted/prepared, return existing state
    if case.status in (CaseStatus.SUBMITTED.value, CaseStatus.PREPARED.value):
        snapshot = await prisma.casesnapshot.find_first(
            where={"case_id": case_id, "version": case.version},
            order={"created_at": "desc"},
        )
        if snapshot:
            # Use prepared_at if available, fall back to submitted_at for legacy
            prepared_time = case.prepared_at or case.submitted_at or snapshot.created_at
            return SubmitResponse(
                data=SubmitResultData(
                    case_id=case_id,
                    status="PREPARED",
                    procedure_code=case.procedure.code if case.procedure else "",
                    prepared_at=prepared_time,
                    submitted_at=prepared_time,  # Legacy alias
                    version=case.version,
                    snapshot_id=snapshot.id,
                )
            )

    # Check if case can be submitted (must be IN_PROCESS)
    if not can_submit(case.status):
        if case.status == CaseStatus.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "CASE_NOT_IN_PROCESS",
                    "message": "Case is still in DRAFT status. Bind a procedure first to transition to IN_PROCESS.",
                },
            )
        elif case.status == CaseStatus.ARCHIVED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "CASE_ARCHIVED",
                    "message": "Archived cases cannot be submitted.",
                },
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "code": "INVALID_STATUS",
                    "message": f"Case cannot be submitted from status {case.status}. Must be IN_PROCESS.",
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

    # === WIZARD COMPLETION CHECK ===
    # Wizard muss vollständig abgeschlossen sein
    wizard_progress = case.wizard_progress
    if not wizard_progress:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WIZARD_NOT_INITIALIZED",
                "message": "Wizard has not been started. Complete all wizard steps before submitting.",
            },
        )

    if not wizard_progress.is_completed:
        # Prüfe welche Steps noch fehlen
        from app.domain.wizard_steps import get_procedure_steps

        procedure_code = case.procedure.code if case.procedure else None
        if not procedure_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "NO_PROCEDURE_BOUND",
                    "message": "Case has no procedure bound.",
                },
            )

        steps_config = get_procedure_steps(procedure_code)

        # Safely parse completed_steps from JSON
        raw_completed = wizard_progress.completed_steps
        if isinstance(raw_completed, list):
            completed_steps = raw_completed
        elif isinstance(raw_completed, str):
            import json
            try:
                completed_steps = json.loads(raw_completed)
                if not isinstance(completed_steps, list):
                    completed_steps = []
            except (json.JSONDecodeError, TypeError):
                completed_steps = []
        else:
            completed_steps = []

        if steps_config:
            missing_steps = [
                step.step_key for step in steps_config.steps
                if step.step_key not in completed_steps and step.step_key != "review"
            ]
            if missing_steps:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "code": "WIZARD_NOT_COMPLETED",
                        "message": f"Complete all wizard steps before submitting. Missing: {', '.join(missing_steps)}",
                        "details": {"missing_steps": missing_steps},
                    },
                )

        # Wenn keine Steps fehlen aber is_completed == False, ist Review noch nicht fertig
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "WIZARD_NOT_COMPLETED",
                "message": "Complete the review step before submitting.",
            },
        )

    # Load procedure definition
    procedure_code = case.procedure.code if case.procedure else None
    procedure_version = case.procedure.version if case.procedure else None

    if not procedure_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "NO_PROCEDURE_BOUND",
                "message": "Case has no procedure code.",
            },
        )

    procedure = await procedure_loader.get_by_code(procedure_code, procedure_version)
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

    # === ATOMARE ABGABE ===
    # Timestamp für Vorbereitung
    prepared_at = datetime.now(timezone.utc)

    # Check if snapshot already exists (idempotency for retries)
    existing_snapshot = await prisma.casesnapshot.find_first(
        where={"case_id": case_id, "version": case.version}
    )

    if existing_snapshot:
        # Snapshot exists, just update case status and return
        await prisma.case.update(
            where={"id": case_id},
            data={
                "status": "PREPARED",
                "prepared_at": prepared_at,
                "submitted_at": prepared_at,  # Legacy field
            },
        )
        return SubmitResponse(
            data=SubmitResultData(
                case_id=case_id,
                status="PREPARED",
                procedure_code=procedure_code,
                prepared_at=prepared_at,
                submitted_at=prepared_at,  # Legacy alias
                version=case.version,
                snapshot_id=existing_snapshot.id,
            )
        )

    # Create snapshot - use extracted values to avoid None issues
    try:
        snapshot = await prisma.casesnapshot.create(
            data={
                "case_id": case_id,
                "version": case.version,
                "procedure_code": procedure_code,
                "procedure_version": procedure_version or "v1",
                "fields_json": normalize_to_json(fields_dict),
                "validation_json": normalize_to_json({"valid": True, "errors": []}),
            }
        )
    except Exception as e:
        # Could be unique constraint violation from race condition
        # Try to find existing snapshot
        existing = await prisma.casesnapshot.find_first(
            where={"case_id": case_id, "version": case.version}
        )
        if existing:
            snapshot = existing
        else:
            import logging
            logging.error(f"Failed to create snapshot for case {case_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "code": "SNAPSHOT_CREATION_FAILED",
                    "message": f"Failed to create snapshot: {str(e)}",
                },
            )

    # Update case status atomically with optimistic locking
    # Use update_many with status check to prevent race conditions
    update_result = await prisma.case.update_many(
        where={
            "id": case_id,
            "status": "IN_PROCESS",  # Only update if still in expected state
        },
        data={
            "status": "PREPARED",
            "prepared_at": prepared_at,
            "submitted_at": prepared_at,  # Legacy field
        },
    )

    if update_result.count == 0:
        # Race condition: status was changed by another request
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONCURRENT_MODIFICATION",
                "message": "Case status was modified by another request. Please refresh and try again.",
            },
        )

    # Wizard als abgeschlossen markieren (falls noch nicht)
    if wizard_progress and not wizard_progress.is_completed:
        await prisma.wizardprogress.update(
            where={"id": wizard_progress.id},
            data={"is_completed": True},
        )

    return SubmitResponse(
        data=SubmitResultData(
            case_id=case_id,
            status="PREPARED",
            procedure_code=procedure_code,
            prepared_at=prepared_at,
            submitted_at=prepared_at,  # Legacy alias
            version=case.version,
            snapshot_id=snapshot.id,
        )
    )


@router.post("/{case_id}/reopen", response_model=ReopenResponse)
async def reopen_case(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> ReopenResponse:
    """
    Reopen a case for editing (PREPARED/SUBMITTED -> IN_PROCESS).

    Ermöglicht dem Nutzer, die Daten nach der Vorbereitung zu korrigieren.

    Voraussetzungen:
    - case.status == PREPARED oder SUBMITTED

    Status transition: PREPARED -> IN_PROCESS

    Nach Reopen:
    - Wizard ist wieder editierbar
    - Nutzer kann alle Felder ändern
    - Submit muss erneut erfolgen
    """
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    case = await _get_case_with_fields(case_id, tenant_id)
    previous_status = case.status

    # Check if case can be reopened
    if not can_reopen(case.status):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CANNOT_REOPEN",
                "message": f"Case cannot be reopened from status {case.status}. Only PREPARED cases can be reopened.",
            },
        )

    # Atomic status update with optimistic locking
    # Use update_many with status check to prevent race conditions
    update_result = await prisma.case.update_many(
        where={
            "id": case_id,
            "status": {"in": ["PREPARED", "SUBMITTED"]},  # Only update if still in expected state
        },
        data={
            "status": "IN_PROCESS",
        },
    )

    if update_result.count == 0:
        # Race condition: status was changed by another request
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONCURRENT_MODIFICATION",
                "message": "Case status was modified by another request. Please refresh and try again.",
            },
        )

    # Reset wizard completion flag to allow re-completion
    if case.wizard_progress:
        await prisma.wizardprogress.update(
            where={"id": case.wizard_progress.id},
            data={"is_completed": False},
        )

    logger.info(f"Case {case_id} reopened: {previous_status} -> IN_PROCESS")

    return ReopenResponse(
        data=ReopenResultData(
            case_id=case_id,
            status="IN_PROCESS",
            previous_status=previous_status,
        )
    )


@router.post("/{case_id}/complete", response_model=CompleteResponse)
async def complete_case(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> CompleteResponse:
    """
    Mark a case as completed (PREPARED/SUBMITTED -> COMPLETED).

    Der Nutzer bestätigt, dass die Zollanmeldung beim Zoll eingereicht wurde.
    ZollPilot selbst reicht NICHT beim Zoll ein - dies ist eine manuelle Bestätigung.

    Voraussetzungen:
    - case.status == PREPARED oder SUBMITTED

    Status transition: PREPARED -> COMPLETED

    Nach Complete:
    - Case ist endgültig abgeschlossen (für Bearbeitung)
    - Kann nur noch archiviert werden
    """
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    case = await _get_case_with_fields(case_id, tenant_id)

    # Idempotent: if already completed, return existing state
    if case.status == CaseStatus.COMPLETED.value:
        return CompleteResponse(
            data=CompleteResultData(
                case_id=case_id,
                status="COMPLETED",
                completed_at=case.completed_at or datetime.now(timezone.utc),
            )
        )

    # Check if case can be completed
    if not can_complete(case.status):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CANNOT_COMPLETE",
                "message": f"Case cannot be completed from status {case.status}. Only PREPARED cases can be marked as completed.",
            },
        )

    completed_at = datetime.now(timezone.utc)

    # Atomic status update with optimistic locking
    # Use update_many with status check to prevent race conditions
    update_result = await prisma.case.update_many(
        where={
            "id": case_id,
            "status": {"in": ["PREPARED", "SUBMITTED"]},  # Only update if still in expected state
        },
        data={
            "status": "COMPLETED",
            "completed_at": completed_at,
        },
    )

    if update_result.count == 0:
        # Race condition: status was changed by another request
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "CONCURRENT_MODIFICATION",
                "message": "Case status was modified by another request. Please refresh and try again.",
            },
        )

    logger.info(f"Case {case_id} completed at {completed_at}")

    return CompleteResponse(
        data=CompleteResultData(
            case_id=case_id,
            status="COMPLETED",
            completed_at=completed_at,
        )
    )


@router.get("/{case_id}/snapshots", response_model=SnapshotListResponse)
async def list_snapshots(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> SnapshotListResponse:
    """List all snapshots for a case."""
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    # Verify case access
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id}
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
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    # Verify case access
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id}
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
    tenant_id = context.tenant.get("id") if context.tenant else None
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "NO_TENANT", "message": "No tenant found in session."},
        )

    try:
        case = await _get_case_with_fields(case_id, tenant_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching case {case_id} for summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DATABASE_ERROR", "message": f"Failed to fetch case: {str(e)}"},
        )

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
    try:
        summary = generate_case_summary(
            procedure_code=case.procedure.code,
            procedure_version=case.procedure.version,
            procedure_name=case.procedure.name,
            fields=fields_dict
        )
    except Exception as e:
        logger.exception(f"Error generating summary for case {case_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "SUMMARY_ERROR", "message": f"Failed to generate summary: {str(e)}"},
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

