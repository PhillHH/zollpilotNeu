# Abgabe (Submit) als Systemereignis

## Überblick

Die **Abgabe** (Submit) einer Anmeldung ist ein **explizites, irreversibles Domänenereignis** in ZollPilot.

**Wichtig:** ZollPilot übermittelt NICHT an den Zoll. Die Abgabe markiert ausschließlich die **interne Vorbereitung als abgeschlossen**.

---

## Was bedeutet "Abgabe" in ZollPilot?

| Aspekt | Beschreibung |
|--------|--------------|
| **Fachlich** | Der Benutzer bestätigt, dass alle Daten korrekt und vollständig sind |
| **Technisch** | Case-Status wechselt auf SUBMITTED, Wizard wird read-only |
| **Rechtlich** | Keine automatische Übermittlung an Zollbehörden |
| **Irreversibel** | Nach Submit kann der Case nicht mehr bearbeitet werden |

---

## Was passiert technisch?

### Atomare Operationen bei Submit

1. **Validierung**
   - `case.status == IN_PROCESS`
   - `wizard.is_completed == true`
   - Alle Pflichtfelder ausgefüllt

2. **Statusänderung**
   - `case.status` → `SUBMITTED`
   - `case.submitted_at` → aktueller Zeitstempel

3. **Wizard-Abschluss**
   - `wizard.is_completed` → `true`

4. **Snapshot-Erstellung**
   - Alle Felddaten werden als Snapshot gespeichert
   - Versioniert und unveränderlich

### Reihenfolge

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUBMIT-PROZESS                                 │
├──────────────────────────────────────────────────────────────────┤
│ 1. Validierung: Status, Wizard, Pflichtfelder                    │
│ 2. Snapshot erstellen (Felddaten einfrieren)                     │
│ 3. Case-Status auf SUBMITTED setzen                              │
│ 4. submitted_at Zeitstempel setzen                               │
│ 5. Wizard als abgeschlossen markieren                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Was passiert NICHT?

| Aktion | Status |
|--------|--------|
| Übermittlung an Zollbehörden | ❌ Nicht implementiert |
| Automatisches Archivieren | ❌ Nicht bei Submit |
| Weiterleitung an externe Systeme | ❌ Nicht implementiert |
| E-Mail-Benachrichtigung | ❌ Nicht bei Submit |
| Gebührenberechnung | ❌ Nicht Bestandteil |

**ZollPilot ist ein Vorbereitungstool**, nicht ein Übermittlungstool.

---

## Warum ist Submit irreversibel?

| Grund | Erklärung |
|-------|-----------|
| **Datenintegrität** | Snapshot enthält exakten Stand zum Zeitpunkt der Abgabe |
| **Nachvollziehbarkeit** | Audit-Trail: Wann wurde was abgegeben? |
| **Fachliche Korrektheit** | Einmal "abgegeben" bedeutet "fertig" |
| **Prozesssicherheit** | Verhindert versehentliche Änderungen |

### Alternativen bei Fehlern

Falls nach Submit ein Fehler entdeckt wird:

1. **Neuen Case anlegen** mit korrigierten Daten
2. **Alten Case archivieren** mit Notiz zum Fehler

---

## API-Contract

### POST /cases/{id}/submit

**Request:** Keine Body-Parameter erforderlich

**Response (Erfolg):**

```json
{
  "data": {
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "SUBMITTED",
    "procedure_code": "IZA",
    "submitted_at": "2026-02-02T15:41:00Z",
    "version": 1,
    "snapshot_id": "..."
  }
}
```

### Fehlerfälle

| Code | HTTP | Beschreibung |
|------|------|--------------|
| `WIZARD_NOT_COMPLETED` | 409 | Nicht alle Wizard-Steps abgeschlossen |
| `WIZARD_NOT_INITIALIZED` | 409 | Wizard wurde nie gestartet |
| `CASE_NOT_IN_PROCESS` | 409 | Case ist noch DRAFT |
| `CASE_ARCHIVED` | 409 | Case bereits archiviert |
| `CASE_INVALID` | 409 | Pflichtfelder fehlen |
| `NO_PROCEDURE_BOUND` | 400 | Kein Verfahren gebunden |
| `CASE_NOT_FOUND` | 404 | Case existiert nicht |

---

## Voraussetzungen für Submit

### 1. Case-Status

```
case.status == IN_PROCESS
```

