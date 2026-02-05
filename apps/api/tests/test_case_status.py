"""
Tests for Case Status Domain Logic.

Tests the new PREPARED/COMPLETED status model and transitions.
"""

import pytest
from app.domain.case_status import (
    CaseStatus,
    validate_status_transition,
    can_edit_fields,
    is_readonly,
    can_submit,
    can_reopen,
    can_complete,
    get_next_status,
    normalize_status,
    can_access_wizard,
    EDITABLE_STATUSES,
    READONLY_STATUSES,
)


# --- Status Enum Tests ---


def test_case_status_values():
    """Verify all expected status values exist."""
    assert CaseStatus.DRAFT.value == "DRAFT"
    assert CaseStatus.IN_PROCESS.value == "IN_PROCESS"
    assert CaseStatus.PREPARED.value == "PREPARED"
    assert CaseStatus.COMPLETED.value == "COMPLETED"
    assert CaseStatus.ARCHIVED.value == "ARCHIVED"
    assert CaseStatus.SUBMITTED.value == "SUBMITTED"  # Legacy


def test_normalize_status_submitted_to_prepared():
    """SUBMITTED should normalize to PREPARED."""
    assert normalize_status("SUBMITTED") == CaseStatus.PREPARED
    assert normalize_status("PREPARED") == CaseStatus.PREPARED
    assert normalize_status("DRAFT") == CaseStatus.DRAFT


# --- Transition Validation Tests ---


class TestStatusTransitions:
    """Test valid and invalid status transitions."""

    def test_draft_to_in_process_allowed(self):
        """DRAFT -> IN_PROCESS is allowed."""
        result = validate_status_transition("DRAFT", "IN_PROCESS")
        assert result.allowed is True

    def test_in_process_to_prepared_allowed(self):
        """IN_PROCESS -> PREPARED is allowed."""
        result = validate_status_transition("IN_PROCESS", "PREPARED")
        assert result.allowed is True

    def test_prepared_to_completed_allowed(self):
        """PREPARED -> COMPLETED is allowed."""
        result = validate_status_transition("PREPARED", "COMPLETED")
        assert result.allowed is True

    def test_completed_to_archived_allowed(self):
        """COMPLETED -> ARCHIVED is allowed."""
        result = validate_status_transition("COMPLETED", "ARCHIVED")
        assert result.allowed is True

    def test_prepared_to_in_process_allowed_reopen(self):
        """PREPARED -> IN_PROCESS (reopen) is allowed."""
        result = validate_status_transition("PREPARED", "IN_PROCESS")
        assert result.allowed is True

    def test_submitted_to_in_process_allowed_reopen(self):
        """SUBMITTED -> IN_PROCESS (reopen for legacy) is allowed."""
        result = validate_status_transition("SUBMITTED", "IN_PROCESS")
        assert result.allowed is True

    def test_submitted_to_completed_allowed(self):
        """SUBMITTED -> COMPLETED (legacy path) is allowed."""
        result = validate_status_transition("SUBMITTED", "COMPLETED")
        assert result.allowed is True

    def test_submitted_to_archived_allowed_legacy(self):
        """SUBMITTED -> ARCHIVED (legacy) is allowed."""
        result = validate_status_transition("SUBMITTED", "ARCHIVED")
        assert result.allowed is True

    def test_draft_to_prepared_not_allowed(self):
        """DRAFT -> PREPARED (skip) is not allowed."""
        result = validate_status_transition("DRAFT", "PREPARED")
        assert result.allowed is False
        assert result.error_code == "STATUS_SKIP_NOT_ALLOWED"

    def test_in_process_to_completed_not_allowed(self):
        """IN_PROCESS -> COMPLETED (skip) is not allowed."""
        result = validate_status_transition("IN_PROCESS", "COMPLETED")
        assert result.allowed is False

    def test_completed_to_in_process_not_allowed(self):
        """COMPLETED -> IN_PROCESS (rollback) is not allowed."""
        result = validate_status_transition("COMPLETED", "IN_PROCESS")
        assert result.allowed is False
        assert result.error_code == "STATUS_ROLLBACK_NOT_ALLOWED"

    def test_archived_cannot_change(self):
        """ARCHIVED cannot change to any status."""
        for target in ["DRAFT", "IN_PROCESS", "PREPARED", "COMPLETED"]:
            result = validate_status_transition("ARCHIVED", target)
            assert result.allowed is False
            assert result.error_code == "CASE_ARCHIVED"

    def test_same_status_not_allowed(self):
        """Transition to same status is not allowed."""
        result = validate_status_transition("PREPARED", "PREPARED")
        assert result.allowed is False
        assert result.error_code == "STATUS_UNCHANGED"

    def test_invalid_status_returns_error(self):
        """Invalid status values return error."""
        result = validate_status_transition("INVALID", "DRAFT")
        assert result.allowed is False
        assert result.error_code == "INVALID_STATUS"


