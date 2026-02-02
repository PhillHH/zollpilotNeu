"""
Wizard Step-Definitionen pro Verfahren.

WICHTIG: Dieses Modul enthält NUR Konfiguration, KEINE Logik.
Jedes Verfahren definiert:
- Step-Reihenfolge (step_keys)
- Step-Metadaten (title, description)
- Pflichtfelder pro Step (required_fields)

Die Wizard-Logik liegt in wizard.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import NamedTuple


class StepDefinition(NamedTuple):
    """Definition eines einzelnen Wizard-Steps."""
    step_key: str
    title: str
    description: str
    required_fields: list[str]  # Feld-Keys die für diesen Step ausgefüllt sein müssen


@dataclass(frozen=True)
class ProcedureSteps:
    """Step-Konfiguration für ein Verfahren."""
    procedure_code: str
    steps: list[StepDefinition]

    @property
    def step_keys(self) -> list[str]:
        """Liste aller Step-Keys in Reihenfolge."""
        return [step.step_key for step in self.steps]

    @property
    def first_step(self) -> str:
        """Erster Step-Key."""
        return self.steps[0].step_key if self.steps else ""

    @property
    def last_step(self) -> str:
        """Letzter Step-Key (üblicherweise 'review')."""
        return self.steps[-1].step_key if self.steps else ""

    def get_step(self, step_key: str) -> StepDefinition | None:
        """Holt Step-Definition nach Key."""
        for step in self.steps:
            if step.step_key == step_key:
                return step
        return None

    def get_step_index(self, step_key: str) -> int:
        """Index eines Steps (-1 wenn nicht gefunden)."""
        try:
            return self.step_keys.index(step_key)
        except ValueError:
            return -1

    def get_next_step(self, current_step: str) -> str | None:
        """Nächster Step nach current_step (oder None wenn letzter)."""
        idx = self.get_step_index(current_step)
        if idx < 0 or idx >= len(self.steps) - 1:
            return None
        return self.steps[idx + 1].step_key

    def get_previous_step(self, current_step: str) -> str | None:
        """Vorheriger Step vor current_step (oder None wenn erster)."""
        idx = self.get_step_index(current_step)
        if idx <= 0:
            return None
        return self.steps[idx - 1].step_key

    def is_valid_step(self, step_key: str) -> bool:
        """Prüft ob step_key ein gültiger Step ist."""
        return step_key in self.step_keys


# =============================================================================
# Step-Definitionen pro Verfahren
# =============================================================================

# --- IZA: Internet-Zollanmeldung (Privatpersonen) ---
IZA_STEPS = ProcedureSteps(
    procedure_code="IZA",
    steps=[
        StepDefinition(
            step_key="package",
            title="Sendung",
            description="Angaben zur Sendung und Warenbeschreibung",
            required_fields=["goods_description", "quantity"],
        ),
        StepDefinition(
            step_key="sender",
            title="Absender",
            description="Angaben zum Absender der Sendung",
            required_fields=["sender_name", "sender_country"],
        ),
        StepDefinition(
            step_key="recipient",
            title="Empfänger",
            description="Angaben zum Empfänger in Deutschland",
            required_fields=["recipient_name", "recipient_country"],
        ),
        StepDefinition(
            step_key="value",
            title="Wert",
            description="Warenwert und Versandkosten",
            required_fields=["value_amount", "value_currency"],
        ),
        StepDefinition(
            step_key="additional",
            title="Zusatzangaben",
            description="Optionale zusätzliche Informationen",
            required_fields=[],  # Keine Pflichtfelder
        ),
        StepDefinition(
            step_key="review",
            title="Prüfen",
            description="Zusammenfassung prüfen und absenden",
            required_fields=[],  # Review hat keine eigenen Felder
        ),
    ],
)

# --- IAA: Internet-Ausfuhranmeldung ---
IAA_STEPS = ProcedureSteps(
    procedure_code="IAA",
    steps=[
        StepDefinition(
            step_key="goods",
            title="Waren",
            description="Angaben zu den Exportwaren",
            required_fields=["goods_description", "quantity", "weight_kg"],
        ),
        StepDefinition(
            step_key="sender",
            title="Versender",
            description="Angaben zum Versender (Exporteur)",
            required_fields=["sender_name", "sender_country"],
        ),
        StepDefinition(
            step_key="recipient",
            title="Empfänger",
            description="Angaben zum Empfänger im Ausland",
            required_fields=["recipient_name", "recipient_country"],
        ),
        StepDefinition(
            step_key="value",
            title="Wert",
            description="Warenwert und Angaben zum Export",
            required_fields=["value_amount", "value_currency", "export_type"],
        ),
        StepDefinition(
            step_key="review",
            title="Prüfen",
            description="Zusammenfassung prüfen und absenden",
            required_fields=[],
        ),
    ],
)

# --- IPK: Import-Paketverkehr ---
IPK_STEPS = ProcedureSteps(
    procedure_code="IPK",
    steps=[
        StepDefinition(
            step_key="package",
            title="Paket",
            description="Angaben zum Paket",
            required_fields=["goods_description", "quantity", "weight_kg"],
        ),
        StepDefinition(
            step_key="sender",
            title="Absender",
            description="Angaben zum Absender",
            required_fields=["sender_name", "sender_country"],
        ),
        StepDefinition(
            step_key="recipient",
            title="Empfänger",
            description="Angaben zum Empfänger",
            required_fields=["recipient_name", "recipient_country"],
        ),
        StepDefinition(
            step_key="value",
            title="Wert",
            description="Warenwert",
            required_fields=["value_amount", "value_currency", "origin_country"],
        ),
        StepDefinition(
            step_key="review",
            title="Prüfen",
            description="Zusammenfassung prüfen und absenden",
            required_fields=[],
        ),
    ],
)

# =============================================================================
# Registry: Mapping procedure_code → ProcedureSteps
# =============================================================================

PROCEDURE_STEPS_REGISTRY: dict[str, ProcedureSteps] = {
    "IZA": IZA_STEPS,
    "IAA": IAA_STEPS,
    "IPK": IPK_STEPS,
}


def get_procedure_steps(procedure_code: str) -> ProcedureSteps | None:
    """
    Holt die Step-Konfiguration für ein Verfahren.

    Args:
        procedure_code: IZA, IAA oder IPK

    Returns:
        ProcedureSteps oder None wenn nicht gefunden
    """
    return PROCEDURE_STEPS_REGISTRY.get(procedure_code.upper())


def get_all_procedure_codes() -> list[str]:
    """Liste aller verfügbaren Verfahrenscodes."""
    return list(PROCEDURE_STEPS_REGISTRY.keys())
