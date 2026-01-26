"""
Tests for IZA-specific validation rules and summary generation.
"""

import pytest
from app.domain.procedures import (
    ProcedureDefinition,
    StepDefinition,
    FieldDefinition,
    ValidationEngine,
)
from app.domain.summary import (
    generate_iza_summary,
    format_country,
    format_currency,
    format_amount,
)


# --- IZA Procedure Mock ---


def _create_iza_procedure() -> ProcedureDefinition:
    """Create a mock IZA procedure for testing."""
    return ProcedureDefinition(
        id="proc-iza",
        code="IZA",
        name="Import Zollanmeldung",
        version="v1",
        is_active=True,
        steps=[
            StepDefinition(
                step_key="package",
                title="Paket",
                order=1,
                is_active=True,
                fields=[
                    FieldDefinition(
                        field_key="contents_description",
                        field_type="TEXT",
                        required=True,
                        config={"title": "Inhaltsbeschreibung"},
                        order=1,
                    ),
                    FieldDefinition(
                        field_key="value_amount",
                        field_type="NUMBER",
                        required=True,
                        config={"title": "Warenwert", "min": 0.01},
                        order=2,
                    ),
                    FieldDefinition(
                        field_key="value_currency",
                        field_type="CURRENCY",
                        required=True,
                        config={"title": "Währung"},
                        order=3,
                    ),
                    FieldDefinition(
                        field_key="origin_country",
                        field_type="COUNTRY",
                        required=True,
                        config={"title": "Herkunftsland"},
                        order=4,
                    ),
                ],
            ),
            StepDefinition(
                step_key="sender",
                title="Absender",
                order=2,
                is_active=True,
                fields=[
                    FieldDefinition(
                        field_key="sender_name",
                        field_type="TEXT",
                        required=True,
                        config={"title": "Absendername"},
                        order=1,
                    ),
                    FieldDefinition(
                        field_key="sender_country",
                        field_type="COUNTRY",
                        required=True,
                        config={"title": "Absenderland"},
                        order=2,
                    ),
                ],
            ),
            StepDefinition(
                step_key="recipient",
                title="Empfänger",
                order=3,
                is_active=True,
                fields=[
                    FieldDefinition(
                        field_key="recipient_full_name",
                        field_type="TEXT",
                        required=True,
                        config={"title": "Name"},
                        order=1,
                    ),
                    FieldDefinition(
                        field_key="recipient_address",
                        field_type="TEXT",
                        required=True,
                        config={"title": "Adresse"},
                        order=2,
                    ),
                    FieldDefinition(
                        field_key="recipient_postcode",
                        field_type="TEXT",
                        required=True,
                        config={"title": "PLZ"},
                        order=3,
                    ),
                    FieldDefinition(
                        field_key="recipient_city",
                        field_type="TEXT",
                        required=True,
                        config={"title": "Stadt"},
                        order=4,
                    ),
                    FieldDefinition(
                        field_key="recipient_country",
                        field_type="COUNTRY",
                        required=True,
                        config={"title": "Land"},
                        order=5,
                    ),
                ],
            ),
            StepDefinition(
                step_key="additional",
                title="Weitere Angaben",
                order=4,
                is_active=True,
                fields=[
                    FieldDefinition(
                        field_key="commercial_goods",
                        field_type="BOOLEAN",
                        required=True,
                        config={"label": "Gewerbliche Einfuhr"},
                        order=1,
                    ),
                    FieldDefinition(
                        field_key="remarks",
                        field_type="TEXT",
                        required=False,
                        config={"title": "Bemerkungen"},
                        order=2,
                    ),
                ],
            ),
        ],
    )


def _valid_iza_fields() -> dict:
    """Valid IZA fields for testing."""
    return {
        "contents_description": "Electronics - Smartphone",
        "value_amount": 150.00,
        "value_currency": "EUR",
        "origin_country": "CN",
        "sender_name": "AliExpress",
        "sender_country": "CN",
        "recipient_full_name": "Max Mustermann",
        "recipient_address": "Musterstraße 123",
        "recipient_postcode": "12345",
        "recipient_city": "Berlin",
        "recipient_country": "DE",
        "commercial_goods": False,
        "remarks": "",
    }


# --- IZA Validation Tests ---


