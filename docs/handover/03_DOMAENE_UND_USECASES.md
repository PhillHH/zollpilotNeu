# 03 - Domäne und Use Cases

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Erkannte Zollverfahren

### Übersicht der implementierten Verfahren

| Code | Name | Zielgruppe | Status | Schritte | Felder |
|------|------|------------|--------|----------|--------|
| **IZA** | Internetbestellung Import Zollanmeldung | Privat | ✅ Aktiv | 4 | 12 |
| **IPK** | Import-Paketverkehr | Business | ✅ Aktiv | 3 | 10 |
| **IAA** | Internet-Ausfuhranmeldung | Business | ✅ Aktiv | 3 | 16 |

**Nicht implementiert:** ATLAS-Integration (bewusst außerhalb des Scope)

---

## IZA - Internetbestellung Import Zollanmeldung

### Zweck
Vorbereitung einer Zollanmeldung für **Privatpersonen**, die Waren aus dem Nicht-EU-Ausland importieren.

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Schritt 1 │────▶│   Schritt 2 │────▶│   Schritt 3 │────▶│   Schritt 4 │
│   Sendung   │     │   Absender  │     │  Empfänger  │     │   Zusatz    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  - Inhalt            - Name              - Vollständiger     - Kommerzielle
  - Wert              - Land                Name                 Nutzung?
  - Währung                               - Adresse            - Bemerkungen
  - Herkunftsland                         - PLZ, Stadt
  - Versandkosten                         - Land (=DE)
```

### Felder (aus `/apps/web/src/procedures/IZA/v1/steps.ts`)

| Schritt | Feld | Typ | Pflicht | Beschreibung |
|---------|------|-----|---------|--------------|
| package | content_description | TEXT | ✅ | Wareninhalt |
| package | value_amount | NUMBER | ✅ | Warenwert |
| package | value_currency | CURRENCY | ✅ | Währung |
| package | origin_country | COUNTRY | ✅ | Herkunftsland (≠ DE) |
| package | shipping_cost | NUMBER | ❌ | Versandkosten |
| sender | sender_name | TEXT | ✅ | Name des Absenders |
| sender | sender_country | COUNTRY | ✅ | Land des Absenders (≠ DE) |
| recipient | recipient_name | TEXT | ✅ | Vollständiger Empfängername |
| recipient | recipient_address | TEXT | ✅ | Straße und Hausnummer |
| recipient | recipient_postcode | TEXT | ✅ | Postleitzahl |
| recipient | recipient_city | TEXT | ✅ | Stadt |
| recipient | recipient_country | COUNTRY | ✅ | Empfängerland (= DE) |
| additional | commercial_goods | BOOLEAN | ❌ | Kommerzielle Waren? |
| additional | remarks | TEXT | ❌ | Zusätzliche Hinweise |

### Validierungsregeln (aus `/apps/api/app/domain/procedures.py`)

```python
# IZA-spezifische Business-Regeln
- value_amount > 0          # Warenwert muss positiv sein
- origin_country ≠ "DE"     # Import von außerhalb DE
- sender_country ≠ "DE"     # Absender außerhalb DE
- recipient_country = "DE"  # Empfänger in Deutschland
- IF commercial_goods:      # Bei kommerzieller Nutzung
    remarks IS REQUIRED     # Begründung erforderlich
```

### Mapping zu Zollformular

| ZollPilot-Feld | Zoll-Formular-Abschnitt |
|----------------|-------------------------|
| content_description | IZA – Sendungsinhalt |
| value_amount + currency | IZA – Warenwert |
| origin_country | IZA – Ursprungsland |
| sender_* | IZA – Absender |
| recipient_* | IZA – Empfänger (Anmelder) |

---

## IPK - Import-Paketverkehr

### Zweck
Vorbereitung einer Zollanmeldung für **kleine Unternehmen**, die regelmäßig Pakete aus dem Nicht-EU-Ausland importieren.

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Schritt 1 │────▶│   Schritt 2 │────▶│   Schritt 3 │
│  Grunddaten │     │  Warenwert  │     │   Herkunft  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  - Sendungsnr.       - Betrag            - Ursprungsland
  - Inhalt            - Währung           - Absender
  - Anzahl            - Versandkosten     - Adresse
  - Gewicht           - Rechnungsnr.
```

