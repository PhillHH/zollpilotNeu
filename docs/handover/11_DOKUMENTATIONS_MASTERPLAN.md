# 11 - Dokumentations-Masterplan

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Zukunftsfähiges Dokumentationskonzept

### Leitprinzipien

1. **Docs-as-Code** - Dokumentation im Repository, versioniert mit Git
2. **Single Source of Truth** - Keine Duplikate, klare Verweise
3. **Audience-First** - Klar definierte Zielgruppen pro Dokument
4. **Maintainable** - Automatisierung wo möglich, manuelle Pflege wo nötig
5. **Discoverable** - Klare Struktur, gute Navigation

---

## Zielgruppen und ihre Bedürfnisse

| Zielgruppe | Bedürfnisse | Priorität |
|------------|-------------|-----------|
| **Neuer Entwickler** | Setup, Architektur, Code-Konventionen | Hoch |
| **Bestandsentwickler** | API-Referenz, Troubleshooting, ADRs | Hoch |
| **Tech Lead / Architekt** | Architektur, Entscheidungen, Risiken | Mittel |
| **DevOps / SRE** | Deployment, Monitoring, Runbooks | Hoch |
| **Product Owner** | Features, Roadmap, Known Gaps | Mittel |
| **Investor / Auditor** | Executive Summary, Security, Compliance | Niedrig |

---

## Empfohlene Ordnerstruktur

```
docs/
├── README.md                    # Einstieg: Was ist ZollPilot, wie navigiere ich?
│
├── getting-started/             # 🟢 Onboarding
│   ├── QUICKSTART.md            # 15-Minuten-Setup
│   ├── DEVELOPMENT.md           # Entwicklungs-Workflow
│   ├── CONTRIBUTING.md          # Contribution Guidelines
│   └── FAQ.md                   # Häufige Entwickler-Fragen
│
├── architecture/                # 🔵 Architektur
│   ├── OVERVIEW.md              # System-Übersicht
│   ├── DECISIONS.md             # ADRs (Architecture Decision Records)
│   ├── DATA_MODEL.md            # Datenmodell
│   ├── SECURITY.md              # Security-Architektur
│   └── diagrams/                # ASCII/Mermaid-Diagramme
│       ├── system-overview.md
│       ├── request-flow.md
│       └── data-flow.md
│
├── api/                         # 🟡 API-Dokumentation
│   ├── OVERVIEW.md              # API-Übersicht
│   ├── AUTHENTICATION.md        # Auth-Flow
│   ├── CONTRACTS.md             # Response-Format, Error-Codes
│   └── endpoints/               # Endpunkt-Referenz
│       ├── auth.md
│       ├── cases.md
│       ├── procedures.md
│       ├── billing.md
│       └── admin.md
│
├── domain/                      # 🟠 Fachlichkeit
│   ├── OVERVIEW.md              # Zoll-Domäne erklärt
│   ├── PROCEDURES.md            # Verfahren-Übersicht
│   ├── procedures/
│   │   ├── IZA.md
│   │   ├── IPK.md
│   │   └── IAA.md
│   └── GLOSSARY.md              # Fachbegriffe
│
├── operations/                  # 🔴 Betrieb
│   ├── DEPLOYMENT.md            # Deployment-Anleitung
│   ├── MONITORING.md            # Monitoring-Setup
│   ├── TROUBLESHOOTING.md       # Fehlersuche
│   └── runbooks/
│       ├── deployment.md
│       ├── incident-response.md
│       ├── backup-restore.md
│       └── scaling.md
│
├── security/                    # 🟣 Security
│   ├── BASELINE.md              # Security-Richtlinien
│   ├── TENANT_ISOLATION.md      # Multi-Tenancy
│   ├── AUTH_FLOW.md             # Authentifizierung
│   └── COMPLIANCE.md            # DSGVO, etc.
│
├── handover/                    # 📋 Übergabe (dieses Verzeichnis)
│   ├── 01_PROJEKT_UEBERBLICK.md
│   ├── ...
│   └── 12_EXECUTIVE_SUMMARY.md
│
├── sprints/                     # 📅 Historisch (archivieren)
│   └── archive/                 # Alte Sprint-Logs
│
└── CHANGELOG.md                 # Versionierte Änderungen
```

