# 07 - Dokumentations-Audit

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Existierende Dokumentation

### Übersicht

```
docs/
├── ARCHITECTURE.md              # Systemarchitektur
├── API_CONTRACTS.md             # API-Spezifikation
├── AUTH.md                      # Authentifizierung
├── SETUP.md                     # Entwicklungsumgebung
├── DESIGN_SYSTEM.md             # UI-Design
├── PROCEDURES.md                # Verfahrensübersicht
├── CONTENT_MODEL.md             # Content-Datenmodell
├── CONTENT_GUIDE.md             # Redaktionsleitfaden
├── KNOWLEDGE_BASE.md            # Wissensbasis
├── OPERATIONS.md                # Deployment
├── SECURITY_BASELINE.md         # Sicherheitsrichtlinien
├── ROADMAP.md                   # Produktroadmap
├── DECISIONS.md                 # ADRs
├── KNOWN_GAPS.md                # Technische Schulden
├── RELEASE_CHECKLIST.md         # Release-Prozess
├── ADMIN_MANUAL.md              # Admin-Handbuch
├── USER_GUIDE.md                # Benutzerhandbuch
├── WORDING_GUIDE.md             # Wording-Richtlinien
├── API_PROXY_COOKIES.md         # Cookie-Handling
│
├── PROCEDURES/                  # Verfahrens-Dokumentation
│   ├── OVERVIEW.md
│   ├── IZA.md
│   ├── IPK.md
│   └── IAA.md
│
├── BILLING/                     # Abrechnungsdokumentation
│   ├── PAYMENTS.md
│   └── CREDITS.md
│
├── SECURITY/                    # Sicherheitsdokumentation
│   └── TENANT_ISOLATION.md
│
├── UX/                          # UX-Dokumentation
│   ├── DASHBOARD.md
│   ├── CASES.md
│   ├── MAPPING_VIEW.md
│   ├── BILLING.md
│   ├── PROFILE.md
│   ├── WORDING.md
│   ├── SIDEBAR_STATE.md
│   ├── SIDEBAR_STRUCTURE.md
│   └── UI_COMPONENTS.md
│
├── FEATURES/                    # Feature-Dokumentation
│   └── PREFILL.md
│
├── CONTENT/                     # Inhaltsstrategie
│   └── ARTICLE_SERIES_IZA.md
│
├── LEGAL/                       # Rechtliches
│   └── IMPRESSUM.md
│
└── sprints/                     # Sprint-Logs
    ├── sprint1/                 # 15 Dateien
    ├── sprint2/                 # 9 Dateien
    ├── sprint3/                 # 4 Dateien
    ├── sprint4/                 # 5 Dateien
    ├── sprint5/                 # 6 Dateien
    ├── sprint6/                 # 6 Dateien
    ├── sprint7/                 # 2 Dateien
    ├── sprint8/                 # 1 Datei
    ├── sprint9/                 # 1 Datei
    └── sprint10/                # 1 Datei
```

**Gesamtzahl:** ~80+ Markdown-Dateien

---

## Was korrekt und aktuell ist ✅

### 1. ARCHITECTURE.md

| Aspekt | Bewertung |
|--------|-----------|
| Schichttrennung | ✅ Korrekt beschrieben |
| Procedure Engine | ✅ Aktuell |
| Case Lifecycle | ✅ Aktuell |
| PDF Generation | ✅ Aktuell |
| Design System | ✅ Aktuell |
| Security Layer | ✅ Aktuell (Sprint 10) |

**Qualität:** Sehr gut, umfassend, mit ASCII-Diagrammen

### 2. AUTH.md

| Aspekt | Bewertung |
|--------|-----------|
| Session-Flow | ✅ Korrekt |
| RBAC-Hierarchie | ✅ Aktuell |
| Rollen-Beschreibungen | ✅ Vollständig |

### 3. KNOWN_GAPS.md

