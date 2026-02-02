# Wizard-System

## Überblick

ZollPilot verwendet ein **einheitliches Wizard-System** für alle Verfahren (IZA, IAA, IPK). Es gibt keinen separaten Wizard pro Verfahren - alle nutzen denselben Mechanismus.

Der Wizard ist:
- **Prozessgebunden** – nicht ein freies Formular
- **Statusgetrieben** – nur zugänglich bei IN_PROCESS
- **Serverseitig persistiert** – kein LocalStorage als Quelle der Wahrheit
- **Abbruch- und fortsetzbar** – Fortschritt bleibt erhalten

---

## Was ist der Wizard?

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Definition** | Geführter, linearer Bearbeitungsprozess für einen Case |
| **Zweck** | Schrittweise Erfassung der Anmeldungsdaten |
| **Bindung** | Strikt an Case-Status und Verfahren gebunden |
| **Persistenz** | Fortschritt wird serverseitig in WizardProgress gespeichert |

---

## Was ist KEIN Wizard?

| Element | Gehört nicht zum Wizard |
|---------|------------------------|
| **Freies Formular** | Beliebiges Springen zwischen Feldern |
| **Case-Status** | Liegt im Case-Modell, nicht im Wizard |
| **Feld-Validierung** | Liegt in der Procedure-Definition |
| **Submit-Logik** | Liegt in der Lifecycle-API |
| **UI-Komponenten** | Der Wizard definiert nur Daten/Zustand |

---

## Datenmodell

### WizardProgress-Entität

```
WizardProgress
├── id: UUID (PK)
├── case_id: UUID (FK → Case, 1:1 Relation)
├── procedure_code: String (IZA, IAA, IPK)
├── current_step: String (aktueller Step-Key)
├── completed_steps: JSON (Array von Step-Keys)
├── is_completed: Boolean
├── created_at: DateTime
└── updated_at: DateTime
```

### Beziehung zu Case

```
Case (1) ←────→ (0..1) WizardProgress
```

- Pro Case maximal ein WizardProgress
- WizardProgress wird bei erstem Wizard-Zugriff erstellt
- Wird bei Case-Löschung kaskadiert gelöscht

---

## Trennung: Case vs. Wizard vs. Felddaten

| Entität | Verantwortung | Beispiel |
|---------|---------------|----------|
| **Case** | Metadaten, Status, Verfahrensbindung | status=IN_PROCESS, procedure=IZA |
| **WizardProgress** | Navigationsfortschritt | current_step="sender", completed_steps=["package"] |
| **CaseField** | Formularfeld-Werte | sender_name="Max Mustermann" |
| **Procedure** | Verfahrensstruktur, Validierungsregeln | Steps, Pflichtfelder |

### Datenfluss

```
Benutzer gibt Daten ein
         │
         ▼
┌─────────────────┐
│   CaseField     │  ← Feld-Werte (key-value)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ WizardProgress  │  ← Navigations-Zustand
└─────────────────┘
         │
         ▼
┌─────────────────┐
│      Case       │  ← Status, Verfahren
└─────────────────┘
```

---

## Warum gibt es nur einen Wizard?

| Grund | Erklärung |
|-------|-----------|
| **Konsistenz** | Einheitliche UX für alle Verfahren |
| **Wartbarkeit** | Eine Code-Basis statt drei |
| **Erweiterbarkeit** | Neue Verfahren nur als Konfiguration |
| **Korrektheit** | Guards und Validierung an einem Ort |

### Verfahren liefern nur Konfiguration

```python
# In wizard_steps.py
IZA_STEPS = ProcedureSteps(
    procedure_code="IZA",
    steps=[
        StepDefinition(step_key="package", title="Sendung", ...),
        StepDefinition(step_key="sender", title="Absender", ...),
        # ... weitere Steps
    ]
)
```

Keine UI-Komponenten, keine eigene Logik pro Verfahren.

---

## Step-Definitionen pro Verfahren

### IZA (Internet-Zollanmeldung)

