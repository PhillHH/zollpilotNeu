"""
Prefill API – Invoice/Receipt Upload & Extraction

Sprint 8 – U7: Scan & Vorbefüllen (Speed ohne Automatik)

Key Principles:
- NEVER auto-fill fields – only suggest
- User must confirm each field
- Temporary storage with TTL
- GDPR-first: no external uploads, no training, no content logging
- Heuristic extraction v1 (regex-based, no AI)
"""
from __future__ import annotations

import io
import os
import re
import tempfile
import uuid
from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.dependencies.auth import AuthContext, get_current_user

router = APIRouter(prefix="/prefill", tags=["prefill"])


# --- Constants ---

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/jpg": "jpg",
}

# Temporary file TTL (5 minutes)
TEMP_FILE_TTL = timedelta(minutes=5)

# Currency patterns
CURRENCY_SYMBOLS = {
    "€": "EUR",
    "$": "USD",
    "£": "GBP",
    "¥": "JPY",
    "CHF": "CHF",
    "EUR": "EUR",
    "USD": "USD",
    "GBP": "GBP",
}

# Common shipping keywords (German & English)
SHIPPING_KEYWORDS = [
    r"versand(?:kosten)?",
    r"lieferung",
    r"porto",
    r"shipping",
    r"delivery",
    r"freight",
    r"postage",
    r"fracht",
]


# --- Models ---


class FieldSuggestion(BaseModel):
    """A single field suggestion with confidence."""
    field_key: str
    value: Any
    confidence: float  # 0.0 - 1.0
    source: str  # e.g., "regex_amount", "regex_merchant"
    display_label: str  # German label for UI


class ItemSuggestion(BaseModel):
    """A suggested item from the invoice."""
    name: str
    price: float | None
    currency: str | None
    confidence: float


class PrefillSuggestions(BaseModel):
    """All suggestions extracted from the document."""
    suggestions: list[FieldSuggestion]
    items: list[ItemSuggestion]
    raw_text_preview: str | None  # First 500 chars for debug (optional)
    extraction_method: str
    warnings: list[str]


class PrefillUploadResponse(BaseModel):
    """Response wrapper for prefill upload."""
    data: PrefillSuggestions


# --- Extraction Helpers ---


def extract_amounts(text: str) -> list[tuple[float, str, float]]:
    """
    Extract monetary amounts from text.
    Returns list of (amount, currency, confidence).
    """
    results: list[tuple[float, str, float]] = []

    # Pattern: currency symbol followed by amount
    # e.g., €150.00, $ 99.99, 150,00 €, 150.00 EUR
    patterns = [
        # €150.00 or € 150.00 or € 150,00
        (r"€\s*(\d{1,6}(?:[.,]\d{2})?)", "EUR", 0.9),
        # 150.00€ or 150,00 €
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*€", "EUR", 0.9),
        # EUR 150.00 or 150.00 EUR
        (r"EUR\s*(\d{1,6}(?:[.,]\d{2})?)", "EUR", 0.85),
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*EUR", "EUR", 0.85),
        # $150.00 or $ 150.00
        (r"\$\s*(\d{1,6}(?:[.,]\d{2})?)", "USD", 0.9),
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*\$", "USD", 0.9),
        # USD 150.00 or 150.00 USD
        (r"USD\s*(\d{1,6}(?:[.,]\d{2})?)", "USD", 0.85),
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*USD", "USD", 0.85),
        # GBP / £
        (r"£\s*(\d{1,6}(?:[.,]\d{2})?)", "GBP", 0.9),
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*£", "GBP", 0.9),
        (r"GBP\s*(\d{1,6}(?:[.,]\d{2})?)", "GBP", 0.85),
        # CHF
        (r"CHF\s*(\d{1,6}(?:[.,]\d{2})?)", "CHF", 0.85),
        (r"(\d{1,6}(?:[.,]\d{2})?)\s*CHF", "CHF", 0.85),
    ]

    for pattern, currency, base_confidence in patterns:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            amount_str = match.group(1)
            # Normalize: replace comma with dot for parsing
            amount_str = amount_str.replace(",", ".")
            try:
                amount = float(amount_str)
                if amount > 0:
                    results.append((amount, currency, base_confidence))
            except ValueError:
                continue

    return results