| Aspekt | Bewertung |
|--------|-----------|
| Technical Debt Liste | ✅ Aktuell |
| Prioritäten | ✅ Nachvollziehbar |
| Migration Path | ✅ Hilfreich |

### 4. DECISIONS.md (ADRs)

| Aspekt | Bewertung |
|--------|-----------|
| ADR-Format | ✅ Konsistent |
| 10 Entscheidungen | ✅ Dokumentiert |
| Konsequenzen | ✅ Ehrlich |

### 5. PROCEDURES/*.md

| Aspekt | Bewertung |
|--------|-----------|
| IZA, IPK, IAA | ✅ Vollständig dokumentiert |
| Felder-Tabellen | ✅ Aktuell |
| Validierungsregeln | ✅ Korrekt |

### 6. SECURITY/TENANT_ISOLATION.md

| Aspekt | Bewertung |
|--------|-----------|
| Non-Negotiables | ✅ Klar |
| Code-Beispiele | ✅ Aktuell |
| Threat Model | ✅ Vorhanden |

---

## Was veraltet ist ⚠️

### 1. ROADMAP.md

**Status:** Veraltet

**Probleme:**
- Zeigt "Sprint 2 Vorschläge" - aber Sprint 9/10 sind bereits abgeschlossen
- IPK und IAA als "geplant" - aber bereits implementiert
- Stripe als "geplant" - aber Checkout existiert bereits

**Empfehlung:** Aktualisieren oder archivieren

### 2. Sprint-Dokumentation (sprints/)

**Status:** Historisch, aber inkonsistent gepflegt

**Beobachtung:**
- Sprint 1-6: Detailliert (15+ Dateien)
- Sprint 7-10: Minimal (1-2 Dateien pro Sprint)

**Empfehlung:** Archivieren oder in CHANGELOG konsolidieren

### 3. RELEASE_CHECKLIST.md

**Status:** Möglicherweise veraltet

**Unklar:**
- Ob die Checkliste aktiv verwendet wird
- Ob sie alle aktuellen Anforderungen abdeckt

**Empfehlung:** Review und Update

---

## Was komplett fehlt ❌

### 1. Onboarding-Dokumentation

**Fehlt:**
- "Getting Started" für neue Entwickler
- Schritt-für-Schritt Setup-Anleitung
- Entwicklungs-Workflow-Guide

**Vorhanden aber unzureichend:**
- SETUP.md existiert, aber oberflächlich

### 2. API-Referenz (vollständig)

**Fehlt:**
- Automatisch generierte OpenAPI-Docs
- Vollständige Request/Response-Beispiele für alle Endpunkte

**Vorhanden aber unvollständig:**
- API_CONTRACTS.md listet Endpunkte, aber nicht alle Parameter

### 3. Troubleshooting-Guide

**Fehlt komplett:**
- Häufige Fehler und Lösungen
- Debug-Strategien
- Log-Interpretation

### 4. Runbooks

**Fehlt:**
- Deployment-Runbook
- Incident-Response
- Backup/Restore
- Skalierungs-Anleitung

### 5. Monitoring-Dokumentation

**Fehlt:**
- Welche Metriken wichtig sind
- Alerting-Regeln
- Dashboard-Setup

### 6. Datenschutz-/DSGVO-Dokumentation

**Fehlt:**
- Technische DSGVO-Maßnahmen
- Daten-Löschung-Prozess
- Verarbeitungsverzeichnis

### 7. Changelog

**Fehlt:**
- Versionierte Änderungshistorie
- Breaking Changes
- Upgrade-Anleitungen

---

## Wo Doku und Code sich widersprechen

### 1. Content-Modelle

**Doku (ARCHITECTURE.md):**
> "BlogPost, FaqEntry, KnowledgeTopic, KnowledgeEntry in PostgreSQL"

**Code (prisma/schema.prisma):**
Modelle sind definiert, aber:
- Keine eindeutige Migration für Content-Tabellen gefunden
- `create_content_tables.sql` existiert separat