### Felder (aus `/apps/web/src/procedures/IPK/v1/steps.ts`)

| Schritt | Feld | Typ | Pflicht |
|---------|------|-----|---------|
| grunddaten | shipment_number | TEXT | ✅ |
| grunddaten | content_description | TEXT | ✅ |
| grunddaten | quantity | NUMBER | ✅ |
| grunddaten | weight_kg | NUMBER | ✅ |
| warenwert | value_amount | NUMBER | ✅ |
| warenwert | value_currency | CURRENCY | ✅ |
| warenwert | shipping_cost | NUMBER | ❌ |
| warenwert | invoice_number | TEXT | ❌ |
| herkunft | origin_country | COUNTRY | ✅ |
| herkunft | sender_name | TEXT | ✅ |
| herkunft | sender_country | COUNTRY | ✅ |
| herkunft | sender_address | TEXT | ❌ |

### Validierungsregeln

```python
# IPK-spezifische Business-Regeln
- value_amount > 0          # Warenwert positiv
- origin_country ≠ "DE"     # Import von außerhalb DE
- sender_country ≠ "DE"     # Absender außerhalb DE
- quantity ≥ 1              # Mindestens 1 Stück
- weight_kg > 0             # Gewicht erforderlich
```

---

## IAA - Internet-Ausfuhranmeldung

### Zweck
Vorbereitung einer Ausfuhranmeldung für **Unternehmen**, die Waren aus Deutschland in Nicht-EU-Länder exportieren.

### Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Schritt 1 │────▶│   Schritt 2 │────▶│   Schritt 3 │
│   Absender  │     │  Empfänger  │     │ Geschäftsart│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  - Firma             - Firma             - Export-Typ
  - Ansprechpartner   - Name              - Inhalt
  - Adresse (DE)      - Adresse           - Wert, Währung
                      - Land (≠ DE)       - Gewicht
