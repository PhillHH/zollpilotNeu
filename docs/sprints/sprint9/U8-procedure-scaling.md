# Sprint 9 – U8: IPK & IAA als Config (Procedure Scaling)

> **Status**: Abgeschlossen
> **Datum**: 2026-02-01

---

## Zusammenfassung

Implementierung von IPK und IAA als konfigurierbare Verfahren mit der gleichen UX wie IZA. Das Procedure Configuration System ermöglicht das Hinzufügen neuer Verfahren ohne Änderungen an der Geschäftslogik.

---

## Umgesetzte Features

### A) Procedure-Config-Struktur

**Neue Verzeichnisstruktur:**

```
apps/web/src/procedures/
├── types.ts                 # Typdefinitionen
├── index.ts                 # Procedure Registry
├── IZA/v1/                  # IZA v1 Config
│   ├── meta.ts
│   ├── steps.ts
│   ├── mapping.ts
│   ├── hints.ts
│   └── index.ts
├── IPK/v1/                  # IPK v1 Config
│   └── ...
└── IAA/v1/                  # IAA v1 Config
    └── ...
```

**Versionierung:**
- IZA:v1 (bestehend)
- IPK:v1 (neu)
- IAA:v1 (neu)

### B) Backend

**Procedure Registry:**
- GET /procedures – Liste aller aktiven Verfahren
- GET /procedures/{code} – Vollständige Verfahrensdefinition

**Validierung:**
- IPK-spezifische Business Rules implementiert
- IAA-spezifische Business Rules implementiert

**Migration:**
- 0014_ipk_iaa_v1/migration.sql erstellt
- Bestehende IZA-Cases bleiben auf v1

### C) Frontend

**Procedure Config:**
- Wizard lädt Procedure dynamisch aus Registry
- Mapping View nutzt jeweilige mapping.ts
- TypeScript Path Alias @/procedures konfiguriert

**UI zeigt:**
- Verfahrenstyp (IZA, IPK, IAA)
- Kurzbeschreibung
- Zielgruppe (Privat / Kleinunternehmen)

### D) Initiale Inhalte

**IPK v1:**
- Schritt 1: Grunddaten (Sendungsnummer, Beschreibung, Menge, Gewicht)
- Schritt 2: Warenwert (Betrag, Währung, Versandkosten)
- Schritt 3: Herkunft (Ursprungsland, Lieferant)

**IAA v1:**
- Schritt 1: Absender (Firma, Adresse in DE)
- Schritt 2: Empfänger (Adresse im Ausland)
- Schritt 3: Geschäftsart (Ausfuhrart, Warenwert)

**Einschränkungen:**
- Keine Sonderfälle
- Kein Expertenmodus
- Keine HS-Code-Ermittlung

### E) Tests

**Backend-Tests (test_procedures.py):**
- ✅ Procedure-Liste enthält IZA, IPK, IAA
- ✅ GET /procedures/IPK gibt Steps und Fields zurück
- ✅ GET /procedures/IAA gibt Steps und Fields zurück
- ✅ Binding von IPK/IAA zu Cases funktioniert
- ✅ Alle drei Verfahren verfügbar

**Frontend:**
- ✅ Procedure Registry Tests
- ✅ Type-Safety durch TypeScript

### F) Dokumentation

**Neu erstellt:**
- docs/PROCEDURES/OVERVIEW.md
- docs/PROCEDURES/IPK.md
- docs/PROCEDURES/IAA.md

**Aktualisiert:**
- docs/ARCHITECTURE.md (Procedure Config Layer)
- apps/web/tsconfig.json (Path Alias)

---

## Dateien

### Neue Dateien

| Pfad | Beschreibung |
|------|--------------|
| `apps/web/src/procedures/types.ts` | Typdefinitionen |
| `apps/web/src/procedures/index.ts` | Procedure Registry |
| `apps/web/src/procedures/IZA/v1/*` | IZA v1 Config |
| `apps/web/src/procedures/IPK/v1/*` | IPK v1 Config |
| `apps/web/src/procedures/IAA/v1/*` | IAA v1 Config |
| `prisma/migrations/0014_ipk_iaa_v1/migration.sql` | DB Migration |
| `docs/PROCEDURES/OVERVIEW.md` | Übersichtsdoku |
| `docs/PROCEDURES/IPK.md` | IPK Dokumentation |
| `docs/PROCEDURES/IAA.md` | IAA Dokumentation |

### Geänderte Dateien

| Pfad | Änderung |
|------|----------|
| `apps/api/app/domain/procedures.py` | IPK/IAA Validierung |
| `apps/api/tests/test_procedures.py` | IPK/IAA Tests |
| `apps/web/src/app/.../MappingConfig.ts` | Registry-Import |
| `apps/web/tsconfig.json` | Path Alias |
| `docs/ARCHITECTURE.md` | Procedure Config Layer |

---

## New Procedures

| Code | Version | Steps | Fields | Status |
|------|---------|-------|--------|--------|
| IPK | v1 | 3 | 11 | ✅ Aktiv |
| IAA | v1 | 3 | 16 | ✅ Aktiv |

---

## Gaps / Notes

- Keine Sonderverfahren implementiert
- Kein ATLAS-Zugang (by design)
- Keine automatische Tarifnummer-Ermittlung
- Keine Zollberechnung
- Keine Dual-Use-Prüfung (für IAA)
- Keine Embargo-Länder-Warnung (für IAA)

Diese Features sind für spätere Sprints geplant.

---

## Nächste Schritte

1. Frontend-Integration testen
2. E2E-Tests für IPK/IAA Wizard
3. Knowledge Base Inhalte für IPK/IAA ergänzen
4. PDF-Templates für IPK/IAA erstellen