**Widerspruch:** Unklar ob Content via Migration oder SQL-Skript erstellt wird

### 2. IZA als "einziges Verfahren"

**Doku (ARCHITECTURE.md, Abschnitt "Sprint 1 Complete"):**
> "Only IZA v1 is implemented"
> "IPK (Import Permit) and IAA planned for future"

**Code:**
- `prisma/migrations/0014_ipk_iaa_v1/` existiert
- `apps/web/src/procedures/IPK/` und `IAA/` vollständig

**Widerspruch:** Dokumentation nicht aktualisiert nach Sprint 9

### 3. Payment Status

**Doku (KNOWN_GAPS.md):**
> "Credits können nur manuell von Admins vergeben werden"

**Code:**
- `apps/api/app/routes/checkout.py` existiert
- Stripe-Webhook-Handler implementiert

**Widerspruch:** Payment ist teilweise implementiert, Doku suggeriert "nicht vorhanden"

### 4. Rate Limiting

**Doku (ARCHITECTURE.md):**
> "Rate Limiting" als Feature aufgeführt

**KNOWN_GAPS.md:**
> "In-Memory Rate Limiting" als kritisches Problem

**Kein Widerspruch, aber:** Unterschiedliche Dokumente haben unterschiedliche Perspektiven - verwirrend für Leser

---

## Dokumentationsqualität nach Bereich

| Bereich | Qualität | Bemerkung |
|---------|----------|-----------|
| **Architektur** | ★★★★☆ | Umfassend, leicht veraltet |
| **API** | ★★★☆☆ | Grundlagen, Details fehlen |
| **Security** | ★★★★☆ | Gut, besonders Tenant-Isolation |
| **Procedures** | ★★★★★ | Exzellent, vollständig |
| **UX/Design** | ★★★☆☆ | Vorhanden, verstreut |
| **Operations** | ★★☆☆☆ | Minimal |
| **Onboarding** | ★☆☆☆☆ | Fast nicht vorhanden |
| **ADRs** | ★★★★☆ | Konsistent, hilfreich |

---

## Empfehlungen

### Sofort (1-2 Tage)

1. **ROADMAP.md aktualisieren**
   - IPK, IAA als "implementiert" markieren
   - Stripe-Status aktualisieren

2. **ARCHITECTURE.md aktualisieren**
   - "What's NOT Implemented" Sektion korrigieren
   - IPK/IAA erwähnen

3. **API_CONTRACTS.md vervollständigen**
   - Fehlende Endpunkte dokumentieren
   - Request/Response-Beispiele

### Kurzfristig (1 Woche)

4. **Onboarding-Guide erstellen**
   - README.md im Root verbessern
   - CONTRIBUTING.md erstellen
   - Entwickler-Workflow dokumentieren

5. **Runbooks erstellen**
   - Deployment-Runbook
   - Troubleshooting-Guide

### Mittelfristig (1 Monat)

6. **Changelog einführen**
   - CHANGELOG.md mit Semantic Versioning
   - Automatisierung via Conventional Commits

7. **Dokumentation konsolidieren**
   - Sprint-Logs archivieren
   - Redundante Dokumente zusammenführen

---

## Zusammenfassung

| Kategorie | Bewertung |
|-----------|-----------|
| **Umfang** | ✅ Umfangreich (80+ Dateien) |
| **Aktualität** | ⚠️ Teilweise veraltet |
| **Konsistenz** | ⚠️ Inkonsistenzen zwischen Docs |
| **Vollständigkeit** | ⚠️ Lücken bei Operations/Onboarding |
| **Struktur** | ✅ Gut organisiert |
| **Qualität** | ✅ Überwiegend gut geschrieben |

**Gesamturteil:** Die Dokumentation ist für ein Early-Stage-Projekt überdurchschnittlich gut. Die Hauptprobleme sind Aktualität und fehlende Operations-Dokumentation.
