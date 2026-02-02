# Case-Domänenmodell

## Überblick

Ein **Case** ist das zentrale Domänenobjekt in ZollPilot. Er repräsentiert einen Zollvorgang unabhängig vom gewählten Verfahren oder der UI-Darstellung.

Der Case ist:
- **Unabhängig vom UI** – keine screen-spezifischen Felder
- **Unabhängig vom Verfahren** – referenziert Verfahren nur über ID
- **Grundlage für Dashboard, Wizard und Abgabe**
- **Zustandsgetrieben** – explizites, nachvollziehbares Statusmodell

---

## Was ist ein Case?

| Eigenschaft | Beschreibung |
|-------------|--------------|
| **Definition** | Ein einzelner Zollvorgang (Import/Export) eines Mandanten |
| **Lebenszyklus** | Erstellen → Verfahren wählen → Bearbeiten → Einreichen → Archivieren |
| **Identität** | UUID, mandantengebunden |
| **Persistenz** | Dauerhaft in der Datenbank |

---

## Was ist KEIN Case?

| Element | Gehört nicht zum Case |
|---------|----------------------|
| **Formularfelder** | Liegen separat in `CaseField` |
| **UI-Zustand** | Wizard-Step, Scroll-Position etc. |
| **Validierungsergebnis** | Wird bei Bedarf berechnet |
| **PDF/Export** | Wird aus Snapshot generiert |
| **Rechnungsdaten** | Liegen im Billing-Modul |

---

## Datenmodell

### Case-Entität

```
Case
├── id: UUID (PK)
├── tenant_id: UUID (FK → Tenant)
├── created_by_user_id: UUID (FK → User)
├── title: String (optional, kann leer sein)
├── status: CaseStatus (DRAFT | IN_PROCESS | SUBMITTED | ARCHIVED)
├── version: Int (für Snapshot-Versionierung)
├── created_at: DateTime
├── updated_at: DateTime
├── submitted_at: DateTime? (gesetzt bei Submit)
├── archived_at: DateTime? (gesetzt bei Archivierung)
├── procedure_id: UUID? (FK → Procedure)
└── procedure_version: String? (Version des gebundenen Verfahrens)
```

### Abgrenzung zu Prozessdaten

| Entität | Zweck |
|---------|-------|
| `Case` | Metadaten, Status, Verfahrensbindung |
| `CaseField` | Formularfelder (Key-Value JSON) |
| `CaseSnapshot` | Versionierter Zustand bei Submit |
| `Procedure` | Verfahrensdefinition (IZA, IAA, IPK) |

---

## Statusmodell

### Verbindliche Status

| Status | Bedeutung | Erlaubte Aktionen |
|--------|-----------|-------------------|
| **DRAFT** | Fall angelegt, kein Verfahren gestartet | Verfahren binden |
| **IN_PROCESS** | Verfahren gewählt, Bearbeitung läuft | Felder bearbeiten, Validieren, Submit |
| **SUBMITTED** | Anmeldung abgegeben | Snapshot ansehen, Archivieren |
| **ARCHIVED** | Fall abgeschlossen / abgelegt | Nur lesen |

### Statusübergänge

```
┌─────────┐     bind_procedure     ┌────────────┐      submit       ┌───────────┐     archive      ┌──────────┐
│  DRAFT  │ ───────────────────► │ IN_PROCESS │ ───────────────► │ SUBMITTED │ ───────────────► │ ARCHIVED │
└─────────┘                       └────────────┘                   └───────────┘                  └──────────┘
```

**Regeln:**
- Keine Rücksprünge (z.B. SUBMITTED → IN_PROCESS ist verboten)
- Kein Überspringen (z.B. DRAFT → SUBMITTED ist verboten)
- Jeder Übergang ist serverseitig validiert

### Übergangs-Trigger

| Übergang | Trigger | API-Endpoint |
|----------|---------|--------------|
| DRAFT → IN_PROCESS | Verfahren wird gebunden | `POST /cases/{id}/procedure` |
| IN_PROCESS → SUBMITTED | Case wird eingereicht | `POST /cases/{id}/submit` |
| SUBMITTED → ARCHIVED | Case wird archiviert | `POST /cases/{id}/archive` |

---

## API-Contracts

### Case-Endpunkte

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/cases` | GET | Liste aller Cases des Mandanten |
| `/cases` | POST | Neuen Case erstellen (Status: DRAFT) |
| `/cases/{id}` | GET | Case-Details inkl. Felder und Verfahren |
| `/cases/{id}` | PATCH | Case-Titel ändern |
| `/cases/{id}/status` | PATCH | Expliziter Statuswechsel |
| `/cases/{id}/archive` | POST | Case archivieren |
| `/cases/{id}/submit` | POST | Case einreichen (mit Validierung) |

### Beispiel-Responses

#### GET /cases (Listenansicht)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Import Elektronik China",
      "status": "IN_PROCESS",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T14:45:00Z"
    }
  ]
}
```