def extract_shipping_cost(text: str, amounts: list[tuple[float, str, float]]) -> tuple[float, str, float] | None:
    """
    Try to find shipping cost by looking for shipping keywords near amounts.
    Returns (amount, currency, confidence) or None.
    """
    text_lower = text.lower()

    for keyword_pattern in SHIPPING_KEYWORDS:
        for match in re.finditer(keyword_pattern, text_lower, re.IGNORECASE):
            # Look for amounts near the keyword (within 50 chars)
            start = max(0, match.start() - 50)
            end = min(len(text), match.end() + 50)
            context = text[start:end]

            context_amounts = extract_amounts(context)
            if context_amounts:
                # Return the first amount found near shipping keyword
                amount, currency, conf = context_amounts[0]
                # Boost confidence because we found it near shipping keyword
                return (amount, currency, min(conf + 0.1, 0.95))

    return None


def extract_total_amount(text: str, amounts: list[tuple[float, str, float]]) -> tuple[float, str, float] | None:
    """
    Try to find the total/grand total amount.
    Returns (amount, currency, confidence) or None.
    """
    total_keywords = [
        r"gesamt",
        r"total",
        r"summe",
        r"endbetrag",
        r"zu zahlen",
        r"grand total",
        r"order total",
        r"betrag",
    ]

    text_lower = text.lower()

    for keyword in total_keywords:
        for match in re.finditer(keyword, text_lower, re.IGNORECASE):
            # Look for amounts near the keyword
            start = max(0, match.start() - 30)
            end = min(len(text), match.end() + 80)
            context = text[start:end]

            context_amounts = extract_amounts(context)
            if context_amounts:
                # Return the largest amount found near total keyword
                context_amounts.sort(key=lambda x: x[0], reverse=True)
                amount, currency, conf = context_amounts[0]
                return (amount, currency, min(conf + 0.15, 0.95))

    # Fallback: return the largest amount if no total keyword found
    if amounts:
        amounts_sorted = sorted(amounts, key=lambda x: x[0], reverse=True)
        amount, currency, conf = amounts_sorted[0]
        return (amount, currency, conf * 0.7)  # Lower confidence without keyword

    return None


def extract_merchant_name(text: str) -> tuple[str, float] | None:
    """
    Try to extract merchant/seller name from invoice.
    Returns (name, confidence) or None.
    """
    # Look for common patterns
    patterns = [
        (r"(?:von|from|verkäufer|seller|händler|shop)[\s:]+([A-Za-zÄÖÜäöüß0-9\s&.-]{3,50})", 0.8),
        (r"(?:rechnung|invoice)[\s]+(?:von|from)[\s:]+([A-Za-zÄÖÜäöüß0-9\s&.-]{3,50})", 0.85),
        (r"(?:bestellung bei|order from)[\s:]+([A-Za-zÄÖÜäöüß0-9\s&.-]{3,50})", 0.85),
    ]

    for pattern, confidence in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            # Clean up the name
            name = re.sub(r"\s+", " ", name)
            if len(name) >= 3:
                return (name, confidence)

    # Try to find company-like names at the start of the document
    lines = text.split("\n")[:10]  # First 10 lines
    for line in lines:
        line = line.strip()
        # Skip short lines or lines that look like addresses
        if len(line) < 5 or len(line) > 60:
            continue
        if re.match(r"^\d", line):  # Starts with number (likely address/date)
            continue
        if "@" in line or "www." in line.lower():  # Email or URL
            continue
        if re.match(r".*\d{5}.*", line):  # Postal code
            continue
        # Could be company name
        return (line, 0.5)

    return None