# --- Editable Status Tests ---


class TestEditableStatus:
    """Test field editability based on status."""

    def test_draft_is_editable(self):
        """DRAFT cases are editable."""
        assert can_edit_fields("DRAFT") is True

    def test_in_process_is_editable(self):
        """IN_PROCESS cases are editable."""
        assert can_edit_fields("IN_PROCESS") is True

    def test_prepared_is_not_editable(self):
        """PREPARED cases are not editable."""
        assert can_edit_fields("PREPARED") is False

    def test_completed_is_not_editable(self):
        """COMPLETED cases are not editable."""
        assert can_edit_fields("COMPLETED") is False

    def test_archived_is_not_editable(self):
        """ARCHIVED cases are not editable."""
        assert can_edit_fields("ARCHIVED") is False

    def test_submitted_legacy_is_not_editable(self):
        """SUBMITTED (legacy) cases are not editable."""
        assert can_edit_fields("SUBMITTED") is False


class TestReadonlyStatus:
    """Test readonly flag based on status."""

    def test_draft_is_not_readonly(self):
        """DRAFT cases are not readonly."""
        assert is_readonly("DRAFT") is False

    def test_in_process_is_not_readonly(self):
        """IN_PROCESS cases are not readonly."""
        assert is_readonly("IN_PROCESS") is False

    def test_prepared_is_readonly(self):
        """PREPARED cases are readonly."""
        assert is_readonly("PREPARED") is True

    def test_completed_is_readonly(self):
        """COMPLETED cases are readonly."""
        assert is_readonly("COMPLETED") is True

    def test_archived_is_readonly(self):
        """ARCHIVED cases are readonly."""
        assert is_readonly("ARCHIVED") is True


# --- Action Permission Tests ---


class TestCanSubmit:
    """Test submit permission."""

    def test_can_submit_from_in_process(self):
        """Can submit from IN_PROCESS."""
        assert can_submit("IN_PROCESS") is True

    def test_cannot_submit_from_draft(self):
        """Cannot submit from DRAFT."""
        assert can_submit("DRAFT") is False

    def test_cannot_submit_from_prepared(self):
        """Cannot submit from PREPARED."""
        assert can_submit("PREPARED") is False


class TestCanReopen:
    """Test reopen permission."""

    def test_can_reopen_from_prepared(self):
        """Can reopen from PREPARED."""
        assert can_reopen("PREPARED") is True

    def test_can_reopen_from_submitted_legacy(self):
        """Can reopen from SUBMITTED (legacy)."""
        assert can_reopen("SUBMITTED") is True

    def test_cannot_reopen_from_in_process(self):
        """Cannot reopen from IN_PROCESS."""
        assert can_reopen("IN_PROCESS") is False

    def test_cannot_reopen_from_completed(self):
        """Cannot reopen from COMPLETED."""
        assert can_reopen("COMPLETED") is False


