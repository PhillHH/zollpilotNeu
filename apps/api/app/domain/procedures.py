"""
Procedure Engine v1 - Configuration-driven procedure management.

This module provides:
- Loader/Registry for procedure definitions
- Validation engine for case fields against procedure schemas
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.db.prisma_client import prisma


@dataclass
class FieldDefinition:
    """Single field definition within a procedure step."""
    field_key: str
    field_type: str
    required: bool
    config: dict[str, Any] | None
    order: int


@dataclass
class StepDefinition:
    """Single step definition within a procedure."""
    step_key: str
    title: str
    order: int
    is_active: bool
    fields: list[FieldDefinition]


@dataclass
class ProcedureDefinition:
    """Complete procedure definition with steps and fields."""
    id: str
    code: str
    name: str
    version: str
    is_active: bool
    steps: list[StepDefinition]


@dataclass
class ValidationError:
    """Single validation error for a field."""
    step_key: str
    field_key: str
    message: str


@dataclass
class ValidationResult:
    """Result of validating case fields against procedure definition."""
    valid: bool
    errors: list[ValidationError]


class ProcedureLoader:
    """
    Loads procedure definitions from the database.
    
    Provides structured access to procedures, steps, and fields.
    """

    async def list_active(self) -> list[dict[str, Any]]:
        """List all active procedures (summary only)."""
        procedures = await prisma.procedure.find_many(
            where={"is_active": True},
            order={"code": "asc"},
        )
        return [
            {"code": p.code, "name": p.name, "version": p.version}
            for p in procedures
        ]

    async def get_by_code(self, code: str, version: str | None = None) -> ProcedureDefinition | None:
        """
        Get full procedure definition by code.
        
        If version is not specified, returns the active version (or latest).
        """
        where: dict[str, Any] = {"code": code, "is_active": True}
        if version:
            where["version"] = version

        procedure = await prisma.procedure.find_first(
            where=where,
            include={
                "steps": {
                    "include": {"fields": True},
                    "order_by": {"order": "asc"},
                }
            },
        )

        if not procedure:
            return None

        steps = []
        for step in (procedure.steps or []):
            if not step.is_active:
                continue

            fields = [
                FieldDefinition(
                    field_key=f.field_key,
                    field_type=f.field_type,
                    required=f.required,
                    config=f.config_json,
                    order=f.order,
                )
                for f in sorted((step.fields or []), key=lambda x: x.order)
            ]

            steps.append(
                StepDefinition(
                    step_key=step.step_key,
                    title=step.title,
                    order=step.order,
                    is_active=step.is_active,
                    fields=fields,
                )
            )

        return ProcedureDefinition(
            id=procedure.id,
            code=procedure.code,
            name=procedure.name,
            version=procedure.version,
            is_active=procedure.is_active,
            steps=steps,
        )


class ValidationEngine:
    """
    Validates case fields against a procedure definition.
    
    Checks:
    - Required fields are present and non-empty
    - Basic type validation
    - Procedure-specific business rules
    """

    def __init__(self, procedure: ProcedureDefinition):
        self.procedure = procedure
        self._field_map = self._build_field_map()

    def _build_field_map(self) -> dict[str, tuple[str, FieldDefinition]]:
        """Build a lookup map: field_key -> (step_key, FieldDefinition)."""
        result = {}
        for step in self.procedure.steps:
            for field in step.fields:
                result[field.field_key] = (step.step_key, field)
        return result

    def validate(self, case_fields: dict[str, Any]) -> ValidationResult:
        """
        Validate case fields against the procedure definition.
        
        Args:
            case_fields: Dict mapping field_key to value
            
        Returns:
            ValidationResult with valid flag and list of errors
        """
        errors: list[ValidationError] = []

        # Check all required fields and type validation
        for field_key, (step_key, field_def) in self._field_map.items():
            value = case_fields.get(field_key)

            # Required check
            if field_def.required and self._is_empty(value):
                errors.append(
                    ValidationError(
                        step_key=step_key,
                        field_key=field_key,
                        message=self._get_friendly_required_message(field_def),
                    )
                )
                continue

            # Type validation (only if value is present)
            if value is not None and not self._is_empty(value):
                type_error = self._validate_type(value, field_def)
                if type_error:
                    errors.append(
                        ValidationError(
                            step_key=step_key,
                            field_key=field_key,
                            message=type_error,
                        )
                    )

        # Procedure-specific business rules
        business_errors = self._validate_business_rules(case_fields)
        errors.extend(business_errors)

        return ValidationResult(valid=len(errors) == 0, errors=errors)

    def _get_friendly_required_message(self, field_def: FieldDefinition) -> str:
        """Generate user-friendly required field message."""
        config = field_def.config or {}
        title = config.get("title", config.get("label", field_def.field_key))
        return f'Bitte gib "{title}" an.'

    def _validate_business_rules(self, case_fields: dict[str, Any]) -> list[ValidationError]:
        """Validate procedure-specific business rules."""
        errors: list[ValidationError] = []

        # IZA-specific rules
        if self.procedure.code == "IZA":
            errors.extend(self._validate_iza_rules(case_fields))
        # IPK-specific rules
        elif self.procedure.code == "IPK":
            errors.extend(self._validate_ipk_rules(case_fields))
        # IAA-specific rules
        elif self.procedure.code == "IAA":
            errors.extend(self._validate_iaa_rules(case_fields))

        return errors

    def _validate_iza_rules(self, case_fields: dict[str, Any]) -> list[ValidationError]:
        """IZA-specific validation rules."""
        errors: list[ValidationError] = []

        # Rule: value_amount must be > 0
        value_amount = case_fields.get("value_amount")
        if value_amount is not None and isinstance(value_amount, (int, float)) and value_amount <= 0:
            errors.append(ValidationError(
                step_key="package",
                field_key="value_amount",
                message="Der Warenwert muss größer als 0 sein."
            ))

        # Rule: origin_country cannot be DE (import from outside Germany)
        origin_country = case_fields.get("origin_country")
        if origin_country == "DE":
            errors.append(ValidationError(
                step_key="package",
                field_key="origin_country",
                message="Das Herkunftsland darf nicht Deutschland sein – es handelt sich um eine Einfuhr."
            ))

        # Rule: sender_country cannot be DE
        sender_country = case_fields.get("sender_country")
        if sender_country == "DE":
            errors.append(ValidationError(
                step_key="sender",
                field_key="sender_country",
                message="Der Absender muss außerhalb Deutschlands sitzen."
            ))

        # Rule: recipient_country must be DE (importing TO Germany)
        recipient_country = case_fields.get("recipient_country")
        if recipient_country and recipient_country != "DE":
            errors.append(ValidationError(
                step_key="recipient",
                field_key="recipient_country",
                message="Bei einer Einfuhr nach Deutschland muss das Empfängerland Deutschland sein."
            ))

        # Rule: if commercial_goods is true, remarks are required
        commercial_goods = case_fields.get("commercial_goods")
        remarks = case_fields.get("remarks")
        if commercial_goods is True and self._is_empty(remarks):
            errors.append(ValidationError(
                step_key="additional",
                field_key="remarks",
                message="Bei gewerblichen Einfuhren sind Bemerkungen erforderlich (z.B. Verwendungszweck)."
            ))

        return errors

    def _validate_ipk_rules(self, case_fields: dict[str, Any]) -> list[ValidationError]:
        """IPK-specific validation rules for import parcel traffic."""
        errors: list[ValidationError] = []

        # Rule: value_amount must be > 0
        value_amount = case_fields.get("value_amount")
        if value_amount is not None and isinstance(value_amount, (int, float)) and value_amount <= 0:
            errors.append(ValidationError(
                step_key="warenwert",
                field_key="value_amount",
                message="Der Warenwert muss größer als 0 sein."
            ))

        # Rule: origin_country cannot be DE (import from outside Germany)
        origin_country = case_fields.get("origin_country")
        if origin_country == "DE":
            errors.append(ValidationError(
                step_key="herkunft",
                field_key="origin_country",
                message="Das Herkunftsland darf nicht Deutschland sein – es handelt sich um eine Einfuhr."
            ))

        # Rule: sender_country cannot be DE (import from outside)
        sender_country = case_fields.get("sender_country")
        if sender_country == "DE":
            errors.append(ValidationError(
                step_key="herkunft",
                field_key="sender_country",
                message="Der Lieferant muss außerhalb Deutschlands sitzen."
            ))

        # Rule: quantity must be at least 1
        quantity = case_fields.get("quantity")
        if quantity is not None and isinstance(quantity, (int, float)) and quantity < 1:
            errors.append(ValidationError(
                step_key="grunddaten",
                field_key="quantity",
                message="Die Anzahl der Packstücke muss mindestens 1 sein."
            ))

        # Rule: weight_kg must be > 0
        weight_kg = case_fields.get("weight_kg")
        if weight_kg is not None and isinstance(weight_kg, (int, float)) and weight_kg <= 0:
            errors.append(ValidationError(
                step_key="grunddaten",
                field_key="weight_kg",
                message="Das Gewicht muss größer als 0 sein."
            ))

        return errors

    def _validate_iaa_rules(self, case_fields: dict[str, Any]) -> list[ValidationError]:
        """IAA-specific validation rules for export declarations."""
        errors: list[ValidationError] = []

        # Rule: value_amount must be > 0
        value_amount = case_fields.get("value_amount")
        if value_amount is not None and isinstance(value_amount, (int, float)) and value_amount <= 0:
            errors.append(ValidationError(
                step_key="geschaeftsart",
                field_key="value_amount",
                message="Der Warenwert muss größer als 0 sein."
            ))

        # Rule: sender_country must be DE (export FROM Germany)
        sender_country = case_fields.get("sender_country")
        if sender_country and sender_country != "DE":
            errors.append(ValidationError(
                step_key="absender",
                field_key="sender_country",
                message="Bei einer Ausfuhr aus Deutschland muss das Absenderland Deutschland sein."
            ))

        # Rule: recipient_country cannot be DE and cannot be EU (export to non-EU)
        # For simplicity, we just check it's not DE
        recipient_country = case_fields.get("recipient_country")
        if recipient_country == "DE":
            errors.append(ValidationError(
                step_key="empfaenger",
                field_key="recipient_country",
                message="Das Bestimmungsland darf nicht Deutschland sein – es handelt sich um eine Ausfuhr."
            ))

        # Rule: weight_kg must be > 0
        weight_kg = case_fields.get("weight_kg")
        if weight_kg is not None and isinstance(weight_kg, (int, float)) and weight_kg <= 0:
            errors.append(ValidationError(
                step_key="geschaeftsart",
                field_key="weight_kg",
                message="Das Gewicht muss größer als 0 sein."
            ))

        # Rule: export_type must be one of the allowed values
        export_type = case_fields.get("export_type")
        allowed_types = ["Verkauf", "Muster", "Reparatur", "Rücksendung", "Sonstige"]
        if export_type and export_type not in allowed_types:
            errors.append(ValidationError(
                step_key="geschaeftsart",
                field_key="export_type",
                message=f"Bitte wählen Sie eine gültige Geschäftsart: {', '.join(allowed_types)}."
            ))

        return errors

    def _is_empty(self, value: Any) -> bool:
        """Check if a value is considered empty."""
        if value is None:
            return True
        if isinstance(value, str) and value.strip() == "":
            return True
        return False

    def _validate_type(self, value: Any, field_def: FieldDefinition) -> str | None:
        """
        Validate value type against field definition.
        
        Returns error message if invalid, None if valid.
        """
        field_type = field_def.field_type

        if field_type == "TEXT":
            if not isinstance(value, str):
                return f"Field '{field_def.field_key}' must be text."
            config = field_def.config or {}
            max_length = config.get("maxLength")
            if max_length and len(value) > max_length:
                return f"Field '{field_def.field_key}' exceeds max length of {max_length}."

        elif field_type == "NUMBER":
            if not isinstance(value, (int, float)):
                return f"Field '{field_def.field_key}' must be a number."
            config = field_def.config or {}
            min_val = config.get("min")
            max_val = config.get("max")
            if min_val is not None and value < min_val:
                return f"Field '{field_def.field_key}' must be at least {min_val}."
            if max_val is not None and value > max_val:
                return f"Field '{field_def.field_key}' must be at most {max_val}."

        elif field_type == "BOOLEAN":
            if not isinstance(value, bool):
                return f"Field '{field_def.field_key}' must be true or false."

        elif field_type == "SELECT":
            config = field_def.config or {}
            options = config.get("options", [])
            if options and value not in options:
                return f"Field '{field_def.field_key}' must be one of: {', '.join(options)}."

        elif field_type == "COUNTRY":
            if not isinstance(value, str) or len(value) != 2:
                return f"Field '{field_def.field_key}' must be a 2-letter country code."

        elif field_type == "CURRENCY":
            if not isinstance(value, str) or len(value) != 3:
                return f"Field '{field_def.field_key}' must be a 3-letter currency code."

        return None


# Module-level singleton
procedure_loader = ProcedureLoader()


async def get_procedure_definition(code: str, version: str | None = None) -> ProcedureDefinition | None:
    """Convenience function to load a procedure definition."""
    return await procedure_loader.get_by_code(code, version)


async def validate_case_fields(
    procedure: ProcedureDefinition, case_fields: dict[str, Any]
) -> ValidationResult:
    """Convenience function to validate case fields against a procedure."""
    engine = ValidationEngine(procedure)
    return engine.validate(case_fields)