def extract_items(text: str) -> list[ItemSuggestion]:
    """
    Try to extract line items from invoice.
    Returns list of ItemSuggestion.
    """
    items: list[ItemSuggestion] = []

    # Pattern: product name followed by price
    # e.g., "iPhone 15 Pro          €1199.00"
    # e.g., "2x Smartphone Case     $ 29.99"

    # Look for lines with product + price pattern
    lines = text.split("\n")

    for line in lines:
        line = line.strip()
        if not line or len(line) < 10:
            continue

        # Try to find price at end of line
        price_pattern = r"[€$£]\s*(\d{1,6}(?:[.,]\d{2})?)|(\d{1,6}(?:[.,]\d{2})?)\s*[€$£]|(\d{1,6}(?:[.,]\d{2})?)\s*(?:EUR|USD|GBP)"
        price_match = re.search(price_pattern, line, re.IGNORECASE)

        if price_match:
            # Extract product name (everything before price)
            price_start = price_match.start()
            product_name = line[:price_start].strip()

            # Clean up product name
            product_name = re.sub(r"^\d+\s*x\s*", "", product_name)  # Remove "2x "
            product_name = re.sub(r"\s+", " ", product_name)

            if len(product_name) >= 3:
                # Extract price value
                price_str = price_match.group(1) or price_match.group(2) or price_match.group(3)
                if price_str:
                    try:
                        price = float(price_str.replace(",", "."))

                        # Determine currency
                        currency = "EUR"  # Default
                        if "$" in line:
                            currency = "USD"
                        elif "£" in line:
                            currency = "GBP"
                        elif "CHF" in line.upper():
                            currency = "CHF"

                        items.append(ItemSuggestion(
                            name=product_name[:100],  # Limit length
                            price=price,
                            currency=currency,
                            confidence=0.7
                        ))
                    except ValueError:
                        pass

    return items[:10]  # Limit to 10 items


def extract_text_from_pdf(content: bytes) -> str:
    """
    Extract text from PDF using pdfplumber or PyPDF2.
    Returns extracted text.
    """
    try:
        # Try pdfplumber first (better extraction)
        import pdfplumber

        with pdfplumber.open(io.BytesIO(content)) as pdf:
            text_parts = []
            for page in pdf.pages[:5]:  # Limit to first 5 pages
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
    except ImportError:
        pass
    except Exception:
        pass

    try:
        # Fallback to PyPDF2
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for page in reader.pages[:5]:  # Limit to first 5 pages
            text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)
    except ImportError:
        pass
    except Exception:
        pass

    return ""