class TestIzaValidationRules:
    """Tests for IZA-specific business rules."""

    def test_valid_iza_case_passes_validation(self):
        """A complete, valid IZA case should pass all validation."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()

        result = engine.validate(fields)

        assert result.valid is True
        assert len(result.errors) == 0

    def test_origin_country_de_is_invalid(self):
        """Origin country cannot be Germany for imports."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["origin_country"] = "DE"

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "origin_country" in error_keys

        origin_error = next(e for e in result.errors if e.field_key == "origin_country")
        assert "nicht Deutschland" in origin_error.message

    def test_sender_country_de_is_invalid(self):
        """Sender country cannot be Germany for imports."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["sender_country"] = "DE"

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "sender_country" in error_keys

        sender_error = next(e for e in result.errors if e.field_key == "sender_country")
        assert "außerhalb Deutschlands" in sender_error.message

    def test_recipient_country_not_de_is_invalid(self):
        """Recipient country must be Germany for imports."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["recipient_country"] = "AT"

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "recipient_country" in error_keys

        recipient_error = next(e for e in result.errors if e.field_key == "recipient_country")
        assert "Deutschland" in recipient_error.message

    def test_value_amount_zero_is_invalid(self):
        """Value amount must be greater than 0."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["value_amount"] = 0

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "value_amount" in error_keys

    def test_value_amount_negative_is_invalid(self):
        """Value amount cannot be negative."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["value_amount"] = -50

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "value_amount" in error_keys

    def test_commercial_goods_true_requires_remarks(self):
        """Commercial goods require remarks."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["commercial_goods"] = True
        fields["remarks"] = ""

        result = engine.validate(fields)

        assert result.valid is False
        error_keys = [e.field_key for e in result.errors]
        assert "remarks" in error_keys

        remarks_error = next(e for e in result.errors if e.field_key == "remarks")
        assert "gewerblich" in remarks_error.message.lower()

    def test_commercial_goods_true_with_remarks_is_valid(self):
        """Commercial goods with remarks should be valid."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        fields["commercial_goods"] = True
        fields["remarks"] = "Zum Weiterverkauf bestimmt"

        result = engine.validate(fields)

        assert result.valid is True

    def test_missing_required_field_shows_friendly_message(self):
        """Missing required field should show user-friendly message."""
        procedure = _create_iza_procedure()
        engine = ValidationEngine(procedure)
        fields = _valid_iza_fields()
        del fields["contents_description"]

        result = engine.validate(fields)

        assert result.valid is False
        content_error = next(e for e in result.errors if e.field_key == "contents_description")
        assert "Bitte gib" in content_error.message
        assert "Inhaltsbeschreibung" in content_error.message


# --- Summary Generation Tests ---


class TestIzaSummaryGeneration:
    """Tests for IZA summary generation."""

    def test_summary_has_all_sections(self):
        """Summary should have all expected sections."""
        fields = _valid_iza_fields()
        summary = generate_iza_summary(fields, "Import Zollanmeldung")

        section_titles = [s.title for s in summary.sections]
        assert "Paket" in section_titles
        assert "Absender" in section_titles
        assert "Empfänger" in section_titles
        assert "Weitere Angaben" in section_titles

    def test_summary_formats_country_names(self):
        """Summary should display country names, not codes."""
        fields = _valid_iza_fields()
        summary = generate_iza_summary(fields, "Import Zollanmeldung")

        # Find Paket section
        package_section = next(s for s in summary.sections if s.title == "Paket")
        origin_item = next(i for i in package_section.items if i.label == "Herkunftsland")

        assert origin_item.value == "China"

    def test_summary_formats_currency(self):
        """Summary should format currency with symbol."""
        fields = _valid_iza_fields()
        summary = generate_iza_summary(fields, "Import Zollanmeldung")

        package_section = next(s for s in summary.sections if s.title == "Paket")
        currency_item = next(i for i in package_section.items if i.label == "Währung")

        assert "Euro" in currency_item.value or "€" in currency_item.value

    def test_summary_formats_amount(self):
        """Summary should format amount with currency symbol."""
        fields = _valid_iza_fields()
        summary = generate_iza_summary(fields, "Import Zollanmeldung")

        package_section = next(s for s in summary.sections if s.title == "Paket")
        value_item = next(i for i in package_section.items if i.label == "Warenwert")

        assert "150" in value_item.value
        assert "€" in value_item.value

    def test_summary_shows_boolean_as_ja_nein(self):
        """Summary should show boolean as Ja/Nein."""
        fields = _valid_iza_fields()
        summary = generate_iza_summary(fields, "Import Zollanmeldung")

        additional_section = next(s for s in summary.sections if s.title == "Weitere Angaben")
        commercial_item = next(i for i in additional_section.items if i.label == "Gewerbliche Einfuhr")

        assert commercial_item.value in ["Ja", "Nein"]


# --- Format Helper Tests ---


class TestFormatHelpers:
    """Tests for formatting helper functions."""

    def test_format_country_known(self):
        assert format_country("DE") == "Deutschland"
        assert format_country("CN") == "China"
        assert format_country("US") == "USA"

    def test_format_country_unknown(self):
        assert format_country("XX") == "XX"

    def test_format_country_none(self):
        assert format_country(None) == "—"

    def test_format_currency_known(self):
        assert "Euro" in format_currency("EUR")
        assert "Dollar" in format_currency("USD")

    def test_format_currency_unknown(self):
        assert format_currency("XYZ") == "XYZ"

    def test_format_amount_with_currency(self):
        result = format_amount(150.50, "EUR")
        assert "150" in result
        assert "€" in result

    def test_format_amount_none(self):
        assert format_amount(None, "EUR") == "—"

