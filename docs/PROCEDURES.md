# Procedures

This document describes the Procedure Engine architecture and how to work with procedures.

## Overview

Procedures define customs processes (IZA, IPK, IAA) as **data**, not UI code.
Each procedure consists of:
- **Steps**: Logical groupings of fields (like wizard pages)
- **Fields**: Individual form inputs with type and validation rules

## Data Model

### Procedure

```
Procedure
├── id (uuid)
├── code (unique within version, e.g., "IZA")
├── name (display name)
├── version (e.g., "v1", "v2")
├── is_active (soft disable)
├── created_at, updated_at
└── steps[] → ProcedureStep
```

### ProcedureStep

```
ProcedureStep
├── id (uuid)
├── procedure_id (FK)
├── step_key (unique within procedure, e.g., "package")
├── title (display title)
├── order (display order)
├── is_active
└── fields[] → ProcedureField
```

### ProcedureField

```
ProcedureField
├── id (uuid)
├── procedure_step_id (FK)
├── field_key (unique within step, e.g., "tracking_number")
├── field_type (enum)
├── required (bool)
├── config_json (type-specific options)
└── order (display order)
```

## Field Types

| Type | Description | Config Options |
|------|-------------|----------------|
| `TEXT` | Single/multi-line text | `maxLength`, `placeholder`, `pattern` |
| `NUMBER` | Numeric input | `min`, `max`, `step` |
| `SELECT` | Dropdown selection | `options[]` |
| `COUNTRY` | ISO 2-letter country code | `placeholder` |
| `CURRENCY` | ISO 3-letter currency code | `placeholder` |
| `BOOLEAN` | Checkbox/toggle | `label` |

### Config Examples

**TEXT with max length:**
```json
{ "maxLength": 100, "placeholder": "Enter name" }
```

**NUMBER with range:**
```json
{ "min": 0.01, "max": 1000, "step": 0.01 }
```

**SELECT with options:**
```json
{ "options": ["AIR", "SEA", "ROAD", "RAIL"] }
```

## Versioning Strategy

### Why Version?

1. **Compliance**: Old cases must remain valid against their original rules
2. **Audit Trail**: Track what rules applied when
3. **Gradual Migration**: New cases use new version, old cases keep old version

### Version Format

Use semantic-ish versions: `v1`, `v2`, `v3`

### Creating a New Version

1. Create new Procedure record with same code, new version
2. Copy steps and fields (or modify as needed)
3. Set `is_active = true` on new version
4. Optionally deactivate old version (`is_active = false`)

**Note**: Deactivating a version doesn't affect existing cases bound to it.

## Case Binding

### Binding Flow

1. Create a case
2. Call `POST /cases/{id}/procedure` with `procedure_code`
3. Case gets `procedure_id` + `procedure_version` set
4. Case is now "locked" to that procedure version

### Validation

1. Fill case fields via `PUT /cases/{id}/fields/{key}`
2. Call `POST /cases/{id}/validate`
3. Engine checks:
   - All required fields are present and non-empty
   - Field values match their type constraints
4. Returns `{ valid: true/false, errors: [...] }`

## Adding New Procedures

### Via Migration (Recommended for Production)

```sql
DO $$
DECLARE
    proc_id TEXT := gen_random_uuid()::TEXT;
    step_id TEXT := gen_random_uuid()::TEXT;
BEGIN
    INSERT INTO "Procedure" ("id", "code", "name", "version", "is_active", "created_at", "updated_at")
    VALUES (proc_id, 'IPK', 'Import Permit Application', 'v1', true, NOW(), NOW());

    INSERT INTO "ProcedureStep" ("id", "procedure_id", "step_key", "title", "order", "is_active")
    VALUES (step_id, proc_id, 'basic_info', 'Basic Information', 1, true);

    INSERT INTO "ProcedureField" ("id", "procedure_step_id", "field_key", "field_type", "required", "config_json", "order")
    VALUES
        (gen_random_uuid()::TEXT, step_id, 'product_description', 'TEXT', true, '{"maxLength": 500}', 1),
        (gen_random_uuid()::TEXT, step_id, 'quantity', 'NUMBER', true, '{"min": 1}', 2);
END $$;
```