#### GET /cases/{id} (Detailansicht)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Import Elektronik China",
    "status": "IN_PROCESS",
    "version": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z",
    "submitted_at": null,
    "archived_at": null,
    "procedure": {
      "code": "IZA",
      "name": "Internet-Zollanmeldung"
    },
    "fields": [
      {
        "key": "sender_country",
        "value": "CN",
        "updated_at": "2024-01-15T14:45:00Z"
      }
    ]
  }
}
```

#### PATCH /cases/{id}/status

**Request:**
```json
{
  "status": "ARCHIVED"
}
```

**Response (Erfolg):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Import Elektronik China",
    "status": "ARCHIVED",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T09:00:00Z"
  }
}
```

**Response (Fehler - ungültiger Übergang):**
```json
{
  "error": {
    "code": "STATUS_ROLLBACK_NOT_ALLOWED",
    "message": "Cannot transition from SUBMITTED back to IN_PROCESS. Status rollbacks are not allowed."
  }
}
```

---

## Abgrenzung zu Wizard-/Prozessdaten

### Was der Case NICHT enthält

| Element | Speicherort | Grund |
|---------|-------------|-------|
| Aktiver Wizard-Step | Frontend-State / URL | UI-spezifisch |
| Validierungsfehler | Wird bei Bedarf berechnet | Ephemer |
| Formularfeld-Werte | `CaseField` Tabelle | Separate Entität |
| Verfahrensschritte | `ProcedureStep` Tabelle | Verfahrensdefinition |
| Eingereichte Version | `CaseSnapshot` Tabelle | Versionierung |

### Datenfluss

```
User Input
    │
    ▼
┌─────────────┐
│  CaseField  │  ← Formularfelder (Key-Value)
└─────────────┘
    │
    ▼
┌─────────────┐
│    Case     │  ← Metadaten, Status
└─────────────┘
    │ submit
    ▼
┌─────────────┐
│ CaseSnapshot│  ← Versionierter Zustand
└─────────────┘
    │ export
    ▼
┌─────────────┐
│    PDF      │  ← Generiertes Dokument
└─────────────┘
```

---

## Migration bestehender Daten

### Annahmen

1. **DRAFT mit Verfahren → IN_PROCESS**
   - Fälle mit `status = 'DRAFT'` UND `procedure_id IS NOT NULL` werden zu `IN_PROCESS`
   - Begründung: Ein gebundenes Verfahren bedeutet aktive Bearbeitung

2. **DRAFT ohne Verfahren → bleibt DRAFT**
   - Fälle ohne Verfahrensbindung bleiben unverändert

3. **SUBMITTED und ARCHIVED → unverändert**
   - Bereits eingereichte/archivierte Fälle werden nicht geändert

### Migrationsskript

Siehe: `prisma/migrations/manual/20240115_add_in_process_status.sql`

---

## Validierungsregeln

### Status-Berechtigungen

| Aktion | DRAFT | IN_PROCESS | SUBMITTED | ARCHIVED |
|--------|-------|------------|-----------|----------|
| Felder bearbeiten | ✓ | ✓ | ✗ | ✗ |
| Verfahren binden | ✓ | ✓* | ✗ | ✗ |
| Validieren | ✗ | ✓ | ✗ | ✗ |
| Einreichen | ✗ | ✓ | ✗ | ✗ |
| Archivieren | ✗ | ✗ | ✓ | ✗ |

*Re-Binding zu anderem Verfahren in IN_PROCESS erlaubt

### Fehler-Codes

| Code | HTTP-Status | Bedeutung |
|------|-------------|-----------|
| `STATUS_ROLLBACK_NOT_ALLOWED` | 409 | Rücksprung versucht |
| `STATUS_SKIP_NOT_ALLOWED` | 409 | Überspringen versucht |
| `CASE_NOT_EDITABLE` | 409 | Felder in falschem Status bearbeitet |
| `CASE_NOT_IN_PROCESS` | 409 | Submit von DRAFT versucht |
| `CASE_ARCHIVED` | 409 | Aktion auf archivierten Case |
| `NO_PROCEDURE_BOUND` | 400 | Submit ohne Verfahren |

---

## Zielgruppen

- **Backend-Entwickler:** API-Contracts, Statuslogik, Validierung
- **Frontend-Entwickler:** Types, Statusübergänge, UI-Anpassungen
- **Produktverantwortliche:** Fachliche Korrektheit, Prozessabbildung
- **QA:** Testfälle für alle Statusübergänge
