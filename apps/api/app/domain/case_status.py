"""
Case Status Domain Logic.

Definiert das zentrale Statusmodell für Cases und validiert Statusübergänge.

Erlaubte Übergänge:
    DRAFT → IN_PROCESS (Verfahren gewählt)
    IN_PROCESS → PREPARED (Vorbereitung abgeschlossen)
    PREPARED → IN_PROCESS (Daten korrigieren / Reopen)
    PREPARED → COMPLETED (Zollanmeldung beim Zoll eingereicht)
    COMPLETED → ARCHIVED (Fall archivieren)

Status-Semantik:
    DRAFT: Neu erstellt, kein Verfahren gebunden
    IN_PROCESS: Verfahren gebunden, Wizard editierbar
    PREPARED: Vorbereitung abgeschlossen, bereit für Zollanmeldung
    COMPLETED: Nutzer hat Zollanmeldung beim Zoll eingereicht
    ARCHIVED: Fall abgelegt

Hinweis: SUBMITTED ist deprecated und wird zu PREPARED migriert.
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
                - Kann zu PREPARED wechseln (wenn Validierung erfolgreich)

    PREPARED: Vorbereitung abgeschlossen.
              - Snapshot wurde erstellt
              - Formularfelder sind nicht mehr editierbar
              - Bereit für Zollanmeldung beim Zoll
              - Kann zu IN_PROCESS zurück (Daten korrigieren)
              - Kann zu COMPLETED wechseln (Zollanmeldung eingereicht)

    COMPLETED: Zollanmeldung beim Zoll eingereicht.
               - Nutzer hat bestätigt, dass Zollanmeldung erfolgt ist
               - Formularfelder sind nicht mehr editierbar
               - Kann zu ARCHIVED wechseln

    ARCHIVED: Fall abgeschlossen / abgelegt.
              - Endstatus
              - Keine weiteren Übergänge möglich

    SUBMITTED: DEPRECATED - Alias für PREPARED (Migration)
    """
    DRAFT = "DRAFT"
    IN_PROCESS = "IN_PROCESS"
    PREPARED = "PREPARED"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"
    # Deprecated alias for backwards compatibility
    SUBMITTED = "SUBMITTED"


class StatusTransitionResult(NamedTuple):
    """Ergebnis einer Statusübergang-Validierung."""
    allowed: bool
    error_code: str | None = None
    error_message: str | None = None


# Definiere erlaubte Übergänge als Set von Tupeln (von_status, nach_status)
ALLOWED_TRANSITIONS: set[tuple[CaseStatus, CaseStatus]] = {
    # Vorwärts-Übergänge
    (CaseStatus.DRAFT, CaseStatus.IN_PROCESS),      # Verfahren binden
    (CaseStatus.IN_PROCESS, CaseStatus.PREPARED),   # Vorbereitung abschließen
    (CaseStatus.PREPARED, CaseStatus.COMPLETED),    # Zollanmeldung eingereicht
    (CaseStatus.COMPLETED, CaseStatus.ARCHIVED),    # Archivieren
    # Rückwärts-Übergang (Daten korrigieren)
    (CaseStatus.PREPARED, CaseStatus.IN_PROCESS),   # Reopen
    # Legacy support: SUBMITTED -> ARCHIVED (für existierende Fälle)
    (CaseStatus.SUBMITTED, CaseStatus.ARCHIVED),
    # Legacy support: IN_PROCESS -> SUBMITTED (wird intern zu PREPARED)
    (CaseStatus.IN_PROCESS, CaseStatus.SUBMITTED),
}

# Read-only Status (Wizard nicht editierbar)
READONLY_STATUSES: set[CaseStatus] = {
    CaseStatus.PREPARED,
    CaseStatus.COMPLETED,
    CaseStatus.ARCHIVED,
    CaseStatus.SUBMITTED,  # Legacy
}

# Editable Status (Wizard editierbar)
EDITABLE_STATUSES: set[CaseStatus] = {
    CaseStatus.DRAFT,
    CaseStatus.IN_PROCESS,
}