### Via Admin API (Future)

Not yet implemented. Use migrations for now.

## Procedures Status

| Code | Version | Status | Beschreibung |
|------|---------|--------|--------------|
| IZA | v1 | ✅ **Stabil** | Vollständig implementiert, getestet, produktionsreif |
| IPK | - | 📋 Geplant | Import Permit Application – für genehmigungspflichtige Waren |
| IAA | - | 📋 Geplant | Internationale Ausfuhranmeldung |

## Seeded Procedures

### IZA v1 – Internetbestellung Import Zollanmeldung

**Status: ✅ STABIL (Sprint 1 Complete)**

Das IZA-Verfahren führt Nutzer durch die Erfassung aller Angaben, die für eine private Einfuhr aus dem Nicht-EU-Ausland nach Deutschland erforderlich sind.

**Steps:**

| Step Key | Titel | Beschreibung |
|----------|-------|--------------|
| `package` | Über dein Paket | Warenbeschreibung, Wert, Herkunft |
| `sender` | Absender | Versender-Informationen |
| `recipient` | Empfänger | Lieferadresse in Deutschland |
| `additional` | Weitere Angaben | Gewerblich/Privat, Bemerkungen |

**Fields:**

| Step | Key | Type | Required | Config |
|------|-----|------|----------|--------|
| package | contents_description | TEXT | ✓ | Inhaltsbeschreibung mit Beispiel |
| package | value_amount | NUMBER | ✓ | min: 0.01, Warenwert |
| package | value_currency | CURRENCY | ✓ | Währung der Bestellung |
| package | origin_country | COUNTRY | ✓ | Versandland (≠ DE) |
| sender | sender_name | TEXT | ✓ | Absendername/Firma |
| sender | sender_country | COUNTRY | ✓ | Absenderland (≠ DE) |
| recipient | recipient_full_name | TEXT | ✓ | Vollständiger Name |
| recipient | recipient_address | TEXT | ✓ | Straße + Hausnummer |
| recipient | recipient_postcode | TEXT | ✓ | PLZ |
| recipient | recipient_city | TEXT | ✓ | Stadt |
| recipient | recipient_country | COUNTRY | ✓ | Muss DE sein |
| additional | commercial_goods | BOOLEAN | ✓ | Gewerbliche Einfuhr? |
| additional | remarks | TEXT | | Bei gewerblich: erforderlich |

**Business Rules (IZA v1):**

| Regel | Fehlermeldung |
|-------|---------------|
| `origin_country ≠ DE` | "Das Herkunftsland darf nicht Deutschland sein – es handelt sich um eine Einfuhr." |
| `sender_country ≠ DE` | "Der Absender muss außerhalb Deutschlands sitzen." |
| `recipient_country = DE` | "Bei einer Einfuhr nach Deutschland muss das Empfängerland Deutschland sein." |
| `value_amount > 0` | "Der Warenwert muss größer als 0 sein." |
| `commercial_goods = true → remarks required` | "Bei gewerblichen Einfuhren sind Bemerkungen erforderlich." |

## API Reference

See `docs/API_CONTRACTS.md` for endpoint documentation:

- `GET /procedures` - List active procedures
- `GET /procedures/{code}` - Get procedure definition
- `POST /cases/{id}/procedure` - Bind procedure to case
- `POST /cases/{id}/validate` - Validate case fields

## Wizard UI Rendering

The frontend Wizard Renderer displays fields based on their `field_type` and `config_json`.

### How Fields Appear in the Wizard

| field_type | Rendered As | Config Used |
|------------|-------------|-------------|
| TEXT | Text input | `placeholder`, `maxLength` |
| NUMBER | Number input | `min`, `max`, `step`, `placeholder` |
| BOOLEAN | Checkbox | `label` (displayed next to checkbox) |
| SELECT | Dropdown | `options[]` (array of values) |
| COUNTRY | Country dropdown | `placeholder` (predefined country list) |
| CURRENCY | Currency dropdown | `placeholder` (predefined currency list) |

### Config Examples for UI