---

## Namenskonventionen

### Dateinamen

| Typ | Konvention | Beispiel |
|-----|------------|----------|
| Konzept-Docs | UPPER_SNAKE_CASE.md | `AUTHENTICATION.md` |
| Tutorials | kebab-case.md | `setup-local-dev.md` |
| Referenz | kebab-case.md | `cases-api.md` |
| ADRs | `ADR-###-title.md` | `ADR-001-api-first.md` |
| Runbooks | `runbook-*.md` | `runbook-deployment.md` |

### Verzeichnisse

| Typ | Konvention | Beispiel |
|-----|------------|----------|
| Kategorie | kebab-case | `getting-started/` |
| Sammlung | plural | `endpoints/`, `runbooks/` |

### Intern-Referenzen

```markdown
<!-- Relativ zum aktuellen Verzeichnis -->
Siehe [Authentifizierung](./AUTHENTICATION.md)

<!-- Absolut vom docs-Root -->
Siehe [API-Übersicht](/api/OVERVIEW.md)

<!-- Zu Code-Referenz -->
Siehe [`apps/api/app/routes/auth.py`](../apps/api/app/routes/auth.py)
```

---

## Was automatisch generiert werden kann

### 1. OpenAPI-Dokumentation

**Quelle:** FastAPI generiert automatisch
**URL:** `http://localhost:8000/docs` (Swagger UI)
**Export:** `http://localhost:8000/openapi.json`

**Empfehlung:** In CI exportieren und committen

```yaml
# .github/workflows/ci.yml
- name: Export OpenAPI
  run: |
    curl http://localhost:8000/openapi.json > docs/api/openapi.json
```

### 2. TypeScript-Typen aus OpenAPI

**Tool:** `openapi-typescript`

```bash
npx openapi-typescript docs/api/openapi.json -o apps/web/src/types/api.ts
```

### 3. Dependency-Graphen

**Tool:** `pydeps` (Python), `madge` (TypeScript)

```bash
# Python
pydeps apps/api/app --cluster --noshow -o docs/architecture/diagrams/api-deps.svg

# TypeScript
npx madge --image docs/architecture/diagrams/web-deps.svg apps/web/src
```

### 4. Changelog aus Commits

**Tool:** `conventional-changelog`

**Voraussetzung:** Conventional Commits

```bash
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

### 5. Coverage-Reports

**Tools:** pytest-cov, vitest coverage

```bash
pytest --cov=app --cov-report=html:docs/coverage/api
vitest --coverage --reporter=html --outputFile=docs/coverage/web
```

---

## Was bewusst manuell gepflegt werden muss

### 1. Architecture Decision Records (ADRs)

**Warum manuell:** Erfordern Kontext und Begründung

**Template:**
```markdown
# ADR-###: Titel

**Status:** Vorgeschlagen | Akzeptiert | Abgelehnt | Überholt

## Kontext
Was ist das Problem?

## Entscheidung
Was haben wir entschieden?

## Konsequenzen
Was sind die Auswirkungen?

## Alternativen
Was haben wir verworfen?
```

### 2. Runbooks

**Warum manuell:** Erfordern Experten-Wissen

**Template:**
```markdown
# Runbook: Titel

## Wann anzuwenden
Beschreibung der Situation

## Voraussetzungen
- Tool X installiert
- Zugriff auf Y

## Schritte
1. Schritt eins
2. Schritt zwei

## Verifizierung
Wie prüfe ich ob es funktioniert hat?

## Rollback
Wie mache ich es rückgängig?

