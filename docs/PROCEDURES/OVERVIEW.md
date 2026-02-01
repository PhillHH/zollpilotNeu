# Procedure Configuration System

> **Sprint 9 – U8**: Konfigurierbare Verfahren für ZollPilot

---

## Übersicht

Das Procedure Configuration System ermöglicht es, neue Zollverfahren als **Konfiguration** hinzuzufügen – ohne Änderungen an der Geschäftslogik.

### Aktuell verfügbare Verfahren

| Code | Version | Name | Zielgruppe |
|------|---------|------|------------|
| IZA | v1 | Internetbestellung – Import Zollanmeldung | Privat |
| IPK | v1 | Import-Paketverkehr | Kleinunternehmen |
| IAA | v1 | Internet-Ausfuhranmeldung | Kleinunternehmen |

---

## Architektur

### Frontend Procedure Config

```
apps/web/src/procedures/
├── types.ts                 # Typdefinitionen
├── index.ts                 # Procedure Registry
├── IZA/
│   └── v1/
│       ├── meta.ts          # Name, Code, Zielgruppe
│       ├── steps.ts         # Wizard-Schritte & Felder
│       ├── mapping.ts       # Formular-Zuordnung
│       ├── hints.ts         # Erklärtexte
│       └── index.ts         # Export
├── IPK/
│   └── v1/
│       └── ...
└── IAA/
    └── v1/
        └── ...
```

### Backend Procedure Engine

```
apps/api/app/domain/procedures.py
├── ProcedureLoader          # Lädt Verfahren aus DB
├── ValidationEngine         # Validiert Case-Felder
└── Business Rules           # IZA/IPK/IAA-spezifische Regeln
```

### Datenbank (Prisma)

```
Procedure
├── ProcedureStep
│   └── ProcedureField
```

---

## Konfigurationsstruktur

### meta.ts

Definiert Metadaten des Verfahrens:

```typescript
export const IZA_V1_META: ProcedureMeta = {
  code: "IZA",
  version: "v1",
  name: "Internetbestellung – Import Zollanmeldung",
  shortDescription: "Für Privatpersonen, die Waren aus dem Nicht-EU-Ausland bestellen...",
  targetAudience: "PRIVATE",  // PRIVATE | BUSINESS | BOTH
  isActive: true,
};
```

### steps.ts

Definiert Wizard-Schritte und Felder:

```typescript
export const IZA_V1_STEPS: ProcedureStepsConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  steps: [
    {
      stepKey: "package",
      title: "Paket",
      order: 1,
      fields: [
        {
          fieldKey: "value_amount",
          fieldType: "NUMBER",
          required: true,
          config: {
            title: "Warenwert",
            min: 0.01,
          },
        },
      ],
    },
  ],
};
```

### mapping.ts

Definiert, wo Felder im Zollformular einzutragen sind:

```typescript
export const IZA_V1_MAPPING: ProcedureMappingConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  displayName: "Import Zollanmeldung",
  formName: "Internetanmeldung Zoll (IZA)",
  mappings: [
    {
      fieldKey: "value_amount",
      label: "Warenwert",
      targetForm: "IZA – Angaben zur Sendung",
      targetField: 'Feld „Warenwert"',
      hint: "Der tatsächliche Kaufpreis...",
    },
  ],
};
```

### hints.ts

Definiert Erklärtexte aus der Knowledge Base:

```typescript
export const IZA_V1_HINTS: ProcedureHintsConfig = {
  procedureCode: "IZA",
  procedureVersion: "v1",
  hints: [
    {
      fieldKey: "value_amount",
      title: "Was ist der Warenwert?",
      summary: "Der tatsächliche Kaufpreis ohne Versandkosten.",
      explanation: "Der Warenwert ist die Bemessungsgrundlage für Zölle...",
    },
  ],
};
```

---

## Versionierung

### Version Freeze

Bestehende Cases behalten ihre Procedure-Version:

```
Case created → Procedure bound (IZA:v1) → Version locked
```

Auch wenn IZA:v2 erscheint, bleibt der Case auf v1.

### Neue Version erstellen

1. Neues Verzeichnis anlegen: `IZA/v2/`
2. Configs anpassen (steps, mapping, hints)
3. Datenbank-Migration erstellen
4. Tests anpassen

---

## Neues Verfahren hinzufügen

### Schritt 1: Frontend Config

```bash
mkdir -p apps/web/src/procedures/NEU/v1
```

Erstellen:
- `meta.ts`
- `steps.ts`
- `mapping.ts`
- `hints.ts`
- `index.ts`

### Schritt 2: Procedure Registry

In `apps/web/src/procedures/index.ts`:

```typescript
import { NEU_V1 } from "./NEU/v1";

export const PROCEDURE_REGISTRY = {
  // ...
  "NEU:v1": NEU_V1,
};
```

### Schritt 3: Datenbank Migration

```sql
-- prisma/migrations/XXXX_neu_v1/migration.sql
INSERT INTO "Procedure" ...
INSERT INTO "ProcedureStep" ...
INSERT INTO "ProcedureField" ...
```

### Schritt 4: Business Rules

In `apps/api/app/domain/procedures.py`:

```python
def _validate_business_rules(self, case_fields):
    if self.procedure.code == "NEU":
        errors.extend(self._validate_neu_rules(case_fields))
```

### Schritt 5: Tests

- Backend: `tests/test_procedures.py`
- Frontend: Vitest-Tests für Procedure Registry

---

## API-Endpunkte

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| GET | `/procedures` | Liste aller aktiven Verfahren |
| GET | `/procedures/{code}` | Volle Verfahrensdefinition |
| POST | `/cases/{id}/procedure` | Verfahren an Case binden |
| POST | `/cases/{id}/validate` | Case gegen Verfahren validieren |

---

## Siehe auch

- [IPK.md](./IPK.md) – Import-Paketverkehr Dokumentation
- [IAA.md](./IAA.md) – Internet-Ausfuhranmeldung Dokumentation
- [ARCHITECTURE.md](../ARCHITECTURE.md) – Procedure Engine v1
- [API_CONTRACTS.md](../API_CONTRACTS.md) – API-Endpunkte
