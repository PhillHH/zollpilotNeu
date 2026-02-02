"""
Case Status Domain Logic.

Definiert das zentrale Statusmodell für Cases und validiert Statusübergänge.

Erlaubte Übergänge:
    DRAFT → IN_PROCESS (Verfahren gewählt)
    IN_PROCESS → SUBMITTED (Anmeldung abgegeben)
    SUBMITTED → ARCHIVED (Fall abgeschlossen)

Keine Rücksprünge, kein Überspringen.
"""

from __future__ import annotations

from enum import Enum
from typing import NamedTuple


class CaseStatus(str, Enum):
    """
    Verbindliche Case-Status.

    DRAFT: Fall angelegt, kein Verfahren gestartet.
           - Kann bearbeitet werden
           - Kein Verfahren gebunden
           - Kann zu IN_PROCESS wechseln (wenn Verfahren gebunden wird)

    IN_PROCESS: Verfahren gewählt, Bearbeitung läuft.
                - Verfahren ist gebunden
                - Formularfelder können bearbeitet werden
                - Kann zu SUBMITTED wechseln (wenn Validierung erfolgreich)

    SUBMITTED: Anmeldung abgegeben.
               - Snapshot wurde erstellt
               - Formularfelder sind nicht mehr editierbar
               - Kann zu ARCHIVED wechseln

    ARCHIVED: Fall abgeschlossen / abgelegt.
              - Endstatus
              - Keine weiteren Übergänge möglich
    """
    DRAFT = "DRAFT"
    IN_PROCESS = "IN_PROCESS"
    SUBMITTED = "SUBMITTED"
    ARCHIVED = "ARCHIVED"


class StatusTransitionResult(NamedTuple):
    """Ergebnis einer Statusübergang-Validierung."""
    allowed: bool
    error_code: str | None = None
    error_message: str | None = None


# Definiere erlaubte Übergänge als Set von Tupeln (von_status, nach_status)
ALLOWED_TRANSITIONS: set[tuple[CaseStatus, CaseStatus]] = {
    (CaseStatus.DRAFT, CaseStatus.IN_PROCESS),
    (CaseStatus.IN_PROCESS, CaseStatus.SUBMITTED),
    (CaseStatus.SUBMITTED, CaseStatus.ARCHIVED),
}


def validate_status_transition(
    current_status: str,
    target_status: str,
) -> StatusTransitionResult:
    """
    Validiert ob ein Statusübergang erlaubt ist.

    Args:
        current_status: Aktueller Status des Cases
        target_status: Gewünschter Zielstatus

    Returns:
        StatusTransitionResult mit allowed=True wenn erlaubt,
        sonst allowed=False mit error_code und error_message.
    """
    try:
        current = CaseStatus(current_status)
        target = CaseStatus(target_status)
    except ValueError:
        return StatusTransitionResult(
            allowed=False,
            error_code="INVALID_STATUS",
            error_message=f"Invalid status value: '{current_status}' or '{target_status}'",
        )

    # Prüfe ob Übergang erlaubt
    if (current, target) in ALLOWED_TRANSITIONS:
        return StatusTransitionResult(allowed=True)

    # Spezifische Fehlermeldungen je nach Fall
    if current == target:
        return StatusTransitionResult(
            allowed=False,
            error_code="STATUS_UNCHANGED",
            error_message=f"Case is already in status {current.value}.",
        )

    if current == CaseStatus.ARCHIVED:
        return StatusTransitionResult(
            allowed=False,
            error_code="CASE_ARCHIVED",
            error_message="Archived cases cannot change status.",
        )

    # Rücksprung versucht?
    status_order = [CaseStatus.DRAFT, CaseStatus.IN_PROCESS, CaseStatus.SUBMITTED, CaseStatus.ARCHIVED]
    current_idx = status_order.index(current)
    target_idx = status_order.index(target)

    if target_idx < current_idx:
        return StatusTransitionResult(
            allowed=False,
            error_code="STATUS_ROLLBACK_NOT_ALLOWED",
            error_message=f"Cannot transition from {current.value} back to {target.value}. Status rollbacks are not allowed.",
        )

    # Überspringen versucht?
    if target_idx > current_idx + 1:
        expected_next = status_order[current_idx + 1]
        return StatusTransitionResult(
            allowed=False,
            error_code="STATUS_SKIP_NOT_ALLOWED",
            error_message=f"Cannot skip from {current.value} to {target.value}. Next allowed status is {expected_next.value}.",
        )

    # Fallback (sollte nicht erreicht werden)
    return StatusTransitionResult(
        allowed=False,
        error_code="INVALID_TRANSITION",
        error_message=f"Transition from {current.value} to {target.value} is not allowed.",
    )