def process_document(content: bytes, file_type: str) -> PrefillSuggestions:
    """
    Process uploaded document and extract suggestions.
    """
    warnings: list[str] = []
    suggestions: list[FieldSuggestion] = []
    items: list[ItemSuggestion] = []
    text = ""
    extraction_method = "none"

    if file_type == "pdf":
        text = extract_text_from_pdf(content)
        extraction_method = "pdf_text"

        if not text or len(text) < 20:
            warnings.append("PDF enthält wenig oder keinen extrahierbaren Text. Möglicherweise ist es ein Scan.")

    elif file_type in ("jpg", "png"):
        # For v1, we don't do OCR – just inform the user
        warnings.append(
            "Bildformate werden in dieser Version nur eingeschränkt unterstützt. "
            "Für bessere Ergebnisse laden Sie bitte ein PDF hoch."
        )
        extraction_method = "image_unsupported"
        # Return empty suggestions for images in v1
        return PrefillSuggestions(
            suggestions=[],
            items=[],
            raw_text_preview=None,
            extraction_method=extraction_method,
            warnings=warnings,
        )

    if not text:
        return PrefillSuggestions(
            suggestions=[],
            items=[],
            raw_text_preview=None,
            extraction_method=extraction_method,
            warnings=warnings if warnings else ["Kein Text im Dokument gefunden."],
        )

    # Extract amounts
    amounts = extract_amounts(text)

    # Extract total amount
    total = extract_total_amount(text, amounts)
    if total:
        amount, currency, confidence = total
        suggestions.append(FieldSuggestion(
            field_key="value_amount",
            value=amount,
            confidence=confidence,
            source="regex_total",
            display_label="Warenwert",
        ))
        suggestions.append(FieldSuggestion(
            field_key="value_currency",
            value=currency,
            confidence=confidence,
            source="regex_currency",
            display_label="Währung",
        ))

    # Extract shipping cost
    shipping = extract_shipping_cost(text, amounts)
    if shipping:
        amount, currency, confidence = shipping
        suggestions.append(FieldSuggestion(
            field_key="shipping_cost",
            value=amount,
            confidence=confidence,
            source="regex_shipping",
            display_label="Versandkosten",
        ))

    # Extract merchant name
    merchant = extract_merchant_name(text)
    if merchant:
        name, confidence = merchant
        suggestions.append(FieldSuggestion(
            field_key="sender_name",
            value=name,
            confidence=confidence,
            source="regex_merchant",
            display_label="Händlername / Absender",
        ))

    # Extract items
    items = extract_items(text)

    # Add confidence warning for low-confidence suggestions
    low_conf = [s for s in suggestions if s.confidence < 0.6]
    if low_conf:
        warnings.append(
            "Einige Vorschläge haben eine niedrige Konfidenz. Bitte besonders sorgfältig prüfen."
        )

    # Truncate text preview for debugging (optional, not shown to user in production)
    raw_preview = text[:500] if len(text) > 0 else None

    return PrefillSuggestions(
        suggestions=suggestions,
        items=items,
        raw_text_preview=raw_preview,
        extraction_method=extraction_method,
        warnings=warnings,
    )


# --- Endpoint ---


@router.post("/upload", response_model=PrefillUploadResponse)
async def upload_and_extract(
    file: UploadFile = File(...),
    context: AuthContext = Depends(get_current_user),
) -> PrefillUploadResponse:
    """
    Upload an invoice/receipt and extract field suggestions.

    Accepts: PDF, JPG, PNG (max 10 MB)

    Returns suggestions with confidence scores. User must confirm each field.

    Privacy:
    - Files are processed in memory only
    - No permanent storage
    - No external services
    - No logging of file contents
    """
    # Validate content type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Ungültiger Dateityp. Erlaubt: PDF, JPG, PNG.",
            },
        )

    file_type = ALLOWED_MIME_TYPES[content_type]

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"Datei zu groß. Maximum: 10 MB.",
            },
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMPTY_FILE",
                "message": "Die hochgeladene Datei ist leer.",
            },
        )

    # Process document and extract suggestions
    # Note: We do NOT store the file - process in memory only
    suggestions = process_document(content, file_type)

    return PrefillUploadResponse(data=suggestions)


@router.get("/info")
async def get_prefill_info(
    context: AuthContext = Depends(get_current_user),
) -> dict:
    """
    Get information about the prefill feature.
    """
    return {
        "data": {
            "supported_formats": ["PDF", "JPG", "PNG"],
            "max_file_size_mb": 10,
            "features": [
                "Händlername erkennen",
                "Gesamtbetrag erkennen",
                "Währung erkennen",
                "Versandkosten erkennen",
                "Positionen erkennen (wenn klar strukturiert)",
            ],
            "limitations": [
                "Keine automatische Übernahme – Vorschläge müssen bestätigt werden",
                "Bilder (JPG/PNG) werden in v1 nur eingeschränkt unterstützt",
                "Handgeschriebene Rechnungen werden nicht erkannt",
                "Komplexe Layouts können zu ungenauen Ergebnissen führen",
            ],
            "privacy": {
                "storage": "Keine Speicherung – Verarbeitung nur im Arbeitsspeicher",
                "external_services": "Keine externen Dienste",
                "training": "Keine Verwendung für Training",
                "logging": "Keine Protokollierung von Dateiinhalten",
            },
        }
    }
