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

## Backend-Implementierung (2026-02-05)

### API-Endpunkte

Alle Endpunkte sind implementiert in:
- `apps/api/app/routes/cases.py`
- `apps/api/app/routes/lifecycle.py`

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/cases` | POST | Case erstellen, optional mit `procedure_code` für Auto-Binding |
| `/cases/:id/submit` | POST | Vorbereitung abschließen (→ PREPARED) |
| `/cases/:id/reopen` | POST | Fall wieder öffnen (PREPARED → IN_PROCESS) |
| `/cases/:id/complete` | POST | Als erledigt markieren (PREPARED → COMPLETED) |
| `/cases/:id/archive` | POST | Fall archivieren (COMPLETED → ARCHIVED) |

### Domain-Logik

`apps/api/app/domain/case_status.py`:

```python
# Status-Enum
class CaseStatus(str, Enum):
    DRAFT = "DRAFT"
    IN_PROCESS = "IN_PROCESS"
    PREPARED = "PREPARED"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"
    SUBMITTED = "SUBMITTED"  # Deprecated, alias for PREPARED

# Erlaubte Übergänge
ALLOWED_TRANSITIONS = {
    (DRAFT, IN_PROCESS),       # Verfahren binden
    (IN_PROCESS, PREPARED),    # Vorbereitung abschließen
    (PREPARED, COMPLETED),     # Als erledigt markieren
    (COMPLETED, ARCHIVED),     # Archivieren
    (PREPARED, IN_PROCESS),    # Reopen (Daten korrigieren)
}

# Hilfsfunktionen
can_edit_fields(status)    # True für DRAFT, IN_PROCESS
is_readonly(status)        # True für PREPARED, COMPLETED, ARCHIVED
can_submit(status)         # True für IN_PROCESS
can_reopen(status)         # True für PREPARED, SUBMITTED
can_complete(status)       # True für PREPARED, SUBMITTED
```

### Concurrency-Schutz

Alle Status-Transitionen verwenden optimistisches Locking mit `update_many` und WHERE-Bedingung:

```python
# Beispiel: Reopen
update_result = await prisma.case.update_many(
    where={
        "id": case_id,
        "status": {"in": ["PREPARED", "SUBMITTED"]},
    },
    data={"status": "IN_PROCESS"},
)

if update_result.count == 0:
    raise HTTPException(409, "CONCURRENT_MODIFICATION")
```

### Datenbank-Schema

`prisma/schema.prisma`:

```prisma
enum CaseStatus {
  DRAFT
  IN_PROCESS
  PREPARED
  COMPLETED
  ARCHIVED
  // DEPRECATED: SUBMITTED (migriert zu PREPARED)
}

model Case {
  ...
  prepared_at   DateTime?   // Zeitpunkt der Vorbereitung
  completed_at  DateTime?   // Zeitpunkt der Zollanmeldung
  submitted_at  DateTime?   // DEPRECATED, use prepared_at
  ...
}
```

### Tests

`apps/api/tests/test_case_status.py`:
- Status-Transition-Tests
- Editierbarkeits-Tests
- Permissions-Tests (can_submit, can_reopen, can_complete)
- Wizard-Access-Tests

---

## UX-Verhalten bei Fehlern & Statuswechseln

### Erfolgs-Feedback (Toast-Nachrichten)

| Aktion | Toast-Nachricht |
|--------|----------------|
| Vorbereitung abschließen (IN_PROCESS → PREPARED) | "Vorbereitung erfolgreich abgeschlossen." |
| Daten korrigieren (PREPARED → IN_PROCESS) | "Bearbeitung wieder geöffnet." |
| Als erledigt markieren (PREPARED → COMPLETED) | "Fall als erledigt markiert." |

### Fehlerbehandlung

#### 409 Concurrent Modification
Wenn der Status zwischenzeitlich geändert wurde (z.B. durch einen anderen Browser-Tab):

- **Toast-Nachricht:** "Der Status wurde zwischenzeitlich geändert. Bitte laden Sie den Fall neu."
- **Action-Button:** "Neu laden" (ruft `window.location.reload()` auf)
- **UI-Verhalten:** Button wird wieder aktiviert, kein automatischer Redirect

#### Andere Fehler

| Fehlercode | Benutzerfreundliche Nachricht |
|------------|------------------------------|
| CANNOT_REOPEN | "Dieser Fall kann nicht zur Bearbeitung geöffnet werden." |
| CANNOT_COMPLETE | "Dieser Fall kann nicht als erledigt markiert werden." |
| CASE_INVALID | "Der Fall enthält Fehler. Bitte korrigieren Sie diese." |
| NETWORK_ERROR | "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung." |
| TIMEOUT | "Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut." |
| (Fallback) | "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut." |

### Button-Verhalten

1. **Loading-State:** Button zeigt Spinner während Request
2. **Disabled:** Button ist während Loading deaktiviert (verhindert Doppelklick)
3. **Nach Erfolg:** Kurze Verzögerung (300-400ms), dann Redirect
4. **Nach Fehler:** Button wird wieder aktiviert

### Edge-Cases

| Szenario | Verhalten |
|----------|-----------|
| Status ändert sich serverseitig während Bearbeitung | Toast-Warnung + Wizard zeigt Readonly-Banner |
| Netzwerk-Timeout | Kein Statuswechsel im UI, Retry-Hinweis |
| Case lädt mit unerwartetem Status | UI aktualisiert sich sauber |

### Implementierungsdetails

**Toast-System:** `apps/web/src/app/design-system/primitives/Toast.tsx`
- Context-basiert (ToastProvider in AppShell)
- Varianten: success, error, warning, info
- Auto-dismiss nach 5s (8s bei Fehlern)
- Optional: Action-Button für Reload/Retry

**Error-Utilities:** `apps/web/src/app/lib/errors.ts`
- `getErrorMessage(code)` - Übersetzt Error-Code zu Benutzer-Nachricht
- `isConcurrentModificationError(err)` - Prüft auf 409/Concurrency
- `createReloadAction()` - Erstellt Reload-Button für Toast

---

## Offene Punkte

1. **Datenbank-Migration** (ausstehend):
   - Bestehende SUBMITTED → PREPARED migrieren
   - `prisma migrate dev` ausführen

**SQL-Migration:**
```sql
-- Migration: SUBMITTED -> PREPARED
UPDATE "Case" SET status = 'PREPARED', prepared_at = submitted_at
WHERE status = 'SUBMITTED';
```