Der Case muss im Status IN_PROCESS sein. Nur dieser Status erlaubt Bearbeitung und Submit.

### 2. Wizard-Abschluss

```
wizard.is_completed == true
```

Alle Wizard-Steps müssen abgeschlossen sein. Der Benutzer muss den Review-Step durchlaufen haben.

### 3. Pflichtfelder

Alle Pflichtfelder des gebundenen Verfahrens müssen ausgefüllt sein.

---

## Nach Submit

### Wizard ist read-only

Nach erfolgreichem Submit sind folgende Operationen **blockiert**:

| Endpoint | Status |
|----------|--------|
| `POST /wizard/navigate` | ❌ Blockiert (`CASE_SUBMITTED`) |
| `POST /wizard/complete-step` | ❌ Blockiert (`CASE_SUBMITTED`) |
| `POST /wizard/reset` | ❌ Blockiert (`CASE_SUBMITTED`) |
| `POST /wizard/complete` | ❌ Blockiert (`CASE_SUBMITTED`) |
| `GET /wizard` | ✅ Erlaubt (read-only) |
| `GET /wizard/steps` | ✅ Erlaubt (read-only) |

### Dashboard-Auswirkungen

SUBMITTED Cases werden korrekt gezählt:

- Erscheinen in `case_counts.submitted`
- Erscheinen NICHT in `case_counts.in_process`
- `submitted_at` wird für tägliche Aktivität (`daily_activity.cases_submitted`) verwendet

---

## Wizard-Abschluss (Vorbereitung für Submit)

### POST /cases/{id}/wizard/complete

Markiert den Wizard als vollständig abgeschlossen, bevor Submit aufgerufen wird.

**Voraussetzungen:**
- Alle Steps (außer review) müssen abgeschlossen sein
- Case muss IN_PROCESS sein

**Response (Erfolg):**

```json
{
  "data": {
    "valid": true
  }
}
```

**Response (Fehler):**

```json
{
  "data": {
    "valid": false,
    "error_message": "Complete all steps before finishing. Missing: sender, value"
  }
}
```

---

## Prozessfluss

```
┌──────────────────────────────────────────────────────────────────┐
│                      IN_PROCESS                                   │
│  - Wizard-Steps durcharbeiten                                     │
│  - Alle Pflichtfelder ausfüllen                                   │
│  - Review-Step durchlaufen                                        │
│  - POST /wizard/complete aufrufen                                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ POST /cases/{id}/submit
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SUBMITTED                                   │
│  ═══════════════════════════════════════════════════════════════ │
│  ║                 IRREVERSIBEL                                ║ │
│  ═══════════════════════════════════════════════════════════════ │
│  - Case ist abgeschlossen                                         │
│  - Wizard ist read-only                                           │
│  - Snapshot wurde erstellt                                        │
│  - submitted_at wurde gesetzt                                     │
│  - Keine Bearbeitung mehr möglich                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend-Integration

### Empfohlener Ablauf

```typescript
// 1. Wizard abschließen (nach Review-Step)
const completeResult = await wizard.complete(caseId);
if (!completeResult.data.valid) {
  showError(completeResult.data.error_message);
  return;
}

// 2. Case submitten
try {
  const submitResult = await cases.submit(caseId);
  console.log(`Submitted at: ${submitResult.data.submitted_at}`);
  // Weiterleitung zur Erfolgsseite
  router.push(`/cases/${caseId}/success`);
} catch (error) {
  if (error.code === 'WIZARD_NOT_COMPLETED') {
    showError('Bitte alle Schritte abschließen.');
  } else if (error.code === 'CASE_INVALID') {
    showValidationErrors(error.details.errors);
  } else {
    showError(error.message);
  }
}
```

### Submit-Button Logik

```typescript
// Submit-Button nur aktivieren wenn:
// 1. wizard.is_completed === true
// 2. case.status === 'IN_PROCESS'

submitButton.disabled = !wizard.is_completed || case.status !== 'IN_PROCESS';
```

---

## Zielgruppen

- **Backend-Entwickler:** API-Contracts, Validierung, Atomarität
- **Frontend-Entwickler:** Submit-Flow, Fehlerbehandlung, Button-States
- **Produktverantwortliche:** Submit-Prozess, Irreversibilität
- **QA:** Submit-Testfälle, Fehlerfälle, Edge-Cases
