# Knowledge Base

> **Sprint 6C – C6**: Wiederverwendbare Wissensbasis für Wizard, Mapping und AI

---

## Übersicht

Die Knowledge Base speichert **erklärende Inhalte** zu Zollthemen. Sie dient als:

1. **Wizard-Hilfe** – Erklärtexte zu Formularfeldern
2. **Mapping-Hinweise** – Kontextinformationen bei der Zuordnung
3. **AI-Grundlage** – Strukturierte Daten für zukünftige AI-Features

**Wichtig:** Die Knowledge Base enthält **keine Business-Logik**, keine Berechnungen und trifft keine automatischen Entscheidungen. Sie erklärt nur.

---

## Datenmodell

### ProcedureType (Enum)

```prisma
enum ProcedureType {
  IZA   // Internet-Zollanmeldung (Privatpersonen)
  IPK   // Import-Paketverkehr
  IAA   // Internet-Ausfuhranmeldung
  ALL   // Gilt für alle Verfahren
}
```

### KnowledgeTopic

Gruppierung von Wissenseinträgen.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `code` | String | Eindeutiger Code (z. B. "zollwert") |
| `name` | String | Anzeigename (z. B. "Zollwert") |
| `description` | String? | Kurzbeschreibung des Themas |
| `order_index` | Int | Sortierreihenfolge |

### KnowledgeEntry

Einzelner Wissenseintrag mit Erklärung.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | UUID | Primärschlüssel |
| `title` | String | Frage/Titel (z. B. "Was ist der Zollwert?") |
| `summary` | String | Kurzzusammenfassung (1-2 Sätze) |
| `explanation` | String | Vollständige Erklärung (Markdown) |
| `applies_to` | ProcedureType | Für welches Verfahren relevant |
| `related_fields` | String[] | Verknüpfte Formularfelder |
| `version` | Int | Versionsnummer für Updates |
| `status` | ContentStatus | DRAFT oder PUBLISHED |
| `topic_id` | String? | Zugehöriges Topic |

---

## API-Endpunkte

Alle Endpunkte sind **öffentlich** (keine Authentifizierung) und **read-only**.

### GET /knowledge/topics

Liste aller Topics mit Anzahl der veröffentlichten Einträge.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "zollwert",
      "name": "Zollwert",
      "description": "Grundlagen zur Berechnung des Zollwerts",
      "order_index": 1,
      "entry_count": 2
    }
  ]
}
```

### GET /knowledge/entries

Liste aller veröffentlichten Einträge.

**Query-Parameter:**

| Parameter | Beschreibung |
|-----------|--------------|
| `procedure` | Filter nach Verfahren (IZA, IPK, IAA, ALL) |
| `topic` | Filter nach Topic-Code |
| `field` | Filter nach verknüpftem Feld |

**Beispiele:**
```
GET /knowledge/entries?procedure=IZA
GET /knowledge/entries?topic=zollwert
GET /knowledge/entries?field=versandkosten
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Was ist der Zollwert?",
      "summary": "Der Zollwert ist die Bemessungsgrundlage...",
      "applies_to": "ALL",
      "related_fields": ["warenwert", "versandkosten"],
      "version": 1,
      "topic_code": "zollwert",
      "topic_name": "Zollwert"
    }
  ]
}
```

### GET /knowledge/entries/{id}

Einzelner Eintrag mit vollständiger Erklärung.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Was ist der Zollwert?",
    "summary": "Der Zollwert ist die Bemessungsgrundlage...",
    "explanation": "## Definition\n\nDer Zollwert...",
    "applies_to": "ALL",
    "related_fields": ["warenwert", "versandkosten"],
    "version": 1,
    "topic_code": "zollwert",
    "topic_name": "Zollwert",
    "created_at": "2026-01-30T12:00:00Z",
    "updated_at": "2026-01-30T12:00:00Z"
  }
}
```

---

## Topics (Initial)

| Code | Name | Beschreibung |
|------|------|--------------|
| `zollwert` | Zollwert | Berechnung des Zollwerts |
| `warennummer` | Warennummer | Zolltarifnummer und EZT |
| `dokumente` | Dokumente | Erforderliche Unterlagen |
| `verfahren` | Verfahren | Zollverfahren und Abläufe |
| `kosten` | Kosten | Gebühren und EUSt |

---

## Einträge (Initial)

### Zollwert
1. Was ist der Zollwert?
2. Wie werden Versandkosten aufgeteilt?

### Warennummer
3. Warum ist die Warennummer wichtig?
4. Wie finde ich die richtige Warennummer?

### Dokumente
5. Welche Dokumente brauche ich?
6. Was muss auf der Rechnung stehen?

### Verfahren
7. Was ist die IZA?
8. Welche Felder sind für Privatpersonen irrelevant?

### Kosten
9. Wie wird die Einfuhrumsatzsteuer berechnet?
10. Ab welchem Wert muss ich Zoll zahlen?

---

## Integration

### Wizard

Der Wizard kann Erklärtexte zu Formularfeldern abrufen:

```typescript
// Erklärung für das Feld "versandkosten" abrufen
const entries = await fetch('/knowledge/entries?field=versandkosten');
```

### Mapping View

Die Mapping View kann Kontextinformationen anzeigen:

```typescript
// Alle Einträge für IZA-Verfahren
const entries = await fetch('/knowledge/entries?procedure=IZA');
```

### Zukünftige AI-Integration

Die strukturierten Daten können als Kontext für AI-Antworten verwendet werden:

```python
# Beispiel: RAG-ähnlicher Ansatz
entries = knowledge_api.get_entries(field="zollwert")
context = "\n".join([e.explanation for e in entries])
ai_response = llm.generate(question, context=context)
```

---

## Seed-Skript

Initiale Daten einfügen:

```bash
python -m scripts.seed_knowledge
```

---

## Erweiterung

### Neuen Eintrag hinzufügen

1. Topic zuordnen oder neues Topic erstellen
2. Eintrag mit `status: DRAFT` anlegen
3. Erklärung in Markdown schreiben
4. `related_fields` für Formularverknüpfung setzen
5. Nach Review auf `status: PUBLISHED` setzen

### Versionierung

Bei inhaltlichen Änderungen `version` erhöhen. Alte Versionen werden nicht gespeichert (kein History-Tracking).

---

## Einschränkungen

| Feature | Status |
|---------|--------|
| Automatische Entscheidungen | ✗ Nicht vorgesehen |
| Berechnungen | ✗ Nicht vorgesehen |
| AI-Integration | ○ Vorbereitet, nicht implementiert |
| Admin-UI | ○ Geplant für späteren Sprint |
| Mehrsprachigkeit | ✗ Nur Deutsch |

---

## Verwandte Dokumentation

- [CONTENT_MODEL.md](./CONTENT_MODEL.md) – Blog & FAQ Datenmodell
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) – Schreibstil und Tonalität
- [WORDING_GUIDE.md](./WORDING_GUIDE.md) – Erlaubte/verbotene Begriffe
- [API_CONTRACTS.md](./API_CONTRACTS.md) – API-Antwortformate