## Kontakt
Wer kann helfen?
```

### 3. Domain-Erklärungen

**Warum manuell:** Fachliches Wissen, nicht aus Code ableitbar

### 4. Troubleshooting-Guides

**Warum manuell:** Basiert auf Erfahrung mit realen Problemen

---

## Dokumentations-Kategorien

### Entwicklerdokumentation

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| QUICKSTART.md | 15-Min-Setup | Bei Setup-Änderungen |
| DEVELOPMENT.md | Workflow, Konventionen | Quartalsweise |
| CONTRIBUTING.md | PR-Prozess, Code-Style | Bei Policy-Änderungen |
| API-Referenz | Endpunkte, Beispiele | Auto-generiert |

### Architekturdokumentation

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| OVERVIEW.md | System-Übersicht | Bei Architektur-Änderungen |
| ADRs | Entscheidungen | Bei jeder Entscheidung |
| DATA_MODEL.md | Schema-Erklärung | Bei Schema-Änderungen |
| SECURITY.md | Security-Architektur | Quartalsweise |

### Domänendokumentation

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| PROCEDURES.md | Verfahren-Übersicht | Bei neuen Verfahren |
| IZA/IPK/IAA.md | Verfahren-Details | Bei Verfahrens-Änderungen |
| GLOSSARY.md | Fachbegriffe | Bei Bedarf |

### Security-Dokumentation

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| BASELINE.md | Security-Richtlinien | Jährlich |
| TENANT_ISOLATION.md | Multi-Tenancy | Bei Architektur-Änderungen |
| COMPLIANCE.md | DSGVO, etc. | Bei Rechts-Änderungen |

### Betriebs-/Runbooks

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| DEPLOYMENT.md | Deployment-Anleitung | Bei Prozess-Änderungen |
| MONITORING.md | Metriken, Alerts | Bei Monitoring-Änderungen |
| runbook-*.md | Incident-Anleitungen | Nach Incidents |

### Onboarding

| Dokument | Inhalt | Aktualisierung |
|----------|--------|----------------|
| README.md (Root) | Projekt-Übersicht | Quartalsweise |
| QUICKSTART.md | Schnellstart | Bei Setup-Änderungen |
| FAQ.md | Häufige Fragen | Bei neuen Fragen |

---

## Migrations-Plan (Aktuell → Ziel)

### Phase 1: Struktur anlegen (1 Tag)

1. Verzeichnisse erstellen
2. README.md mit Navigation erstellen
3. Bestehende Docs umsortieren

### Phase 2: Lücken füllen (3-5 Tage)

| Dokument | Priorität | Aufwand |
|----------|-----------|---------|
| QUICKSTART.md | Hoch | 2h |
| DEVELOPMENT.md | Hoch | 4h |
| TROUBLESHOOTING.md | Hoch | 4h |
| runbook-deployment.md | Hoch | 2h |
| CHANGELOG.md | Mittel | 1h |

### Phase 3: Automatisierung (2-3 Tage)

1. OpenAPI-Export in CI
2. Coverage-Reports in CI
3. Changelog-Generation einrichten

### Phase 4: Archivierung (1 Tag)

1. Sprint-Logs nach `sprints/archive/` verschieben
2. Veraltete Docs aktualisieren oder entfernen
3. Redirects/Links prüfen

---

## Review-Prozess

### Bei Code-Änderungen

```
┌─────────────────────────────────────────────────────────────────┐
│                    PR-CHECKLIST                                  │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Neue API-Endpunkte in docs/api/ dokumentiert?              │
│ [ ] Architektur-Änderungen → ADR erstellt?                     │
│ [ ] Schema-Änderungen → DATA_MODEL.md aktualisiert?            │
│ [ ] Breaking Changes → CHANGELOG.md aktualisiert?              │
└─────────────────────────────────────────────────────────────────┘
```

### Quartals-Review

1. Alle Docs auf Aktualität prüfen
2. Dead Links finden und fixen
3. FAQs aus Support-Anfragen ergänzen
4. ADRs auf Relevanz prüfen

---

## Tools-Empfehlungen

| Zweck | Tool | Bemerkung |
|-------|------|-----------|
| Markdown-Preview | VS Code + Markdown Preview | Standard |
| Diagramme | Mermaid | In Markdown eingebettet |
| API-Docs | FastAPI Swagger | Auto-generiert |
| Linting | markdownlint | CI-Integration |
| Link-Check | markdown-link-check | CI-Integration |
| Changelog | conventional-changelog | Aus Commits |

---

## Zusammenfassung

**Sofort umsetzen:**
1. Verzeichnisstruktur anlegen
2. QUICKSTART.md schreiben
3. CONTRIBUTING.md schreiben

**Kurzfristig:**
4. Runbooks erstellen
5. Troubleshooting-Guide
6. OpenAPI-Export automatisieren

**Langfristig:**
7. Quartals-Review-Prozess etablieren
8. Changelog-Automation
9. Sprint-Logs archivieren
