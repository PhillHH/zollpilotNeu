"""
Wizard Domain Logic.

Dieses Modul enthält die gesamte Logik für das generische Wizard-System:
- Navigation zwischen Steps
- Validierung von Step-Übergängen
- Fortschrittsverwaltung

WICHTIG:
- Der Wizard ist an den Case-Status gebunden (nur IN_PROCESS)
- Alle Verfahren nutzen denselben Wizard-Mechanismus
- Step-Definitionen kommen aus wizard_steps.py
"""

from __future__ import annotations

from typing import NamedTuple, Any

from app.domain.wizard_steps import get_procedure_steps, ProcedureSteps, StepDefinition
from app.domain.case_status import CaseStatus


# =============================================================================
# Result Types
# =============================================================================


class NavigationResult(NamedTuple):
    """Ergebnis einer Wizard-Navigation."""
    allowed: bool
    target_step: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class StepValidationResult(NamedTuple):
    """Ergebnis einer Step-Validierung."""
    valid: bool
    missing_fields: list[str] | None = None
    error_message: str | None = None


class WizardState(NamedTuple):
    """Aktueller Wizard-Zustand."""
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


# =============================================================================
# Wizard Access Validation
# =============================================================================


def validate_wizard_access(
    case_status: str,
    procedure_id: str | None,
    procedure_code: str | None,
) -> NavigationResult:
    """
    Validiert ob der Wizard für einen Case zugänglich ist.

    Bedingungen:
    - case.status == IN_PROCESS
    - case.procedure != null

    Args:
        case_status: Aktueller Case-Status
        procedure_id: ID des gebundenen Verfahrens
        procedure_code: Code des gebundenen Verfahrens

    Returns:
        NavigationResult mit allowed=True wenn zugänglich
    """
    # Status muss IN_PROCESS sein
    if case_status != CaseStatus.IN_PROCESS.value:
        if case_status == CaseStatus.DRAFT.value:
            return NavigationResult(
                allowed=False,
                error_code="WIZARD_NOT_AVAILABLE",
                error_message="Wizard not available. Select a procedure first.",
            )
        elif case_status in (CaseStatus.SUBMITTED.value, CaseStatus.ARCHIVED.value):
            return NavigationResult(
                allowed=False,
                error_code="CASE_READ_ONLY",
                error_message=f"Case is in status '{case_status}'. Wizard is read-only.",
            )
        else:
            return NavigationResult(
                allowed=False,
                error_code="INVALID_STATUS",
                error_message=f"Invalid case status: '{case_status}'",
            )

    # Verfahren muss gebunden sein
    if not procedure_id or not procedure_code:
        return NavigationResult(
            allowed=False,
            error_code="NO_PROCEDURE_BOUND",
            error_message="No procedure bound to case.",
        )

    # Step-Konfiguration muss existieren
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        return NavigationResult(
            allowed=False,
            error_code="UNKNOWN_PROCEDURE",
            error_message=f"Unknown procedure code: '{procedure_code}'",
        )

    return NavigationResult(allowed=True)


# =============================================================================
# Step Navigation
# =============================================================================


def validate_step_navigation(
    procedure_code: str,
    current_step: str,
    target_step: str,
    completed_steps: list[str],
) -> NavigationResult:
    """
    Validiert ob eine Step-Navigation erlaubt ist.

    Erlaubt:
    - Nächster Step (wenn aktueller Step abgeschlossen)
    - Vorheriger Step (immer)
    - Aktueller Step (Neulade)
    - Bereits abgeschlossene Steps

    Nicht erlaubt:
    - Überspringen nicht abgeschlossener Steps
    - Review ohne vollständige vorherige Steps

    Args:
        procedure_code: IZA, IAA oder IPK
        current_step: Aktueller Step-Key
        target_step: Ziel-Step-Key
        completed_steps: Liste abgeschlossener Step-Keys

    Returns:
        NavigationResult mit allowed=True wenn Navigation erlaubt
    """
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        return NavigationResult(
            allowed=False,
            error_code="UNKNOWN_PROCEDURE",
            error_message=f"Unknown procedure code: '{procedure_code}'",
        )

    # Ziel-Step muss existieren
    if not steps_config.is_valid_step(target_step):
        return NavigationResult(
            allowed=False,
            error_code="INVALID_STEP",
            error_message=f"Invalid step: '{target_step}'",
        )

    current_idx = steps_config.get_step_index(current_step)
    target_idx = steps_config.get_step_index(target_step)

    # Gleicher Step: immer erlaubt (Neulade)
    if target_step == current_step:
        return NavigationResult(allowed=True, target_step=target_step)

    # Zurück: immer erlaubt
    if target_idx < current_idx:
        return NavigationResult(allowed=True, target_step=target_step)

    # Bereits abgeschlossene Steps: erlaubt
    if target_step in completed_steps:
        return NavigationResult(allowed=True, target_step=target_step)

    # Vorwärts: Nur zum nächsten Step (kein Überspringen)
    if target_idx > current_idx + 1:
        # Prüfe ob alle Steps dazwischen abgeschlossen sind
        for i in range(current_idx, target_idx):
            step_key = steps_config.step_keys[i]
            if step_key not in completed_steps:
                return NavigationResult(
                    allowed=False,
                    error_code="STEP_NOT_COMPLETED",
                    error_message=f"Cannot skip to '{target_step}'. Complete '{step_key}' first.",
                )
        return NavigationResult(allowed=True, target_step=target_step)

    # Nächster Step: Prüfe ob aktueller Step abgeschlossen
    if target_idx == current_idx + 1:
        if current_step not in completed_steps:
            return NavigationResult(
                allowed=False,
                error_code="CURRENT_STEP_NOT_COMPLETED",
                error_message=f"Complete current step '{current_step}' before proceeding.",
            )
        return NavigationResult(allowed=True, target_step=target_step)

    # Fallback
    return NavigationResult(allowed=True, target_step=target_step)