| # | Step | Title | Pflichtfelder |
|---|------|-------|---------------|
| 1 | package | Sendung | goods_description, quantity |
| 2 | sender | Absender | sender_name, sender_country |
| 3 | recipient | Empfänger | recipient_name, recipient_country |
| 4 | value | Wert | value_amount, value_currency |
| 5 | additional | Zusatzangaben | (keine) |
| 6 | review | Prüfen | (keine) |

### IAA (Internet-Ausfuhranmeldung)

| # | Step | Title | Pflichtfelder |
|---|------|-------|---------------|
| 1 | goods | Waren | goods_description, quantity, weight_kg |
| 2 | sender | Versender | sender_name, sender_country |
| 3 | recipient | Empfänger | recipient_name, recipient_country |
| 4 | value | Wert | value_amount, value_currency, export_type |
| 5 | review | Prüfen | (keine) |

### IPK (Import-Paketverkehr)

| # | Step | Title | Pflichtfelder |
|---|------|-------|---------------|
| 1 | package | Paket | goods_description, quantity, weight_kg |
| 2 | sender | Absender | sender_name, sender_country |
| 3 | recipient | Empfänger | recipient_name, recipient_country |
| 4 | value | Wert | value_amount, value_currency, origin_country |
| 5 | review | Prüfen | (keine) |

---

## API-Contracts

### GET /cases/{id}/wizard

Holt den aktuellen Wizard-Zustand. Erstellt automatisch einen WizardProgress wenn keiner existiert.

**Response:**
```json
{
  "data": {
    "case_id": "...",
    "procedure_code": "IZA",
    "current_step": "sender",
    "completed_steps": ["package"],
    "is_completed": false,
    "total_steps": 6,
    "current_step_index": 1,
    "can_go_back": true,
    "can_go_forward": false,
    "can_submit": false,
    "steps": [
      {
        "step_key": "package",
        "title": "Sendung",
        "description": "Angaben zur Sendung",
        "required_fields": ["goods_description", "quantity"],
        "is_completed": true,
        "is_current": false,
        "is_accessible": true
      },
      {
        "step_key": "sender",
        "title": "Absender",
        "description": "Angaben zum Absender",
        "required_fields": ["sender_name", "sender_country"],
        "is_completed": false,
        "is_current": true,
        "is_accessible": true
      }
    ]
  }
}
```

### POST /cases/{id}/wizard/navigate

Navigiert zu einem Step.

**Request:**
```json
{ "target_step": "recipient" }
```

**Response (Erfolg):**
```json
{
  "data": {
    "success": true,
    "current_step": "recipient"
  }
}
```

**Response (Fehler):**
```json
{
  "data": {
    "success": false,
    "current_step": "sender",
    "error_code": "CURRENT_STEP_NOT_COMPLETED",
    "error_message": "Complete current step 'sender' before proceeding."
  }
}
```

### POST /cases/{id}/wizard/complete-step

Markiert einen Step als abgeschlossen.

**Request:**
```json
{ "step_key": "sender" }
```

**Response (Erfolg):**
```json
{
  "data": {
    "valid": true
  }
}
```

**Response (Felder fehlen):**
```json
{
  "data": {
    "valid": false,
    "missing_fields": ["sender_name", "sender_country"],
    "error_message": "Missing required fields: sender_name, sender_country"
  }
}
```

### POST /cases/{id}/wizard/reset

Setzt den Wizard-Fortschritt zurück.

**Response:** Wie GET /cases/{id}/wizard (mit erstem Step als current_step)

---

## Navigation

### Erlaubte Navigationen

| Von | Nach | Erlaubt | Bedingung |
|-----|------|---------|-----------|
| Aktueller Step | Gleicher Step | ✅ | Immer (Neulade) |
| Aktueller Step | Vorheriger Step | ✅ | Immer |
| Aktueller Step | Nächster Step | ✅ | Wenn aktueller Step abgeschlossen |
| Beliebig | Abgeschlossener Step | ✅ | Immer |
| Beliebig | Überspringender Step | ❌ | Nie |
| Beliebig | Review | ✅ | Wenn alle vorherigen Steps abgeschlossen |

### Verbotene Navigationen

