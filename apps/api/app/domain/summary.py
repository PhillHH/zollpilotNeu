"""
Case Summary Service - Generates structured, human-readable summaries.

Transforms raw case field data into formatted sections suitable for display.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

# Country code to name mapping (common countries for IZA)
COUNTRY_NAMES = {
    "DE": "Deutschland",
    "AT": "Österreich",
    "CH": "Schweiz",
    "CN": "China",
    "US": "USA",
    "GB": "Großbritannien",
    "FR": "Frankreich",
    "NL": "Niederlande",
    "BE": "Belgien",
    "PL": "Polen",
    "IT": "Italien",
    "ES": "Spanien",
    "JP": "Japan",
    "KR": "Südkorea",
    "TW": "Taiwan",
    "HK": "Hongkong",
    "SG": "Singapur",
    "AU": "Australien",
    "CA": "Kanada",
    "TR": "Türkei",
}

# Currency code to symbol/name
CURRENCY_DISPLAY = {
    "EUR": "€ (Euro)",
    "USD": "$ (US-Dollar)",
    "GBP": "£ (Britisches Pfund)",
    "CHF": "CHF (Schweizer Franken)",
    "CNY": "¥ (Chinesischer Yuan)",
    "JPY": "¥ (Japanischer Yen)",
}


@dataclass
class SummaryItem:
    """Single item in a summary section."""
    label: str
    value: str


@dataclass
class SummarySection:
    """Section of summary items."""
    title: str
    items: list[SummaryItem]


@dataclass
class CaseSummary:
    """Complete case summary."""
    procedure_code: str
    procedure_version: str
    procedure_name: str
    sections: list[SummarySection]


def format_country(code: str | None) -> str:
    """Format country code to display name."""
    if not code:
        return "—"
    return COUNTRY_NAMES.get(code, code)


def format_currency(code: str | None) -> str:
    """Format currency code to display."""
    if not code:
        return "—"
    return CURRENCY_DISPLAY.get(code, code)


def format_amount(amount: float | int | None, currency: str | None) -> str:
    """Format monetary amount with currency."""
    if amount is None:
        return "—"
    
    currency_symbol = {
        "EUR": "€",
        "USD": "$",
        "GBP": "£",
        "CHF": "CHF",
        "CNY": "¥",
        "JPY": "¥",
    }.get(currency or "", "")
    
    # Format number with 2 decimals
    formatted = f"{amount:,.2f}".replace(",", " ").replace(".", ",")
    
    if currency_symbol:
        return f"{formatted} {currency_symbol}"
    return formatted


def format_boolean(value: bool | None, true_text: str = "Ja", false_text: str = "Nein") -> str:
    """Format boolean to display text."""
    if value is None:
        return "—"
    return true_text if value else false_text


def generate_iza_summary(fields: dict[str, Any], procedure_name: str) -> CaseSummary:
    """Generate structured summary for IZA procedure."""
    
    sections = [
        SummarySection(
            title="Paket",
            items=[
                SummaryItem(
                    label="Inhalt",
                    value=fields.get("contents_description", "—") or "—"
                ),
                SummaryItem(
                    label="Warenwert",
                    value=format_amount(
                        fields.get("value_amount"),
                        fields.get("value_currency")
                    )
                ),
                SummaryItem(
                    label="Währung",
                    value=format_currency(fields.get("value_currency"))
                ),
                SummaryItem(
                    label="Herkunftsland",
                    value=format_country(fields.get("origin_country"))
                ),
            ]
        ),
        SummarySection(
            title="Absender",
            items=[
                SummaryItem(
                    label="Name",
                    value=fields.get("sender_name", "—") or "—"
                ),
                SummaryItem(
                    label="Land",
                    value=format_country(fields.get("sender_country"))
                ),
            ]
        ),
        SummarySection(
            title="Empfänger",
            items=[
                SummaryItem(
                    label="Name",
                    value=fields.get("recipient_full_name", "—") or "—"
                ),
                SummaryItem(
                    label="Adresse",
                    value=_format_address(fields)
                ),
                SummaryItem(
                    label="Land",
                    value=format_country(fields.get("recipient_country"))
                ),
            ]
        ),
        SummarySection(
            title="Weitere Angaben",
            items=[
                SummaryItem(
                    label="Gewerbliche Einfuhr",
                    value=format_boolean(fields.get("commercial_goods"))
                ),
                SummaryItem(
                    label="Bemerkungen",
                    value=fields.get("remarks", "—") or "Keine"
                ),
            ]
        ),
    ]
    
    return CaseSummary(
        procedure_code="IZA",
        procedure_version="v1",
        procedure_name=procedure_name,
        sections=sections
    )


def _format_address(fields: dict[str, Any]) -> str:
    """Format address fields into single line."""
    parts = []
    
    address = fields.get("recipient_address")
    if address:
        parts.append(address)
    
    postcode = fields.get("recipient_postcode")
    city = fields.get("recipient_city")
    if postcode and city:
        parts.append(f"{postcode} {city}")
    elif city:
        parts.append(city)
    elif postcode:
        parts.append(postcode)
    
    return ", ".join(parts) if parts else "—"


def generate_case_summary(
    procedure_code: str,
    procedure_version: str,
    procedure_name: str,
    fields: dict[str, Any]
) -> CaseSummary:
    """
    Generate summary for a case based on its procedure.
    
    Routes to procedure-specific summary generator.
    """
    if procedure_code == "IZA":
        return generate_iza_summary(fields, procedure_name)
    
    # Generic fallback for unknown procedures
    items = [
        SummaryItem(label=key, value=str(value) if value is not None else "—")
        for key, value in fields.items()
    ]
    
    return CaseSummary(
        procedure_code=procedure_code,
        procedure_version=procedure_version,
        procedure_name=procedure_name,
        sections=[SummarySection(title="Daten", items=items)]
    )

