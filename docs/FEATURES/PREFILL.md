# Prefill – Rechnungs-Scan & Vorschläge

> **Sprint 8 – U7**: Scan & Vorbefüllen (Speed ohne Automatik)

---

## Übersicht

Die Prefill-Funktion ermöglicht das Hochladen von Rechnungen oder Bestellbestätigungen, um Feldvorschläge für den Wizard zu erhalten. Dies beschleunigt die Dateneingabe erheblich.

**Kernprinzipien:**
- **Nichts wird automatisch entschieden** – alle Vorschläge müssen bestätigt werden
- **Volle Kontrolle beim Nutzer** – feldweise Übernahme mit Checkboxen
- **DSGVO-first** – keine externe Verarbeitung, kein Training
- **Transparenz** – Konfidenz-Scores zeigen Unsicherheit

---

## Unterstützte Formate

| Format | Support | Hinweis |
|--------|---------|---------|
| PDF | Voll | Textbasierte PDFs werden vollständig extrahiert |
| JPG | Eingeschränkt | v1: Keine OCR, nur Hinweis auf PDF-Upload |
| PNG | Eingeschränkt | v1: Keine OCR, nur Hinweis auf PDF-Upload |

**Maximale Dateigröße:** 10 MB

---

## Extraktion (v1 – Heuristisch)

Die Extraktion in v1 ist **regelbasiert** (Regex), keine KI/ML.

### Erkannte Felder

| Feld | Erkennung | Beispiel |
|------|-----------|----------|
| Warenwert | Beträge nahe "Gesamt", "Total", "Summe" | "Gesamt: €150,00" |
| Währung | Symbole und Codes | €, $, £, EUR, USD, GBP |
| Versandkosten | Beträge nahe "Versand", "Shipping" | "Versandkosten: €5,99" |
| Händlername | Muster wie "von", "Verkäufer" | "Rechnung von: Amazon" |
| Positionen | Zeilen mit Produktname + Preis | "iPhone 15 Pro €1199,00" |

### Konfidenz-Scoring

Jeder Vorschlag erhält einen Konfidenz-Score (0.0 - 1.0):

| Score | Bedeutung | UI-Anzeige |
|-------|-----------|------------|
| ≥ 0.8 | Hoch | Grün |
| 0.5 - 0.79 | Mittel | Gelb |
| < 0.5 | Niedrig | Rot |

**Einflussfaktoren:**
- Keyword-Nähe (z.B. "Gesamt" vor Betrag)
- Pattern-Match-Qualität
- Dokumentstruktur

---

## API

### POST /prefill/upload

Lädt ein Dokument hoch und extrahiert Vorschläge.

**Request:**
```
Content-Type: multipart/form-data
file: <PDF/JPG/PNG>
```

**Response:**
```json
{
  "data": {
    "suggestions": [
      {
        "field_key": "value_amount",
        "value": 150.00,
        "confidence": 0.85,
        "source": "regex_total",
        "display_label": "Warenwert"
      }
    ],
    "items": [
      {
        "name": "iPhone 15 Pro",
        "price": 1199.00,
        "currency": "EUR",
        "confidence": 0.7
      }
    ],
    "extraction_method": "pdf_text",
    "warnings": []
  }
}
```

**Fehler:**
- 400 `INVALID_FILE_TYPE` – Format nicht unterstützt
- 400 `FILE_TOO_LARGE` – > 10 MB
- 400 `EMPTY_FILE` – Leere Datei

### GET /prefill/info

Informationen zur Prefill-Funktion.

**Response:**
```json
{
  "data": {
    "supported_formats": ["PDF", "JPG", "PNG"],
    "max_file_size_mb": 10,
    "features": [...],
    "limitations": [...],
    "privacy": {
      "storage": "Keine Speicherung – Verarbeitung nur im Arbeitsspeicher",
      "external_services": "Keine externen Dienste",
      "training": "Keine Verwendung für Training",
      "logging": "Keine Protokollierung von Dateiinhalten"
    }
  }
}
```

---

## Frontend-Integration

### Wizard-CTA

Der Prefill-Button erscheint auf dem ersten Wizard-Schritt:

```
┌────────────────────────────────────────────────┐
│ 📄 Rechnung hochladen?                         │
│    Laden Sie eine Rechnung hoch – ZollPilot    │
│    schlägt passende Werte vor.                 │
│                      [Vorschläge aus Rechnung] │
└────────────────────────────────────────────────┘
```

### Vorschlags-Modal

Nach dem Upload erscheint ein Modal mit:

1. **Warnhinweis**: "ZollPilot entscheidet nicht..."
2. **Upload-Zone**: Drag & Drop oder Klick
3. **Vorschlagsliste**: Checkboxen pro Feld
4. **Positionen**: Liste erkannter Artikel (informativ)
5. **Aktionen**: "X Felder übernehmen", "Abbrechen"

### Feldweise Übernahme

Jeder Vorschlag zeigt:
- Label (z.B. "Warenwert")
- Wert (z.B. "150,00")
- Konfidenz-Badge (Hoch/Mittel/Niedrig)
- Warnung bei bereits ausgefülltem Feld

---

## Datenschutz

### Verarbeitung

- **Nur im Arbeitsspeicher** – keine Festplattenspeicherung
- **Keine externe API** – alles lokal
- **Sofortige Löschung** – nach Antwort verworfen

### Kein Logging

Folgendes wird **nicht** protokolliert:
- Dateiinhalte
- Extrahierte Werte
- Vorschläge

### DSGVO-Konformität

- Keine Übertragung an Dritte
- Keine Speicherung über Request hinaus
- Nutzer hat volle Kontrolle

---

## Einschränkungen (v1)

| Feature | Status |
|---------|--------|
| PDF-Texterkennung | ✅ Unterstützt |
| Bild-OCR | ❌ Nicht in v1 |
| Handschrift | ❌ Nicht unterstützt |
| Komplexe Layouts | ⚠️ Eingeschränkt |
| Mehrere Währungen | ⚠️ Erster Treffer |
| Automatische Übernahme | ❌ Bewusst nicht |

---

## Zukünftige Erweiterungen

- **OCR für Bilder** – Tesseract oder Cloud-OCR (mit Opt-in)
- **ML-basierte Extraktion** – Bessere Pattern-Erkennung
- **Vorlagen-Erkennung** – Bekannte Händler-Formate
- **Mehrsprachigkeit** – FR, EN Invoice-Keywords

---

## Verwandte Dokumentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Prefill Layer
- [WORDING_GUIDE.md](../WORDING_GUIDE.md) – Scan-Wording
- [API_CONTRACTS.md](../API_CONTRACTS.md) – API-Endpunkte