| Aktion | Error-Code | Beschreibung |
|--------|------------|--------------|
| Überspringen | STEP_NOT_COMPLETED | Nicht-abgeschlossenen Step übersprungen |
| Vorwärts ohne Abschluss | CURRENT_STEP_NOT_COMPLETED | Aktueller Step nicht abgeschlossen |
| Review ohne vollständige Steps | INCOMPLETE_STEPS | Nicht alle Steps vor Review abgeschlossen |

---

## Zugriffs-Guards

### Wizard-Zugriff

Der Wizard ist **nur zugänglich** wenn:

1. `case.status == IN_PROCESS`
2. `case.procedure != null`
3. Step-Konfiguration für Verfahren existiert

### Serverseitige Prüfungen

Jeder Wizard-Endpoint prüft:

1. **Case existiert** → 404 wenn nicht
2. **Mandanten-Zugehörigkeit** → 403 wenn nicht
3. **Wizard-Zugang** → 403 wenn nicht IN_PROCESS
4. **Step-Validität** → 400 wenn ungültiger Step

---

## Persistenz

### Was wird gespeichert?

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| current_step | Aktuell angezeigerter Step | "sender" |
| completed_steps | Als abgeschlossen markierte Steps | ["package"] |
| is_completed | Wizard vollständig abgeschlossen | false |

### Was wird NICHT gespeichert?

- UI-Zustand (Scroll-Position, offene Dialoge)
- Temporäre Eingaben (nicht gespeicherte Felder)
- Validierungsergebnisse (werden berechnet)

### Persistenz-Szenarien

| Aktion | Verhalten |
|--------|-----------|
| Browser-Reload | Zustand bleibt erhalten |
| Logout/Login | Zustand bleibt erhalten |
| Tab wechseln | Zustand bleibt erhalten |
| Wizard verlassen | Zustand bleibt erhalten |
| Case-Status wechselt zu SUBMITTED | Wizard wird read-only |

---

## Abbruch und Fortsetzung

### Wizard verlassen

- Jederzeit möglich
- Case-Status bleibt `IN_PROCESS`
- Fortschritt (completed_steps) bleibt erhalten
- CaseFields bleiben erhalten

### Wizard fortsetzen

- GET /wizard lädt den gespeicherten Zustand
- current_step zeigt zuletzt bearbeiteten Step
- Benutzer kann direkt weitermachen

### Wizard zurücksetzen

- POST /wizard/reset setzt Fortschritt zurück
- current_step wird auf ersten Step gesetzt
- completed_steps wird geleert
- CaseFields bleiben erhalten

---

## Frontend-Integration

### Empfohlener Ablauf

```typescript
// 1. Wizard-Zustand laden
const state = await wizard.getState(caseId);

// 2. UI basierend auf state rendern
renderStep(state.current_step);
renderSidebar(state.steps);

// 3. Bei Feld-Änderung: CaseField speichern
await fields.upsert(caseId, "sender_name", "Max Mustermann");

// 4. Step abschließen
const validation = await wizard.completeStep(caseId, "sender");
if (!validation.data.valid) {
  showErrors(validation.data.missing_fields);
  return;
}

// 5. Zum nächsten Step navigieren
const nav = await wizard.navigate(caseId, "recipient");
if (nav.data.success) {
  renderStep(nav.data.current_step);
}
```

### State-Nutzung

```typescript
// Aktuellen Step anzeigen
const currentStep = state.steps.find(s => s.is_current);

// Sidebar rendern
state.steps.forEach(step => {
  renderSidebarItem({
    ...step,
    disabled: !step.is_accessible,
    checkmark: step.is_completed,
  });
});

// Navigation Buttons
backButton.disabled = !state.can_go_back;
nextButton.disabled = !state.can_go_forward;
submitButton.disabled = !state.can_submit;
```

---

## Zielgruppen

- **Backend-Entwickler:** API-Contracts, Domain-Logik, Guards
- **Frontend-Entwickler:** State-Integration, Navigation, UI-Mapping
- **Produktverantwortliche:** Step-Definitionen, Pflichtfelder, UX-Flow
- **QA:** Navigations-Testfälle, Edge-Cases
