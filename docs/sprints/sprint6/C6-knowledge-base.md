# Sprint 6C – C6: Knowledge Base Foundation

> **Status**: Abgeschlossen
> **Datum**: 2026-01-30

---

## Ziel

Aufbau einer **wiederverwendbaren Wissensbasis**, die:
- Wizard & Mapping erklärt
- später AI speist
- ohne Business-Logik auskommt

---

## Scope

### A) Datenmodell (Prisma)
- [x] `ProcedureType` Enum (IZA, IPK, IAA, ALL)
- [x] `KnowledgeTopic` Model
- [x] `KnowledgeEntry` Model

### B) Backend (FastAPI)
- [x] `GET /knowledge/topics`
- [x] `GET /knowledge/entries` mit Filtern
- [x] `GET /knowledge/entries/{id}`
- [x] Nur PUBLISHED ausliefern

### C) Frontend
- [x] Keine eigene UI (nur Integration-Hooks)
- [x] API kann von Wizard/Mapping verwendet werden

### D) Initiale Inhalte
- [x] 5 Topics erstellt
- [x] 10 Einträge erstellt

### E) Tests
- [x] Filter nach Verfahren
- [x] Filter nach Topic
- [x] Filter nach Feld
- [x] Status-Filter (PUBLISHED only)

### F) Dokumentation
- [x] docs/KNOWLEDGE_BASE.md
- [x] docs/ARCHITECTURE.md (Knowledge Layer)

---

## Created Models

### ProcedureType (Enum)

```prisma
enum ProcedureType {
  IZA   // Internet-Zollanmeldung
  IPK   // Import-Paketverkehr
  IAA   // Internet-Ausfuhranmeldung
  ALL   // Alle Verfahren
}
```

### KnowledgeTopic

| Feld | Typ |
|------|-----|
| `id` | UUID |
| `code` | String (unique) |
| `name` | String |
| `description` | String? |
| `order_index` | Int |

### KnowledgeEntry

| Feld | Typ |
|------|-----|
| `id` | UUID |
| `title` | String |
| `summary` | String |
| `explanation` | String (Markdown) |
| `applies_to` | ProcedureType |
| `related_fields` | String[] |
| `version` | Int |
| `status` | ContentStatus |
| `topic_id` | String? |

---

## Created Endpoints

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/knowledge/topics` | Liste aller Topics |
| GET | `/knowledge/entries` | Gefilterte Einträge |
| GET | `/knowledge/entries/{id}` | Einzelner Eintrag |

### Query-Parameter für /entries

| Parameter | Werte | Beispiel |
|-----------|-------|----------|
| `procedure` | IZA, IPK, IAA, ALL | `?procedure=IZA` |
| `topic` | Topic-Code | `?topic=zollwert` |
| `field` | Feldname | `?field=versandkosten` |

---

## Initiale Inhalte

### Topics (5)

| Code | Name |
|------|------|
| `zollwert` | Zollwert |
| `warennummer` | Warennummer |
| `dokumente` | Dokumente |
| `verfahren` | Verfahren |
| `kosten` | Kosten |

### Entries (10)

| Topic | Titel |
|-------|-------|
| Zollwert | Was ist der Zollwert? |
| Zollwert | Wie werden Versandkosten aufgeteilt? |
| Warennummer | Warum ist die Warennummer wichtig? |
| Warennummer | Wie finde ich die richtige Warennummer? |
| Dokumente | Welche Dokumente brauche ich? |
| Dokumente | Was muss auf der Rechnung stehen? |
| Verfahren | Was ist die IZA? |
| Verfahren | Welche Felder sind für Privatpersonen irrelevant? |
| Kosten | Wie wird die Einfuhrumsatzsteuer berechnet? |
| Kosten | Ab welchem Wert muss ich Zoll zahlen? |

---

## Changed / Created Files

### Backend

| Datei | Beschreibung |
|-------|--------------|
| `prisma/schema.prisma` | KnowledgeTopic, KnowledgeEntry, ProcedureType |
| `apps/api/app/routes/knowledge.py` | API-Routen |
| `apps/api/app/main.py` | Router registriert |

### Scripts

| Datei | Beschreibung |
|-------|--------------|
| `scripts/seed_knowledge.py` | Seed-Skript für initiale Daten |

### Tests

| Datei | Beschreibung |
|-------|--------------|
| `apps/api/tests/test_knowledge.py` | Backend-Tests |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/KNOWLEDGE_BASE.md` | Neue Datei |
| `docs/ARCHITECTURE.md` | Knowledge Layer hinzugefügt |
| `docs/sprints/sprint6/C6-knowledge-base.md` | Dieser Sprint-Log |

---

## Gaps / Notes

### Nicht implementiert (bewusst)

| Feature | Grund |
|---------|-------|
| AI-Anbindung | Zukünftiger Sprint |
| Scoring/Bewertung | Nicht im Scope |
| Admin-UI | Zukünftiger Sprint |
| Mehrsprachigkeit | Nur Deutsch |
| History/Versionierung | Nur aktuelle Version |

### Seed-Skript

Daten einfügen:
```bash
python -m scripts.seed_knowledge
```

### Migration

Nach Prisma-Änderungen:
```bash
npx prisma migrate dev --name add_knowledge_base
npx prisma generate
```

---

## Referenzen

- [KNOWLEDGE_BASE.md](../../KNOWLEDGE_BASE.md)
- [CONTENT_MODEL.md](../../CONTENT_MODEL.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
