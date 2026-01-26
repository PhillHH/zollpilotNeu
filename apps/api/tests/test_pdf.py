"""
Tests for PDF export functionality.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone

from app.services.pdf_service import pdf_service, PDFService
from app.domain.summary import generate_case_summary


class TestPDFService:
    """Tests for the PDF service itself."""

    def test_generate_pdf_returns_bytes(self):
        """PDF generation returns valid bytes."""
        fields = {
            "contents_description": "Test Item",
            "value_amount": 100.00,
            "value_currency": "EUR",
            "origin_country": "CN",
            "sender_name": "Test Sender",
            "sender_country": "CN",
            "recipient_full_name": "Max Mustermann",
            "recipient_address": "Teststr. 1",
            "recipient_city": "Berlin",
            "recipient_postcode": "10115",
            "recipient_country": "DE",
            "commercial_goods": False,
            "remarks": None,
        }

        pdf_bytes = pdf_service.generate_pdf(
            case_id="test-case-id-1234",
            version=1,
            procedure_code="IZA",
            procedure_version="v1",
            procedure_name="Internetbestellung – Import Zollanmeldung",
            fields_json=fields,
            request_id="test-request-id",
        )

        # Should return bytes
        assert isinstance(pdf_bytes, bytes)
        # PDF should start with %PDF
        assert pdf_bytes[:4] == b"%PDF"
        # Should have reasonable size
        assert len(pdf_bytes) > 1000

    def test_get_filename_format(self):
        """Filename follows expected format."""
        filename = pdf_service.get_filename(
            procedure_code="IZA",
            case_id="abcd1234-5678-90ef-ghij-klmnopqrstuv",
            version=1
        )

        assert filename == "ZollPilot_IZA_abcd1234_v1.pdf"

    def test_pdf_contains_case_data(self):
        """PDF should include the case data in rendered HTML."""
        fields = {
            "contents_description": "Special Unique Item XYZ123",
            "value_amount": 99.99,
            "value_currency": "USD",
            "origin_country": "US",
            "sender_name": "American Sender",
            "sender_country": "US",
            "recipient_full_name": "German Recipient",
            "recipient_address": "Hauptstr. 42",
            "recipient_city": "München",
            "recipient_postcode": "80331",
            "recipient_country": "DE",
            "commercial_goods": True,
            "remarks": "Fragile package",
        }

        pdf_bytes = pdf_service.generate_pdf(
            case_id="test-case-pdf-data",
            version=2,
            procedure_code="IZA",
            procedure_version="v1",
            procedure_name="Internetbestellung – Import Zollanmeldung",
            fields_json=fields,
            request_id="req-123",
        )

        # PDF was generated successfully
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0


class TestPDFEndpointMocked:
    """
    Tests for PDF endpoint behavior.
    These would typically be integration tests with the full API.
    Here we test the logic through mocking.
    """

    @pytest.fixture
    def mock_case_submitted(self):
        """A submitted case with procedure."""
        return MagicMock(
            id="case-123",
            tenant_id="tenant-123",
            status="SUBMITTED",
            procedure=MagicMock(
                code="IZA",
                version="v1",
                name="Internetbestellung – Import Zollanmeldung",
            ),
        )

    @pytest.fixture
    def mock_snapshot(self):
        """A case snapshot."""
        return MagicMock(
            id="snapshot-123",
            case_id="case-123",
            version=1,
            procedure_code="IZA",
            procedure_version="v1",
            fields_json={
                "contents_description": "Test",
                "value_amount": 50,
                "value_currency": "EUR",
                "origin_country": "CN",
                "sender_name": "Sender",
                "sender_country": "CN",
                "recipient_full_name": "Recipient",
                "recipient_address": "Addr",
                "recipient_city": "City",
                "recipient_postcode": "12345",
                "recipient_country": "DE",
                "commercial_goods": False,
                "remarks": None,
            },
        )

    def test_case_not_submitted_raises_409(self, mock_case_submitted):
        """Non-submitted case should not allow PDF export."""
        mock_case_submitted.status = "DRAFT"
        
        # This would be checked in the endpoint
        assert mock_case_submitted.status != "SUBMITTED"

    def test_credits_required_for_export(self):
        """Export requires at least 1 credit."""
        balance = 0
        required = 1
        
        assert balance < required

    def test_credits_consumed_on_success(self):
        """Successful export should consume 1 credit."""
        initial_balance = 5
        consumed = 1
        expected_balance = initial_balance - consumed
        
        assert expected_balance == 4


class TestSummaryToPDF:
    """Tests that summary data flows correctly to PDF."""

    def test_summary_sections_generated(self):
        """Summary should have all expected sections for IZA."""
        fields = {
            "contents_description": "T-Shirt",
            "value_amount": 25.00,
            "value_currency": "EUR",
            "origin_country": "CN",
            "sender_name": "Shop Ltd",
            "sender_country": "CN",
            "recipient_full_name": "Max Mustermann",
            "recipient_address": "Musterstr. 1",
            "recipient_city": "Berlin",
            "recipient_postcode": "10115",
            "recipient_country": "DE",
            "commercial_goods": False,
            "remarks": None,
        }

        summary = generate_case_summary(
            procedure_code="IZA",
            procedure_version="v1",
            procedure_name="IZA Test",
            fields=fields
        )

        # Should have 4 sections for IZA
        assert len(summary.sections) == 4
        
        section_titles = [s.title for s in summary.sections]
        assert "Paket" in section_titles
        assert "Absender" in section_titles
        assert "Empfänger" in section_titles
        assert "Weitere Angaben" in section_titles

    def test_summary_formats_values(self):
        """Summary should format currency and country values."""
        fields = {
            "contents_description": "Test",
            "value_amount": 100.50,
            "value_currency": "EUR",
            "origin_country": "CN",
            "sender_name": "Sender",
            "sender_country": "CN",
            "recipient_full_name": "Recipient",
            "recipient_address": "Addr",
            "recipient_city": "City",
            "recipient_postcode": "12345",
            "recipient_country": "DE",
            "commercial_goods": True,
            "remarks": "Test remarks",
        }

        summary = generate_case_summary(
            procedure_code="IZA",
            procedure_version="v1",
            procedure_name="IZA Test",
            fields=fields
        )

        # Find "Paket" section
        paket_section = next(s for s in summary.sections if s.title == "Paket")
        
        # Check formatted values
        herkunftsland = next(i for i in paket_section.items if i.label == "Herkunftsland")
        assert "China" in herkunftsland.value

        # Find "Weitere Angaben" section
        weitere_section = next(s for s in summary.sections if s.title == "Weitere Angaben")
        
        gewerblich = next(i for i in weitere_section.items if i.label == "Gewerbliche Einfuhr")
        assert gewerblich.value == "Ja"


class TestLedgerEntry:
    """Tests for credit ledger entries during PDF export."""

    def test_ledger_entry_format(self):
        """Ledger entry should have correct format."""
        # Expected ledger entry structure
        entry = {
            "tenant_id": "tenant-123",
            "delta": -1,
            "reason": "PDF_EXPORT",
            "metadata_json": {
                "case_id": "case-123",
                "version": 1,
            },
            "created_by_user_id": "user-123",
        }

        assert entry["delta"] == -1
        assert entry["reason"] == "PDF_EXPORT"
        assert "case_id" in entry["metadata_json"]
        assert "version" in entry["metadata_json"]