def normalize_status(status: str) -> CaseStatus:
    """
    Normalisiert Status-Werte (SUBMITTED -> PREPARED für neue Logik).

    Args:
        status: Status-String

    Returns:
        Normalisierter CaseStatus
    """
    case_status = CaseStatus(status)
    # SUBMITTED wird als PREPARED behandelt (für Logik-Zwecke)
    if case_status == CaseStatus.SUBMITTED:
        return CaseStatus.PREPARED
    return case_status


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

    # Normalisiere für zusätzliche Prüfungen (SUBMITTED -> PREPARED)
    current_normalized = normalize_status(current_status)
    target_normalized = normalize_status(target_status)

    # Nach Normalisierung nochmal prüfen
    if (current_normalized, target_normalized) in ALLOWED_TRANSITIONS:
        return StatusTransitionResult(allowed=True)

    # Spezifische Fehlermeldungen je nach Fall
    if current == target or current_normalized == target_normalized:
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

    if current == CaseStatus.COMPLETED or current_normalized == CaseStatus.COMPLETED:
        if target_normalized != CaseStatus.ARCHIVED:
            return StatusTransitionResult(
                allowed=False,
                error_code="CASE_COMPLETED",
                error_message="Completed cases can only be archived.",
            )

    # Status-Ordnung für Vorwärts-Prüfung (ohne Rückwärts-Möglichkeiten)
    # PREPARED -> IN_PROCESS ist explizit erlaubt (Reopen)
    status_order = [
        CaseStatus.DRAFT,
        CaseStatus.IN_PROCESS,
        CaseStatus.PREPARED,
        CaseStatus.COMPLETED,
        CaseStatus.ARCHIVED,
    ]

    try:
        current_idx = status_order.index(current_normalized)
        target_idx = status_order.index(target_normalized)
    except ValueError:
        # Legacy status (SUBMITTED) - sollte durch Normalisierung abgefangen sein
        return StatusTransitionResult(
            allowed=False,
            error_code="INVALID_TRANSITION",
            error_message=f"Transition from {current.value} to {target.value} is not allowed.",
        )

    # Rücksprung versucht? (außer PREPARED -> IN_PROCESS)
    if target_idx < current_idx:
        if not (current_normalized == CaseStatus.PREPARED and target_normalized == CaseStatus.IN_PROCESS):
            return StatusTransitionResult(
                allowed=False,
                error_code="STATUS_ROLLBACK_NOT_ALLOWED",
                error_message=f"Cannot transition from {current.value} back to {target.value}.",
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

    Editierbar: DRAFT, IN_PROCESS
    Read-only: PREPARED, COMPLETED, ARCHIVED, SUBMITTED (legacy)

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Felder editierbar, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        return case_status in EDITABLE_STATUSES
    except ValueError:
        return False


def is_readonly(status: str) -> bool:
    """
    Prüft ob der Case im Read-only-Modus ist.

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn readonly, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        # Normalisiere SUBMITTED -> PREPARED
        normalized = normalize_status(status)
        return normalized in READONLY_STATUSES
    except ValueError:
        return True  # Bei unbekanntem Status: readonly


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

    Submit = Vorbereitung abschließen (IN_PROCESS -> PREPARED)

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


def can_reopen(status: str) -> bool:
    """
    Prüft ob ein Case wieder geöffnet werden kann (Daten korrigieren).

    Reopen = PREPARED -> IN_PROCESS

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Reopen möglich, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        # Sowohl PREPARED als auch SUBMITTED (legacy) können reopened werden
        return case_status in (CaseStatus.PREPARED, CaseStatus.SUBMITTED)
    except ValueError:
        return False


def can_complete(status: str) -> bool:
    """
    Prüft ob ein Case als erledigt markiert werden kann.

    Complete = PREPARED -> COMPLETED (Nutzer hat Zollanmeldung eingereicht)

    Args:
        status: Aktueller Case-Status

    Returns:
        True wenn Complete möglich, False sonst.
    """
    try:
        case_status = CaseStatus(status)
        # Sowohl PREPARED als auch SUBMITTED (legacy) können completed werden
        return case_status in (CaseStatus.PREPARED, CaseStatus.SUBMITTED)
    except ValueError:
        return False


def get_next_status(current_status: str) -> CaseStatus | None:
    """
    Gibt den nächsten erlaubten Status zurück (Vorwärts-Richtung).

    Args:
        current_status: Aktueller Case-Status

    Returns:
        Nächster Status oder None wenn Endstatus erreicht.
    """
    try:
        current = CaseStatus(current_status)
    except ValueError:
        return None

    # Normalisiere SUBMITTED -> PREPARED
    current = normalize_status(current_status)

    status_order = [
        CaseStatus.DRAFT,
        CaseStatus.IN_PROCESS,
        CaseStatus.PREPARED,
        CaseStatus.COMPLETED,
        CaseStatus.ARCHIVED,
    ]

    try:
        current_idx = status_order.index(current)
    except ValueError:
        return None

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
    - IN_PROCESS: Vollzugriff (editierbar)
    - PREPARED/SUBMITTED/COMPLETED/ARCHIVED: Nur-Lesen-Zugriff

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

    # Prüfe ob Verfahren gebunden ist
    if not procedure_id:
        # Sollte nicht passieren (Status-Invariante verletzt)
        return WizardAccessResult(
            allowed=False,
            error_code="INVARIANT_VIOLATION",
            error_message=f"Case is {status} but has no procedure bound. This is a data integrity issue.",
        )

    # IN_PROCESS: Vollzugriff
    if case_status == CaseStatus.IN_PROCESS:
        return WizardAccessResult(allowed=True)

    # PREPARED/SUBMITTED/COMPLETED/ARCHIVED: Zugriff erlaubt (aber readonly im Frontend)
    if case_status in (
        CaseStatus.PREPARED,
        CaseStatus.SUBMITTED,
        CaseStatus.COMPLETED,
        CaseStatus.ARCHIVED,
    ):
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