```

### Felder (aus `/apps/web/src/procedures/IAA/v1/steps.ts`)

| Schritt | Feld | Typ | Pflicht |
|---------|------|-----|---------|
| absender | company_name | TEXT | ✅ |
| absender | contact_person | TEXT | ✅ |
| absender | sender_address | TEXT | ✅ |
| absender | sender_postcode | TEXT | ✅ |
| absender | sender_city | TEXT | ✅ |
| absender | sender_country | COUNTRY | ✅ (= DE) |
| empfaenger | recipient_company | TEXT | ❌ |
| empfaenger | recipient_name | TEXT | ✅ |
| empfaenger | recipient_address | TEXT | ✅ |
| empfaenger | recipient_city | TEXT | ✅ |
| empfaenger | recipient_postcode | TEXT | ❌ |
| empfaenger | recipient_country | COUNTRY | ✅ (≠ DE) |
| geschaeftsart | export_type | SELECT | ✅ |
| geschaeftsart | content_description | TEXT | ✅ |
| geschaeftsart | value_amount | NUMBER | ✅ |
| geschaeftsart | value_currency | CURRENCY | ✅ |
| geschaeftsart | weight_kg | NUMBER | ✅ |
| geschaeftsart | remarks | TEXT | ❌ |

### Export-Typen (aus Validierung)

```python
export_type ∈ [
    "Verkauf",      # Verkauf ins Ausland
    "Muster",       # Muster/Proben
    "Reparatur",    # Zur Reparatur
    "Rücksendung",  # Rücksendung
    "Sonstige"      # Andere Gründe
]
```

### Validierungsregeln

```python
# IAA-spezifische Business-Regeln
- value_amount > 0          # Warenwert positiv
- sender_country = "DE"     # Export AUS Deutschland
- recipient_country ≠ "DE"  # Export NACH außerhalb DE
- weight_kg > 0             # Gewicht erforderlich
- export_type ∈ [...]       # Gültiger Export-Typ
```

---

## Flow-Vollständigkeit

### Vollständig implementiert

| Flow | Status | Bemerkung |
|------|--------|-----------|
| Case erstellen | ✅ | Titel + Tenant-Zuordnung |
| Verfahren auswählen | ✅ | ProcedureSelector Komponente |
| Wizard ausfüllen | ✅ | Autosave, Validierung |
| Validierung | ✅ | Server-side, Procedure-spezifisch |
| Submit | ✅ | Status → SUBMITTED, Snapshot |
| Summary ansehen | ✅ | Formatierte Übersicht |
| PDF exportieren | ✅ | WeasyPrint, 1 Credit |
| Assist-Modus | ✅ | Copy-to-Clipboard mit Tracking |

### Unvollständig / Fehlend

| Flow | Status | Was fehlt |
|------|--------|-----------|
| Reopen nach Submit | ❌ | Nicht implementiert (Case bleibt read-only) |
| Case duplizieren | ❌ | Kein "Als Vorlage nutzen" |
| Batch-Operationen | ❌ | Mehrere Cases gleichzeitig |
| Export nach ATLAS | ❌ | Bewusst out of scope |
| HSCode-Suche | ❌ | Kein Tarif-Lookup |
| Zoll-Berechnung | ❌ | Keine Duty/VAT-Vorschau |

---

## Nutzerführung im Wizard

### Aktuelle Implementierung

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WIZARD UI                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  STEP SIDEBAR                 │  FORM AREA                       │   │
│  │  ────────────────             │  ────────────────────────────    │   │
│  │  ● Sendung (aktiv)            │                                  │   │
│  │  ○ Absender                   │  Wareninhalt *                   │   │
│  │  ○ Empfänger                  │  ┌────────────────────────────┐  │   │
│  │  ○ Zusatz                     │  │ Elektronikteile            │  │   │
│  │                               │  └────────────────────────────┘  │   │
│  │  [Fehler-Badge wenn Fehler]   │                                  │   │
│  │                               │  Warenwert *                     │   │
│  │                               │  ┌────────────────────────────┐  │   │
│  │                               │  │ 250.00                     │  │   │
│  │                               │  └────────────────────────────┘  │   │
│  │                               │  ⚠ Hinweis: Warenwert ohne      │   │
│  │                               │    Versandkosten                 │   │
│  │                               │                                  │   │
│  └───────────────────────────────┴──────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  [Zurück]                [Prüfen]                    [Weiter →]  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Führungsmechanismen

| Mechanismus | Implementierung | Dateipfad |
|-------------|----------------|-----------|
| **Step-Sidebar** | Zeigt aktiven Schritt, Fehler-Badges | `WizardClient.tsx` |
| **Feld-Hinweise** | Tooltip/Text unter Feldern | `hints.ts` pro Verfahren |
| **Validierungsfehler** | Inline-Anzeige pro Feld | `FieldRenderer.tsx` |
| **Mapping-Ansicht** | Tab zeigt Zuordnung zu Zollformular | `MappingView.tsx` |
| **Autosave-Feedback** | "Speichern...", "Gespeichert" | `WizardClient.tsx` |
| **Prefill-Option** | Rechnung hochladen → Vorschläge | `InvoicePrefill.tsx` |

### Hint-System (Knowledge Base)

Jedes Verfahren definiert Feld-spezifische Erklärungen:

```typescript
// apps/web/src/procedures/IZA/v1/hints.ts
export const hints: Record<string, string> = {
  value_amount:
    "Der Warenwert ist der Kaufpreis ohne Versandkosten. " +
    "Bei Geschenken schätzen Sie den Marktwert.",

  origin_country:
    "Das Ursprungsland ist das Land, in dem die Ware " +
    "hergestellt wurde – nicht unbedingt das Absenderland.",

  commercial_goods:
    "Kommerzielle Waren sind Produkte, die Sie " +
    "gewerblich nutzen oder weiterverkaufen möchten."
};
```

---

## KI-Status: Erwartung vs. Realität

### Erwartung (Marketing/Vision)
"KI-gestützte Plattform, die Nutzer durch Zollverfahren leitet"

### Realität (Code-Analyse)

| Feature | Erwartete KI | Tatsächliche Implementierung |
|---------|--------------|------------------------------|
| **Rechnungs-Prefill** | OCR + ML | Regex-Extraktion (pdfplumber) |
| **Feldvorschläge** | LLM-basiert | Profil-Autofill (statisch) |
| **Fehlerkorrektur** | Intelligente Hints | Feste Fehlermeldungen |
| **HSCode-Suche** | ML-Klassifikation | Nicht implementiert |

### Prefill-Implementierung (aus `/apps/api/app/routes/prefill.py`)

```python
# Keine KI - nur Regex-Muster
def extract_total_amount(text: str) -> Optional[float]:
    """Sucht nach Mustern wie 'Gesamt: 150,00 EUR'"""
    patterns = [
        r"(?:gesamt|total|summe)[:\s]*([0-9.,]+)",
        r"([0-9.,]+)\s*(?:EUR|€|USD|\$)"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return parse_amount(match.group(1))
    return None
```

**Fazit:** Der Begriff "KI-gestützt" ist aktuell **Marketing-Vision**, nicht Code-Realität. Das Prefill-System verwendet heuristische Regex-Extraktion.

---

## Fehlende Domänenkonzepte

### 1. Warennummer / HSCode

**Problem:** Nutzer müssen die Zolltarifnummer manuell wissen

**Aktuell:** Kein Feld für HSCode, kein Lookup

**Benötigt:**
- HSCode-Datenbank (EU TARIC)
- Suchfunktion mit Autocomplete
- Optional: ML-basierte Vorschläge

### 2. Zoll- und MwSt-Berechnung

**Problem:** Nutzer wissen nicht, was sie zahlen müssen

**Aktuell:** Keine Berechnung

**Benötigt:**
- Zollsatz-Datenbank pro HSCode
- Berechnung: Zoll + EUSt
- Haftungsausschluss

### 3. Dokumenten-Management

**Problem:** Zollanmeldungen erfordern oft Belege (Rechnung, Ursprungszeugnis)

**Aktuell:** Nur temporärer Upload für Prefill

**Benötigt:**
- Persistente Dokumentenspeicherung
- Zuordnung zu Cases
- GDPR-konformes Handling

### 4. Versanddienstleister-Integration

**Problem:** Tracking-Infos könnten importiert werden

**Aktuell:** Keine Integration

**Möglich:**
- DHL, UPS, FedEx APIs
- Automatischer Sendungsstatus

### 5. Compliance-Prüfungen

**Problem:** Sanktionslisten, Embargo-Prüfungen

**Aktuell:** Nicht implementiert

**Relevant für:**
- IAA (Export) - Embargolisten
- Dual-Use-Güter-Prüfung

---

## Zusammenfassung

| Aspekt | Bewertung |
|--------|-----------|
| **Verfahrensabdeckung** | ✅ 3 Kernverfahren implementiert |
| **Workflow-Vollständigkeit** | ✅ End-to-End funktional |
| **Nutzerführung** | ✅ Wizard mit Hints und Validation |
| **KI-Integration** | ⚠️ Nur Regex, keine echte KI |
| **Domänentiefe** | ⚠️ Grundlagen vorhanden, Expertenfunktionen fehlen |
| **Erweiterbarkeit** | ✅ Config-driven, neue Verfahren möglich |
