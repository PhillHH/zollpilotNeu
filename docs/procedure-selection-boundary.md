# Verfahrensauswahl als Systemgrenze

## Überblick

Die Auswahl eines Verfahrens (IZA, IAA, IPK) ist ein **explizites Domänenereignis** und markiert eine **klare Systemgrenze** in ZollPilot.

Ab dem Moment der Verfahrensbindung gilt:
- Der Case ist verbindlich `IN_PROCESS`
- Das Verfahren ist fest gebunden
- Der Wizard darf starten
- Formularfelder können bearbeitet werden

---

## Warum ist die Verfahrensauswahl eine Systemgrenze?

| Aspekt | Begründung |
|--------|------------|
| **Fachlich** | Ein Zollvorgang beginnt erst mit der Wahl des Verfahrens (IZA, IAA, IPK) |
| **Prozessual** | Der Wizard/Formularprozess macht ohne Verfahren keinen Sinn |
| **Validierung** | Pflichtfelder und Regeln hängen vom Verfahren ab |
| **Nachvollziehbarkeit** | Klarer Zeitpunkt für "Bearbeitung begonnen" |

---

## Erlaubte und verbotene Zustände

### Zustandsmatrix

| Status | procedure | Wizard-Zugriff | Feld-Bearbeitung | Beschreibung |
|--------|-----------|----------------|------------------|--------------|
| DRAFT | null | ❌ | ⚠️ * | Kein Verfahren gewählt |
| DRAFT | IZA/IAA/IPK | ❌ ** | ⚠️ * | Ungültig (Invariante verletzt) |
| IN_PROCESS | null | ❌ ** | ❌ | Ungültig (Invariante verletzt) |
| IN_PROCESS | IZA/IAA/IPK | ✅ | ✅ | Normaler Bearbeitungszustand |
| SUBMITTED | IZA/IAA/IPK | ❌ | ❌ | Nur lesend |
| ARCHIVED | IZA/IAA/IPK | ❌ | ❌ | Nur lesend |

\* Technisch möglich, aber UI sollte den Wizard erst nach Verfahrenswahl anzeigen
\** Datenintegritätsproblem - sollte nie auftreten

### Invarianten

```
1. status == IN_PROCESS  →  procedure != null
2. status == DRAFT       →  procedure == null (empfohlen)
3. status == SUBMITTED   →  procedure != null (garantiert)
```

---

## API-Contract: Verfahrensbindung

### Endpoint

```
POST /cases/{case_id}/procedure
```

### Request

```json
{
  "procedure_code": "IZA"
}
```

Gültige Werte: `IZA`, `IAA`, `IPK`

### Response (Erfolg)

```json
{
  "data": {
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "procedure_code": "IZA",
    "procedure_version": "v1",
    "status": "IN_PROCESS",
    "is_rebind": false
  }
}
```

### Response (Re-Binding)

```json
{
  "data": {
    "case_id": "550e8400-e29b-41d4-a716-446655440000",
    "procedure_code": "IAA",
    "procedure_version": "v1",
    "status": "IN_PROCESS",
    "is_rebind": true
  }
}
```

### Fehlerfälle

| Code | HTTP | Beschreibung |
|------|------|--------------|
| `INVALID_PROCEDURE_CODE` | 400 | Ungültiger Verfahrenscode |
| `PROCEDURE_NOT_FOUND` | 400 | Verfahren nicht gefunden/inaktiv |
| `CASE_NOT_EDITABLE` | 409 | Status nicht DRAFT oder IN_PROCESS |
| `CASE_ALREADY_SUBMITTED` | 409 | Case bereits eingereicht |
| `CASE_ARCHIVED` | 409 | Case archiviert |

---

## API-Contract: Wizard-Zugriffsprüfung

### Endpoint

```
GET /cases/{case_id}/wizard-access
```

### Response (Zugriff erlaubt)

```json
{
  "allowed": true,
  "error_code": null,
  "error_message": null
}
```

### Response (Zugriff verweigert)

```json
{
  "allowed": false,
  "error_code": "NO_PROCEDURE_SELECTED",
  "error_message": "Cannot access wizard. Select a procedure first to start the process."
}
```

### Mögliche Error-Codes

| Code | Beschreibung |
|------|--------------|
| `NO_PROCEDURE_SELECTED` | Case ist noch DRAFT, kein Verfahren gewählt |
| `CASE_NOT_EDITABLE` | Case ist SUBMITTED oder ARCHIVED |
| `INVARIANT_VIOLATION` | IN_PROCESS aber kein Verfahren (Datenintegritätsproblem) |

---

## Re-Binding-Regel