def can_edit_fields(status: str) -> bool:
    """
    Prüft ob Formularfelder bei diesem Status bearbeitet werden können.

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Felder editierbar, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        return case_status in (CaseStatus.DRAFT, CaseStatus.IN_PROCESS)
    except ValueError:
        return False


def can_bind_procedure(status: str) -> bool:
    """
    Prüft ob ein Verfahren bei diesem Status gebunden werden kann.

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Verfahren gebunden werden kann, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        # Nur DRAFT erlaubt, da IN_PROCESS bedeutet, dass bereits ein Verfahren gebunden ist
        return case_status == CaseStatus.DRAFT
    except ValueError:
        return False


def can_submit(status: str) -> bool:
    """
    Prüft ob ein Case bei diesem Status eingereicht werden kann.

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Submit möglich, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        return case_status == CaseStatus.IN_PROCESS
    except ValueError:
        return False


def get_next_status(current_status: str) -> CaseStatus | None:
    """
    Gibt den nächsten erlaubten Status zurück.

    Args:
        current_status: Aktueller Case-Status

    Returns:
        Nächster Status oder None wenn Endstatus erreicht.
    """
    try:
        current = CaseStatus(current_status)
    except ValueError:
        return None

    status_order = [CaseStatus.DRAFT, CaseStatus.IN_PROCESS, CaseStatus.SUBMITTED, CaseStatus.ARCHIVED]
    current_idx = status_order.index(current)

    if current_idx >= len(status_order) - 1:
        return None  # ARCHIVED ist Endstatus

    return status_order[current_idx + 1]


# =============================================================================
# Wizard-Start Guards (Systemgrenze: Verfahrensauswahl)
# =============================================================================


class WizardAccessResult(NamedTuple):
    """Ergebnis einer Wizard-Zugriffsprüfung."""
    allowed: bool
    error_code: str | None = None
    error_message: str | None = None


def can_access_wizard(status: str, procedure_id: str | None) -> WizardAccessResult:
    """
    Prüft ob der Wizard für diesen Case betreten werden darf.

    Die Verfahrensauswahl ist eine SYSTEMGRENZE:
    - Kein Wizard-Zugriff ohne gebundenes Verfahren
    - Kein Wizard-Zugriff wenn nicht IN_PROCESS

    Args:
        status: Aktueller Case-Status
        procedure_id: ID des gebundenen Verfahrens (oder None)

    Returns:
        WizardAccessResult mit allowed=True wenn erlaubt,
        sonst allowed=False mit error_code und error_message.
    """
    # Prüfe Status
    try:
        case_status = CaseStatus(status)
    except ValueError:
        return WizardAccessResult(
            allowed=False,
            error_code="INVALID_STATUS",
            error_message=f"Invalid case status: '{status}'",
        )

    # DRAFT: Noch kein Verfahren gewählt
    if case_status == CaseStatus.DRAFT:
        return WizardAccessResult(
            allowed=False,
            error_code="NO_PROCEDURE_SELECTED",
            error_message="Cannot access wizard. Select a procedure first to start the process.",
        )

    # SUBMITTED/ARCHIVED: Wizard nicht mehr zugänglich (nur lesend)
    if case_status in (CaseStatus.SUBMITTED, CaseStatus.ARCHIVED):
        return WizardAccessResult(
            allowed=False,
            error_code="CASE_NOT_EDITABLE",
            error_message=f"Cannot edit case in status '{status}'. Case is read-only.",
        )

    # IN_PROCESS: Prüfe ob Verfahren gebunden
    if case_status == CaseStatus.IN_PROCESS:
        if not procedure_id:
            # Sollte nicht passieren (Status-Invariante verletzt)
            return WizardAccessResult(
                allowed=False,
                error_code="INVARIANT_VIOLATION",
                error_message="Case is IN_PROCESS but has no procedure bound. This is a data integrity issue.",
            )
        return WizardAccessResult(allowed=True)

    # Fallback (sollte nicht erreicht werden)
    return WizardAccessResult(
        allowed=False,
        error_code="UNKNOWN_STATE",
        error_message=f"Unknown state: status='{status}', procedure_id='{procedure_id}'",
    )


def require_wizard_access(status: str, procedure_id: str | None) -> None:
    """
    Wirft einen Fehler wenn Wizard-Zugriff nicht erlaubt.

    Convenience-Funktion für Guards in API-Endpoints.

    Args:
        status: Aktueller Case-Status
        procedure_id: ID des gebundenen Verfahrens (oder None)

    Raises:
        ValueError: Wenn Zugriff nicht erlaubt
    """
    result = can_access_wizard(status, procedure_id)
    if not result.allowed:
        raise ValueError(f"{result.error_code}: {result.error_message}")


def is_procedure_change_allowed(status: str) -> bool:
    """
    Prüft ob ein Verfahrenswechsel erlaubt ist.

    Re-Binding-Regeln:
    - DRAFT: Erste Bindung (kein Re-Binding)
    - IN_PROCESS: Re-Binding zu anderem Verfahren erlaubt
    - SUBMITTED/ARCHIVED: Kein Re-Binding

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Verfahrenswechsel möglich, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        return case_status in (CaseStatus.DRAFT, CaseStatus.IN_PROCESS)
    except ValueError:
        return False
