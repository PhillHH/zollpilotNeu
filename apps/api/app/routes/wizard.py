"""
Wizard API Endpoints.

Bietet:
- GET /cases/{id}/wizard - Wizard-Zustand abrufen
- POST /cases/{id}/wizard/navigate - Zu einem Step navigieren
- POST /cases/{id}/wizard/complete-step - Step als abgeschlossen markieren
- GET /cases/{id}/wizard/steps - Step-Definitionen abrufen

WICHTIG:
- Alle Endpoints prüfen Wizard-Zugangsrechte
- Step-Fortschritt wird serverseitig persistiert
- Kein Überspringen von Steps
- Nach SUBMIT ist der Wizard READ-ONLY (keine Navigation, kein Reset)
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user
from app.db.prisma_client import prisma
from app.domain.wizard import (
    validate_wizard_access,
    validate_step_navigation,
    validate_step_completion,
    can_access_review,
    build_wizard_state,
    get_initial_wizard_state,
    WizardState,
)
from app.domain.wizard_steps import get_procedure_steps, StepDefinition
from app.domain.case_status import CaseStatus


router = APIRouter(prefix="/cases", tags=["wizard"])


# =============================================================================
# Response Models
# =============================================================================


class StepInfo(BaseModel):
    """Step-Information für Frontend."""
    step_key: str
    title: str
    description: str
    required_fields: list[str]
    is_completed: bool
    is_current: bool
    is_accessible: bool


class WizardStateResponse(BaseModel):
    """Vollständiger Wizard-Zustand."""
    case_id: str
    procedure_code: str
    current_step: str
    completed_steps: list[str]
    is_completed: bool
    total_steps: int
    current_step_index: int
    can_go_back: bool
    can_go_forward: bool
    can_submit: bool
    steps: list[StepInfo]


class WizardResponse(BaseModel):
    """API-Response für Wizard-Zustand."""
    data: WizardStateResponse


class NavigateRequest(BaseModel):
    """Request für Step-Navigation."""
    target_step: str


class CompleteStepRequest(BaseModel):
    """Request für Step-Abschluss."""
    step_key: str


class NavigationResultResponse(BaseModel):
    """Ergebnis einer Navigation."""
    success: bool
    current_step: str
    error_code: str | None = None
    error_message: str | None = None


class NavigateResponse(BaseModel):
    """API-Response für Navigation."""
    data: NavigationResultResponse


class StepValidationResponse(BaseModel):
    """Ergebnis einer Step-Validierung."""
    valid: bool
    missing_fields: list[str] | None = None
    error_message: str | None = None


class CompleteStepResponse(BaseModel):
    """API-Response für Step-Abschluss."""
    data: StepValidationResponse


# =============================================================================
# Helper Functions
# =============================================================================


async def _get_case_with_procedure(case_id: str, tenant_id: str):
    """Holt Case mit Procedure oder wirft 404."""
    case = await prisma.case.find_first(
        where={"id": case_id, "tenant_id": tenant_id},
        include={"procedure": True, "fields": True, "wizard_progress": True},
    )
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CASE_NOT_FOUND", "message": "Case not found."},
        )
    return case


def _check_wizard_access(case) -> None:
    """Prüft Wizard-Zugang und wirft Fehler wenn nicht erlaubt."""
    result = validate_wizard_access(
        case_status=case.status,
        procedure_id=case.procedure_id,
        procedure_code=case.procedure.code if case.procedure else None,
    )
    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": result.error_code,
                "message": result.error_message,
            },
        )


def _check_wizard_write_access(case) -> None:
    """Prüft ob Schreibzugriff auf Wizard erlaubt ist.

    Nach SUBMIT ist der Wizard READ-ONLY:
    - Keine Navigation
    - Kein Step-Abschluss
    - Kein Reset

    Submit ist IRREVERSIBEL.
    """
    if case.status == CaseStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "CASE_SUBMITTED",
                "message": "Case has been submitted. Wizard is read-only.",
            },
        )

    if case.status == CaseStatus.ARCHIVED.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "CASE_ARCHIVED",
                "message": "Case is archived. Wizard is read-only.",
            },
        )


def _build_steps_info(
    procedure_code: str,
    current_step: str,
    completed_steps: list[str],
) -> list[StepInfo]:
    """Baut Step-Info-Liste für Response."""
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        return []

    result = []
    current_idx = steps_config.get_step_index(current_step)

    for idx, step_def in enumerate(steps_config.steps):
        is_completed = step_def.step_key in completed_steps
        is_current = step_def.step_key == current_step

        # Zugänglichkeit: Abgeschlossene Steps, aktueller Step, nächster Step wenn aktueller abgeschlossen
        is_accessible = (
            is_completed
            or is_current
            or idx <= current_idx
            or (idx == current_idx + 1 and current_step in completed_steps)
        )

        result.append(StepInfo(
            step_key=step_def.step_key,
            title=step_def.title,
            description=step_def.description,
            required_fields=list(step_def.required_fields),
            is_completed=is_completed,
            is_current=is_current,
            is_accessible=is_accessible,
        ))

    return result


# =============================================================================
# Endpoints
# =============================================================================


@router.get("/{case_id}/wizard", response_model=WizardResponse)
async def get_wizard_state(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> WizardResponse:
    """
    Holt den aktuellen Wizard-Zustand für einen Case.

    Erstellt automatisch einen neuen WizardProgress-Eintrag wenn keiner existiert.

    Guards:
    - Case muss existieren
    - Case muss IN_PROCESS oder SUBMITTED sein
    - Verfahren muss gebunden sein

    Nach SUBMIT:
    - Wizard-Zustand kann gelesen werden (read-only)
    - Schreiboperationen (navigate, complete-step, reset) sind blockiert
    """
    case = await _get_case_with_procedure(case_id, context.tenant["id"])

    # Für SUBMITTED/ARCHIVED: Read-only Zugang erlauben
    if case.status in (CaseStatus.SUBMITTED.value, CaseStatus.ARCHIVED.value):
        # Wizard-Zustand nur lesen, nicht validieren
        if not case.wizard_progress:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "WIZARD_NOT_FOUND",
                    "message": "No wizard progress found for this case.",
                },
            )
    else:
        # Für IN_PROCESS: Normale Wizard-Zugangsvalidierung
        _check_wizard_access(case)

    procedure_code = case.procedure.code

    # Wizard-Progress laden oder erstellen
    if case.wizard_progress:
        progress = case.wizard_progress
        completed_steps = progress.completed_steps if isinstance(progress.completed_steps, list) else []
    else:
        # Neuen Wizard-Progress erstellen
        steps_config = get_procedure_steps(procedure_code)
        first_step = steps_config.first_step if steps_config else ""

        progress = await prisma.wizardprogress.create(
            data={
                "case_id": case_id,
                "procedure_code": procedure_code,
                "current_step": first_step,
                "completed_steps": [],
                "is_completed": False,
            }
        )
        completed_steps = []

    # Wizard-State bauen
    state = build_wizard_state(
        case_id=case_id,
        procedure_code=procedure_code,
        current_step=progress.current_step,
        completed_steps=completed_steps,
        is_completed=progress.is_completed,
    )

    # Steps-Info bauen
    steps_info = _build_steps_info(
        procedure_code=procedure_code,
        current_step=progress.current_step,
        completed_steps=completed_steps,
    )

    return WizardResponse(
        data=WizardStateResponse(
            case_id=state.case_id,
            procedure_code=state.procedure_code,
            current_step=state.current_step,
            completed_steps=state.completed_steps,
            is_completed=state.is_completed,
            total_steps=state.total_steps,
            current_step_index=state.current_step_index,
            can_go_back=state.can_go_back,
            can_go_forward=state.can_go_forward,
            can_submit=state.can_submit,
            steps=steps_info,
        )
    )


@router.post("/{case_id}/wizard/navigate", response_model=NavigateResponse)
async def navigate_wizard(
    case_id: str,
    payload: NavigateRequest,
    context: AuthContext = Depends(get_current_user),
) -> NavigateResponse:
    """
    Navigiert zu einem bestimmten Step.

    Erlaubt:
    - Nächster Step (wenn aktueller abgeschlossen)
    - Vorheriger Step (immer)
    - Bereits abgeschlossene Steps

    Nicht erlaubt:
    - Überspringen nicht abgeschlossener Steps
    - Navigation nach SUBMIT (Wizard ist read-only)
    """
    case = await _get_case_with_procedure(case_id, context.tenant["id"])
    _check_wizard_access(case)
    _check_wizard_write_access(case)  # Block after submit

    procedure_code = case.procedure.code

    # Wizard-Progress laden
    if not case.wizard_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "WIZARD_NOT_INITIALIZED",
                "message": "Call GET /wizard first to initialize wizard.",
            },
        )

    progress = case.wizard_progress
    completed_steps = progress.completed_steps if isinstance(progress.completed_steps, list) else []

    # Navigation validieren
    nav_result = validate_step_navigation(
        procedure_code=procedure_code,
        current_step=progress.current_step,
        target_step=payload.target_step,
        completed_steps=completed_steps,
    )

    if not nav_result.allowed:
        return NavigateResponse(
            data=NavigationResultResponse(
                success=False,
                current_step=progress.current_step,
                error_code=nav_result.error_code,
                error_message=nav_result.error_message,
            )
        )

    # Navigation durchführen
    await prisma.wizardprogress.update(
        where={"id": progress.id},
        data={"current_step": payload.target_step},
    )

    return NavigateResponse(
        data=NavigationResultResponse(
            success=True,
            current_step=payload.target_step,
        )
    )


@router.post("/{case_id}/wizard/complete-step", response_model=CompleteStepResponse)
async def complete_wizard_step(
    case_id: str,
    payload: CompleteStepRequest,
    context: AuthContext = Depends(get_current_user),
) -> CompleteStepResponse:
    """
    Markiert einen Step als abgeschlossen.

    Validiert:
    - Alle Pflichtfelder des Steps müssen ausgefüllt sein

    Returns:
    - valid=True wenn Step erfolgreich abgeschlossen
    - valid=False mit missing_fields wenn Felder fehlen

    Nicht erlaubt:
    - Step-Abschluss nach SUBMIT (Wizard ist read-only)
    """
    case = await _get_case_with_procedure(case_id, context.tenant["id"])
    _check_wizard_access(case)
    _check_wizard_write_access(case)  # Block after submit

    procedure_code = case.procedure.code

    # Wizard-Progress laden
    if not case.wizard_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "WIZARD_NOT_INITIALIZED",
                "message": "Call GET /wizard first to initialize wizard.",
            },
        )

    progress = case.wizard_progress
    completed_steps = progress.completed_steps if isinstance(progress.completed_steps, list) else []

    # Case-Fields als Dict
    case_fields: dict[str, Any] = {}
    for field in (case.fields or []):
        case_fields[field.key] = field.value_json

    # Step-Validierung
    validation = validate_step_completion(
        procedure_code=procedure_code,
        step_key=payload.step_key,
        case_fields=case_fields,
    )

    if not validation.valid:
        return CompleteStepResponse(
            data=StepValidationResponse(
                valid=False,
                missing_fields=validation.missing_fields,
                error_message=validation.error_message,
            )
        )

    # Step als abgeschlossen markieren (wenn nicht bereits)
    if payload.step_key not in completed_steps:
        completed_steps.append(payload.step_key)
        await prisma.wizardprogress.update(
            where={"id": progress.id},
            data={"completed_steps": completed_steps},
        )

    return CompleteStepResponse(
        data=StepValidationResponse(valid=True)
    )


@router.get("/{case_id}/wizard/steps", response_model=WizardResponse)
async def get_wizard_steps(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> WizardResponse:
    """
    Alias für GET /wizard - Holt Step-Definitionen mit aktuellem Zustand.

    Dieser Endpoint existiert für semantische Klarheit.
    """
    return await get_wizard_state(case_id, context)


@router.post("/{case_id}/wizard/reset", response_model=WizardResponse)
async def reset_wizard(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> WizardResponse:
    """
    Setzt den Wizard-Fortschritt zurück.

    Setzt:
    - current_step auf ersten Step
    - completed_steps auf []
    - is_completed auf false

    Case-Felder bleiben erhalten.

    Nicht erlaubt:
    - Reset nach SUBMIT (Wizard ist read-only, Submit ist irreversibel)
    """
    case = await _get_case_with_procedure(case_id, context.tenant["id"])
    _check_wizard_access(case)
    _check_wizard_write_access(case)  # Block after submit

    procedure_code = case.procedure.code
    steps_config = get_procedure_steps(procedure_code)
    first_step = steps_config.first_step if steps_config else ""

    if case.wizard_progress:
        # Reset existierenden Progress
        await prisma.wizardprogress.update(
            where={"id": case.wizard_progress.id},
            data={
                "current_step": first_step,
                "completed_steps": [],
                "is_completed": False,
            },
        )
    else:
        # Neuen Progress erstellen
        await prisma.wizardprogress.create(
            data={
                "case_id": case_id,
                "procedure_code": procedure_code,
                "current_step": first_step,
                "completed_steps": [],
                "is_completed": False,
            }
        )

    # Aktuellen State zurückgeben
    return await get_wizard_state(case_id, context)


class WizardCompleteResponse(BaseModel):
    """Ergebnis des Wizard-Abschlusses."""
    data: StepValidationResponse


@router.post("/{case_id}/wizard/complete", response_model=WizardCompleteResponse)
async def complete_wizard(
    case_id: str,
    context: AuthContext = Depends(get_current_user),
) -> WizardCompleteResponse:
    """
    Markiert den Wizard als vollständig abgeschlossen.

    Voraussetzungen:
    - Alle Steps (außer review) müssen abgeschlossen sein
    - Case muss IN_PROCESS sein

    Dieses Endpoint wird aufgerufen, wenn der Benutzer im Review-Step
    die Zusammenfassung akzeptiert hat.

    Nach erfolgreichem Abschluss:
    - wizard.is_completed = true
    - Case kann submitted werden

    Nicht erlaubt:
    - Abschluss nach SUBMIT (Wizard ist read-only)
    """
    case = await _get_case_with_procedure(case_id, context.tenant["id"])
    _check_wizard_access(case)
    _check_wizard_write_access(case)

    procedure_code = case.procedure.code

    # Wizard-Progress laden
    if not case.wizard_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "WIZARD_NOT_INITIALIZED",
                "message": "Call GET /wizard first to initialize wizard.",
            },
        )

    progress = case.wizard_progress
    completed_steps = progress.completed_steps if isinstance(progress.completed_steps, list) else []

    # Prüfe ob alle Steps (außer review) abgeschlossen sind
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "UNKNOWN_PROCEDURE",
                "message": f"Unknown procedure code: '{procedure_code}'",
            },
        )

    missing_steps = []
    for step in steps_config.steps:
        # Review-Step hat keine Pflichtfelder, muss aber nicht in completed_steps sein
        if step.step_key == "review":
            continue
        if step.step_key not in completed_steps:
            missing_steps.append(step.step_key)

    if missing_steps:
        return WizardCompleteResponse(
            data=StepValidationResponse(
                valid=False,
                missing_fields=None,
                error_message=f"Complete all steps before finishing. Missing: {', '.join(missing_steps)}",
            )
        )

    # Wizard als abgeschlossen markieren
    await prisma.wizardprogress.update(
        where={"id": progress.id},
        data={
            "is_completed": True,
            "current_step": "review",  # Setze auf Review als finalen Step
        },
    )

    # Review auch zu completed_steps hinzufügen
    if "review" not in completed_steps:
        completed_steps.append("review")
        await prisma.wizardprogress.update(
            where={"id": progress.id},
            data={"completed_steps": completed_steps},
        )

    return WizardCompleteResponse(
        data=StepValidationResponse(valid=True)
    )