### Wann ist Re-Binding erlaubt?

| Von Status | Nach Verfahren | Erlaubt | Bemerkung |
|------------|---------------|---------|-----------|
| DRAFT | Erstes Verfahren | ✅ | Normale erste Bindung |
| IN_PROCESS | Anderes Verfahren | ✅ | Re-Binding |
| IN_PROCESS | Gleiches Verfahren | ✅ | Idempotent (No-Op) |
| SUBMITTED | Beliebig | ❌ | Nicht änderbar |
| ARCHIVED | Beliebig | ❌ | Nicht änderbar |

### Verhalten bei Re-Binding

**Entscheidung:** Bei Re-Binding zu einem anderen Verfahren werden bestehende CaseFields **NICHT gelöscht**.

**Begründung:**
1. Viele Felder sind verfahrensübergreifend nutzbar (sender, recipient, value, etc.)
2. Datenverlust-Vermeidung (konservative Entscheidung)
3. Benutzer kann Felder manuell anpassen/löschen

**Risiken:**
- Alte Felddaten könnten für neues Verfahren irrelevant sein
- Validierung kann fehlschlagen wenn Feldstruktur inkompatibel

**Empfehlung:**
- UI sollte bei Re-Binding eine Warnung anzeigen
- Validierung vor Submit zeigt inkompatible Felder

---

## Validierungslogik

### Serverseitige Guards

```python
# In app/domain/case_status.py

def can_access_wizard(status: str, procedure_id: str | None) -> WizardAccessResult:
    """
    Prüft ob der Wizard für diesen Case betreten werden darf.

    Regeln:
    - DRAFT: Kein Zugriff (erst Verfahren wählen)
    - IN_PROCESS mit procedure: Zugriff erlaubt
    - IN_PROCESS ohne procedure: Invariante verletzt
    - SUBMITTED/ARCHIVED: Kein Zugriff (nur lesend)
    """
```

### Verwendung in API-Endpoints

```python
# Beispiel: Vor dem Starten des Wizard-Prozesses
result = can_access_wizard(case.status, case.procedure_id)
if not result.allowed:
    raise HTTPException(
        status_code=409,
        detail={"code": result.error_code, "message": result.error_message}
    )
```

---

## Prozessfluss

```
┌──────────────────────────────────────────────────────────────────┐
│                        DRAFT                                      │
│  - Case erstellt                                                  │
│  - Kein Verfahren gebunden                                        │
│  - Wizard NICHT zugänglich                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ POST /cases/{id}/procedure
                         │ { "procedure_code": "IZA" }
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                      IN_PROCESS                                   │
│  ═══════════════════════════════════════════════════════════════ │
│  ║              SYSTEMGRENZE ÜBERSCHRITTEN                     ║ │
│  ═══════════════════════════════════════════════════════════════ │
│  - Verfahren ist gebunden (IZA/IAA/IPK)                          │
│  - Wizard ist zugänglich                                          │
│  - Felder können bearbeitet werden                                │
│  - Re-Binding zu anderem Verfahren möglich                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ POST /cases/{id}/submit
                         │ (nach erfolgreicher Validierung)
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SUBMITTED                                   │
│  - Snapshot erstellt                                              │
│  - Verfahren fixiert (kein Re-Binding)                            │
│  - Felder nicht mehr editierbar                                   │
│  - Wizard nur lesend                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Frontend-Integration

### Empfohlener Ablauf

1. **Case erstellen** → Status: DRAFT
2. **Verfahrensauswahl anzeigen** (IZA, IAA, IPK)
3. **Verfahren binden** via `POST /cases/{id}/procedure`
4. **Wizard-Zugriff prüfen** via `GET /cases/{id}/wizard-access`
5. **Wizard starten** (nur wenn `allowed: true`)

### Code-Beispiel (TypeScript)

```typescript
// Verfahren binden
const bindResult = await procedures.bind(caseId, "IZA");
console.log(`Status: ${bindResult.data.status}`); // "IN_PROCESS"

// Wizard-Zugriff prüfen
const accessResult = await cases.checkWizardAccess(caseId);
if (accessResult.data.allowed) {
  // Wizard starten
  router.push(`/cases/${caseId}/wizard`);
} else {
  // Fehler anzeigen
  showError(accessResult.data.error_message);
}
```

---

## Zielgruppen

- **Backend-Entwickler:** API-Contracts, Guards, Validierung
- **Frontend-Entwickler:** Wizard-Integration, Zustandshandling
- **Produktverantwortliche:** Prozessfluss, Re-Binding-Regeln
- **QA:** Testfälle für alle Zustandskombinationen
