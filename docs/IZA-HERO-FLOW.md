# IZA Hero-Flow – Implementierte Lösung

**Datum:** 2026-02-05
**Status:** Implementiert
**Basis:** IZA-HERO-FLOW-SOLL.md

---

## Übersicht

Diese Dokumentation beschreibt den implementierten IZA (Internetbestellung – Import Zollanmeldung) Hero-Flow in ZollPilot.

---

## Statusmodell

### Case-Status (Single Source of Truth)

| Status | Label (DE) | Bedeutung | Wizard | Erlaubte Aktionen |
|--------|-----------|-----------|--------|-------------------|
| `DRAFT` | Entwurf | Interner Zwischenzustand | — | Wird sofort zu IN_PROCESS |
| `IN_PROCESS` | In Bearbeitung | Nutzer füllt Wizard aus | ✅ Editierbar | Felder bearbeiten, speichern, unterbrechen |
| `PREPARED` | Vorbereitet | Bereit für Zollanmeldung | 🔒 Read-only | PDF exportieren, Ausfüllhilfe, "Daten korrigieren", "Als erledigt markieren" |
| `COMPLETED` | Erledigt | Zollanmeldung eingereicht | 🔒 Read-only | PDF exportieren, Ansehen, Archivieren |
| `ARCHIVED` | Archiviert | Fall abgelegt | 🔒 Read-only | Nur ansehen |

### Status-Übergänge

```
DRAFT ──(bind IZA)──▶ IN_PROCESS ──(submit)──▶ PREPARED ──(complete)──▶ COMPLETED ──(archive)──▶ ARCHIVED
                                                   │
                                                   ▼
                                            (reopen)
                                                   │
                                                   ▼
                                             IN_PROCESS
```

### API-Endpunkte für Transitionen

| Transition | API-Endpunkt | Beschreibung |
|------------|--------------|--------------|
| DRAFT → IN_PROCESS | `POST /cases` mit `procedure_code` | Fall mit IZA erstellen |
| IN_PROCESS → PREPARED | `POST /cases/:id/submit` | Vorbereitung abschließen |
| PREPARED → IN_PROCESS | `POST /cases/:id/reopen` | Fall zur Bearbeitung öffnen |
| PREPARED → COMPLETED | `POST /cases/:id/complete` | Als erledigt markieren |
| COMPLETED → ARCHIVED | `POST /cases/:id/archive` | Fall archivieren |

---

## User Journey

### 1. Dashboard (Einstieg)

- **CTA**: "Neue Zollanmeldung" Button (prominent im Header)
- **Metriken**: "In Bearbeitung", "Vorbereitet", "Fälle gesamt"
- **Aktion**: Klick erstellt Case mit IZA und navigiert direkt zum Wizard

### 2. Wizard (IN_PROCESS)

- **4 Schritte**: Paket → Absender → Empfänger → Zusätzliche Angaben
- **Autosave**: Felder werden automatisch nach 500ms gespeichert
- **Navigation**: Vor/Zurück zwischen Schritten, Stepper klickbar
- **Abschluss**: "Vorbereitung abschließen" Button auf letztem Schritt
- **Profile-Defaults**: Automatisches Ausfüllen aus Benutzerprofil

### 3. Summary (PREPARED)

- **Hinweis**: "Ihre Zollanmeldung ist vorbereitet"
- **Primär-CTA**: "Ausfüllhilfe starten"
- **Sekundär-CTAs**:
  - "Daten korrigieren" → zurück zu IN_PROCESS
  - "Als erledigt markieren" → zu COMPLETED
- **PDF-Export**: Verfügbar (kostet 1 Credit)

### 4. Abschluss (COMPLETED)

- **Hinweis**: "Zollanmeldung erledigt"
- **PDF-Export**: Weiterhin verfügbar
- **Aktion**: Kann archiviert werden

---

## UI-Komponenten

### Badge-Status-Mapping

```typescript
type BadgeStatus = "draft" | "in_process" | "prepared" | "completed" | "archived";

// Farben:
// - draft: Grau (default)
// - in_process: Blau (primary)
// - prepared: Grün (success)
// - completed: Grau (neutral)
// - archived: Grau (info)
```

### CTA-Texte pro Status

| Status | CTA-Text | Link |
|--------|----------|------|
| DRAFT / IN_PROCESS | "Weiter ausfüllen" | `/wizard` |
| PREPARED | "Zusammenfassung ansehen" | `/summary` |
| COMPLETED | "Details ansehen" | `/summary` |
| ARCHIVED | "Fall ansehen" | `/summary` |

---

## Geänderte Dateien

### API & Types
- `apps/web/src/app/lib/api/client.ts`
  - `CaseStatus` Type: DRAFT | IN_PROCESS | PREPARED | COMPLETED | ARCHIVED
  - Neue Methoden: `reopen()`, `complete()`
  - `create()` mit optionalem `procedure_code`

### UI-Komponenten
- `apps/web/src/app/design-system/primitives/Badge.tsx`
  - Neue Status: `in_process`, `prepared`, `completed`
  - Neue Variante: `neutral`

### Wizard
- `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx`
  - Readonly-Logik korrigiert: `["PREPARED", "COMPLETED", "ARCHIVED"].includes(status)`
  - Readonly-Banner mit kontextsensitivem Text

### Summary
- `apps/web/src/app/app/cases/[id]/summary/SummaryClient.tsx`
  - "Daten korrigieren" Button
  - "Als erledigt markieren" Button
  - Status-abhängige Banners

### Cases-Liste
- `apps/web/src/app/app/cases/CasesClient.tsx`
  - Alle Status-Badges
  - Fortschrittsanzeige für IN_PROCESS
  - Status-spezifische CTAs

### Dashboard
- `apps/web/src/app/app/page.tsx`
  - "Neue Zollanmeldung" CTA
  - Metriken: "Vorbereitet" statt "Eingereicht"

### Tests
- `apps/web/src/app/app/cases/__tests__/status-logic.test.ts`

---

## Migration

### SUBMITTED → PREPARED

Bestehende Cases mit Status `SUBMITTED` müssen auf `PREPARED` migriert werden.

**SQL Migration:**
```sql
UPDATE cases SET status = 'PREPARED' WHERE status = 'SUBMITTED';
```

---

## Offene Punkte (Backend)

1. **API-Endpunkte implementieren**:
   - `POST /cases/:id/reopen` – PREPARED → IN_PROCESS
   - `POST /cases/:id/complete` – PREPARED → COMPLETED
   - `POST /cases` mit `procedure_code` Parameter

2. **Datenbank-Migration**:
   - Status-Enum erweitern: PREPARED, COMPLETED
   - Bestehende SUBMITTED → PREPARED migrieren

3. **Validierung**:
   - Status-Transitionen serverseitig validieren
   - Nur erlaubte Übergänge zulassen