def can_access_review(
    procedure_code: str,
    completed_steps: list[str],
) -> NavigationResult:
    """
    Prüft ob der Review-Step zugänglich ist.

    Bedingung: Alle Steps vor Review müssen abgeschlossen sein.

    Args:
        procedure_code: IZA, IAA oder IPK
        completed_steps: Liste abgeschlossener Step-Keys

    Returns:
        NavigationResult mit allowed=True wenn Review zugänglich
    """
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        return NavigationResult(
            allowed=False,
            error_code="UNKNOWN_PROCEDURE",
            error_message=f"Unknown procedure code: '{procedure_code}'",
        )

    # Alle Steps vor Review müssen abgeschlossen sein
    review_idx = steps_config.get_step_index("review")
    if review_idx < 0:
        # Kein Review-Step definiert (sollte nicht passieren)
        return NavigationResult(allowed=True)

    missing_steps = []
    for i in range(review_idx):
        step_key = steps_config.step_keys[i]
        if step_key not in completed_steps:
            missing_steps.append(step_key)

    if missing_steps:
        return NavigationResult(
            allowed=False,
            error_code="INCOMPLETE_STEPS",
            error_message=f"Complete all steps before review. Missing: {', '.join(missing_steps)}",
        )

    return NavigationResult(allowed=True)


# =============================================================================
# Step Validation
# =============================================================================


def validate_step_completion(
    procedure_code: str,
    step_key: str,
    case_fields: dict[str, Any],
) -> StepValidationResult:
    """
    Validiert ob ein Step als abgeschlossen markiert werden kann.

    Prüft ob alle Pflichtfelder des Steps ausgefüllt sind.

    Args:
        procedure_code: IZA, IAA oder IPK
        step_key: Der zu validierende Step
        case_fields: Dict der Case-Felder {field_key: value}

    Returns:
        StepValidationResult mit valid=True wenn alle Pflichtfelder ausgefüllt
    """
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        return StepValidationResult(
            valid=False,
            error_message=f"Unknown procedure code: '{procedure_code}'",
        )

    step_def = steps_config.get_step(step_key)
    if not step_def:
        return StepValidationResult(
            valid=False,
            error_message=f"Invalid step: '{step_key}'",
        )

    # Prüfe Pflichtfelder
    missing_fields = []
    for field_key in step_def.required_fields:
        value = case_fields.get(field_key)
        if value is None or value == "" or value == []:
            missing_fields.append(field_key)

    if missing_fields:
        return StepValidationResult(
            valid=False,
            missing_fields=missing_fields,
            error_message=f"Missing required fields: {', '.join(missing_fields)}",
        )

    return StepValidationResult(valid=True)


# =============================================================================
# Wizard State
# =============================================================================


def build_wizard_state(
    case_id: str,
    procedure_code: str,
    current_step: str,
    completed_steps: list[str],
    is_completed: bool,
) -> WizardState:
    """
    Baut den vollständigen Wizard-Zustand.

    Args:
        case_id: Case-ID
        procedure_code: IZA, IAA oder IPK
        current_step: Aktueller Step-Key
        completed_steps: Liste abgeschlossener Step-Keys
        is_completed: Ob der Wizard abgeschlossen ist

    Returns:
        WizardState mit allen relevanten Informationen
    """
    steps_config = get_procedure_steps(procedure_code)
    if not steps_config:
        # Fallback für unbekanntes Verfahren
        return WizardState(
            case_id=case_id,
            procedure_code=procedure_code,
            current_step=current_step,
            completed_steps=completed_steps,
            is_completed=is_completed,
            total_steps=0,
            current_step_index=-1,
            can_go_back=False,
            can_go_forward=False,
            can_submit=False,
        )

    total_steps = len(steps_config.steps)
    current_idx = steps_config.get_step_index(current_step)

    # Navigation berechnen
    can_go_back = current_idx > 0
    can_go_forward = (
        current_step in completed_steps
        and current_idx < total_steps - 1
    )

    # Submit nur wenn alle Steps abgeschlossen und auf Review
    review_access = can_access_review(procedure_code, completed_steps)
    can_submit = (
        review_access.allowed
        and current_step == steps_config.last_step
    )

    return WizardState(
        case_id=case_id,
        procedure_code=procedure_code,
        current_step=current_step,
        completed_steps=completed_steps,
        is_completed=is_completed,
        total_steps=total_steps,
        current_step_index=current_idx,
        can_go_back=can_go_back,
        can_go_forward=can_go_forward,
        can_submit=can_submit,
    )


def get_initial_wizard_state(
    case_id: str,
    procedure_code: str,
) -> WizardState:
    """
    Erstellt den initialen Wizard-Zustand für einen neuen Wizard.

    Args:
        case_id: Case-ID
        procedure_code: IZA, IAA oder IPK

    Returns:
        WizardState mit erstem Step als current_step
    """
    steps_config = get_procedure_steps(procedure_code)
    first_step = steps_config.first_step if steps_config else ""

    return build_wizard_state(
        case_id=case_id,
        procedure_code=procedure_code,
        current_step=first_step,
        completed_steps=[],
        is_completed=False,
    )