class TestCanComplete:
    """Test complete permission."""

    def test_can_complete_from_prepared(self):
        """Can complete from PREPARED."""
        assert can_complete("PREPARED") is True

    def test_can_complete_from_submitted_legacy(self):
        """Can complete from SUBMITTED (legacy)."""
        assert can_complete("SUBMITTED") is True

    def test_cannot_complete_from_in_process(self):
        """Cannot complete from IN_PROCESS."""
        assert can_complete("IN_PROCESS") is False

    def test_cannot_complete_from_draft(self):
        """Cannot complete from DRAFT."""
        assert can_complete("DRAFT") is False


# --- Next Status Tests ---


class TestGetNextStatus:
    """Test getting next status in sequence."""

    def test_next_from_draft(self):
        """Next status from DRAFT is IN_PROCESS."""
        assert get_next_status("DRAFT") == CaseStatus.IN_PROCESS

    def test_next_from_in_process(self):
        """Next status from IN_PROCESS is PREPARED."""
        assert get_next_status("IN_PROCESS") == CaseStatus.PREPARED

    def test_next_from_prepared(self):
        """Next status from PREPARED is COMPLETED."""
        assert get_next_status("PREPARED") == CaseStatus.COMPLETED

    def test_next_from_completed(self):
        """Next status from COMPLETED is ARCHIVED."""
        assert get_next_status("COMPLETED") == CaseStatus.ARCHIVED

    def test_next_from_archived_is_none(self):
        """Next status from ARCHIVED is None (end state)."""
        assert get_next_status("ARCHIVED") is None

    def test_next_from_submitted_legacy(self):
        """Next status from SUBMITTED (legacy) is COMPLETED."""
        assert get_next_status("SUBMITTED") == CaseStatus.COMPLETED


# --- Wizard Access Tests ---


class TestWizardAccess:
    """Test wizard access permissions."""

    def test_draft_no_access_without_procedure(self):
        """DRAFT without procedure cannot access wizard."""
        result = can_access_wizard("DRAFT", None)
        assert result.allowed is False
        assert result.error_code == "NO_PROCEDURE_SELECTED"

    def test_in_process_can_access_with_procedure(self):
        """IN_PROCESS with procedure can access wizard."""
        result = can_access_wizard("IN_PROCESS", "proc-123")
        assert result.allowed is True

    def test_prepared_can_access_readonly(self):
        """PREPARED can access wizard (readonly)."""
        result = can_access_wizard("PREPARED", "proc-123")
        assert result.allowed is True

    def test_completed_can_access_readonly(self):
        """COMPLETED can access wizard (readonly)."""
        result = can_access_wizard("COMPLETED", "proc-123")
        assert result.allowed is True

    def test_archived_can_access_readonly(self):
        """ARCHIVED can access wizard (readonly)."""
        result = can_access_wizard("ARCHIVED", "proc-123")
        assert result.allowed is True


# --- Status Sets Tests ---


class TestStatusSets:
    """Test status set definitions."""

    def test_editable_statuses(self):
        """Verify editable status set."""
        assert CaseStatus.DRAFT in EDITABLE_STATUSES
        assert CaseStatus.IN_PROCESS in EDITABLE_STATUSES
        assert CaseStatus.PREPARED not in EDITABLE_STATUSES
        assert CaseStatus.COMPLETED not in EDITABLE_STATUSES

    def test_readonly_statuses(self):
        """Verify readonly status set."""
        assert CaseStatus.PREPARED in READONLY_STATUSES
        assert CaseStatus.COMPLETED in READONLY_STATUSES
        assert CaseStatus.ARCHIVED in READONLY_STATUSES
        assert CaseStatus.SUBMITTED in READONLY_STATUSES
        assert CaseStatus.DRAFT not in READONLY_STATUSES
        assert CaseStatus.IN_PROCESS not in READONLY_STATUSES