**TEXT with placeholder and max length:**
```json
{
  "title": "Tracking Number",
  "placeholder": "e.g., 1Z999AA10123456784",
  "maxLength": 50
}
```

**NUMBER for weight:**
```json
{
  "title": "Weight (kg)",
  "min": 0.01,
  "max": 1000,
  "step": 0.01,
  "placeholder": "Enter weight"
}
```

**BOOLEAN checkbox:**
```json
{
  "label": "Business Customer"
}
```

**SELECT with predefined options:**
```json
{
  "title": "Transport Mode",
  "options": ["AIR", "SEA", "ROAD", "RAIL"]
}
```

### Labels and Titles

The wizard uses the following priority for field labels:
1. `config.title` if present
2. `config.label` if present (mainly for BOOLEAN)
3. `field_key` as fallback

### Autosave Behavior

- Fields are saved automatically after 500ms of inactivity
- Visual indicator shows: Saving... → ✓ Saved → (idle)
- Errors are shown if save fails

### Validation Display

- Validation runs on step change or explicit "Prüfen" button
- Errors are shown:
  - Per-field: Red border and message below field
  - Per-step: Error count badge in sidebar
  - Summary: Error list at top of step

## Snapshots (Case Submissions)

### What is a Snapshot?

A **CaseSnapshot** is an immutable record created when a case is submitted. It captures:
- All field values at submission time (`fields_json`)
- The validation result (`validation_json`)
- The procedure code and version used
- Timestamp of submission

### Legal/Technical Significance

**Legal:**
- Snapshots provide a tamper-proof audit trail
- They prove exactly what was submitted and when
- Validation result confirms data met requirements at submission
- Can be used for dispute resolution or compliance audits

**Technical:**
- Snapshots are never modified after creation
- Multiple versions supported (future: reopen + re-submit creates v2)
- `fields_json` stores the complete state, not deltas
- Independent of current case fields (which may change on reopen)

### Snapshot Access

```
GET /cases/{id}/snapshots      → List all versions
GET /cases/{id}/snapshots/{v}  → Get specific version detail
```

### Example Snapshot

```json
{
  "id": "snap-uuid",
  "case_id": "case-uuid",
  "version": 1,
  "procedure_code": "IZA",
  "procedure_version": "v1",
  "fields_json": {
    "tracking_number": "1Z999AA10123456784",
    "weight_kg": 5.5,
    "recipient_name": "Max Mustermann",
    "is_business": false
  },
  "validation_json": {
    "valid": true,
    "errors": []
  },
  "created_at": "2024-01-15T14:30:00Z"
}
```

## Summary to PDF Mapping

When a case is exported as PDF, the summary data is formatted and rendered:

### Data Flow

```
Snapshot (fields_json)
    │
    ▼
Summary Generator (procedure-specific)
    │
    ▼
Formatted Sections + Items
    │
    ▼
HTML Template (Jinja2)
    │
    ▼
PDF (WeasyPrint)
```

### Field Formatting

| Field Type | Example Value | Formatted Output |
|------------|---------------|------------------|
| TEXT | "Electronics" | "Electronics" |
| NUMBER | 150.50 | "150,50 €" (with currency) |
| BOOLEAN | true | "Ja" |
| COUNTRY | "DE" | "Deutschland" |
| CURRENCY | "EUR" | "€ (Euro)" |
| SELECT | "express" | As stored |

### Section Mapping (IZA)

The IZA procedure maps to 4 PDF sections:

1. **Paket** → Package fields (content, value, origin)
2. **Absender** → Sender fields (name, country)
3. **Empfänger** → Recipient fields (name, address, country)
4. **Weitere Angaben** → Additional fields (commercial, remarks)

### PDF Layout

- **Header**: Logo, generation date, request ID
- **Case Info**: Case ID, version, procedure
- **Sections**: Label-value table per section
- **Footer**: Disclaimer, page numbers

## Future Enhancements

- Admin UI for procedure management
- Field dependencies (show field X only if field Y = value)
- Computed fields
- Multi-language support for titles/labels
- Procedure templates/inheritance
- Case reopen with version increment
- Multiple PDF templates per procedure

