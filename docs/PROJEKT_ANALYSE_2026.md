# ZollPilot - Vollst&auml;ndige Projektanalyse

> Stand: 07.02.2026 | Branch: `claude/analyze-project-status-aa0T2`

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Was das Projekt werden soll (Vision)](#2-was-das-projekt-werden-soll)
3. [Was es aktuell ist (Ist-Zustand)](#3-was-es-aktuell-ist)
4. [Was funktioniert](#4-was-funktioniert)
5. [Was fehlt / nicht funktioniert](#5-was-fehlt)
6. [Technische Architektur](#6-technische-architektur)
7. [Codebase-Map: Wo liegt was?](#7-codebase-map)
8. [IZR-Flow Analyse: Ist vs. Soll](#8-izr-flow-analyse)
9. [Soll-Architektur: CrewAI + Popup + Widget](#9-soll-architektur)
10. [Empfohlene Implementierungsreihenfolge](#10-implementierungsreihenfolge)

---

## 1. Executive Summary

**ZollPilot** ist eine Multi-Tenant SaaS-Plattform zur Vorbereitung von deutschen Zollanmeldungen. Das Projekt steht bei **Sprint 1 abgeschlossen** (v1.0.0) mit 108 Commits, ~474 Dateien und umfangreicher Dokumentation.

### Kernzahlen

| Metrik | Wert |
|--------|------|
| Commits | 108 |
| Dateien | ~474 |
| Backend | FastAPI (Python 3.12) |
| Frontend | Next.js 14 (React 18, TypeScript) |
| Datenbank | PostgreSQL 15 + Prisma ORM |
| Tests | 47 Testdateien (23 Backend, 24 Frontend) |
| Dokumentation | 80+ Markdown-Dateien |
| Deployment | Docker (Multi-Stage) + GitHub Actions CI |

### Status-Bewertung

| Bereich | Bewertung |
|---------|-----------|
| Code-Qualit&auml;t | ★★★★☆ Gut strukturiert, sauber |
| Architektur | ★★★★★ Durchdacht, skalierbar |
| Feature-Vollst&auml;ndigkeit | ★★★☆☆ MVP steht, viel fehlt noch |
| Produktionsreife | ★★☆☆☆ Security-Hardening n&ouml;tig |
| Dokumentation | ★★★★☆ Umfangreich |
| AI/ML-Integration | ☆☆☆☆☆ Nicht vorhanden |

---

## 2. Was das Projekt werden soll

### Vision laut Dokumentation

ZollPilot ist als **"Ausf&uuml;llhilfe"** f&uuml;r Zollanmeldungen positioniert - kein Gateway-System, sondern ein Vorbereitungs-Tool. Nutzer sammeln und organisieren ihre Daten, bevor sie diese auf den offiziellen Zollseiten einreichen.

### Zielgruppen

1. **Privatpersonen (IZA)** - Einzelimporte aus Nicht-EU, z.B. China/USA-Bestellungen &uuml;ber 150€
2. **Kleine Unternehmen (IPK/IAA)** - Regelm&auml;&szlig;ige Im-/Exporte
3. **Unternehmen (Zukunft)** - Massenoperationen, API-Zugang, White-Label

### Dokumentierte Roadmap (langfristig)

- HSCode-Suche mit Autocomplete
- Zoll-/MwSt-Rechner
- ATLAS-Integration (direkte Beh&ouml;rden-&Uuml;bermittlung)
- Mobile App
- Mehrsprachigkeit (EN, FR)
- API f&uuml;r Drittanbieter

---

## 3. Was es aktuell ist

### Implementierte Kernfunktionen

#### A) Drei Zollverfahren

| Verfahren | Zielgruppe | Schritte | Felder | Status |
|-----------|-----------|----------|--------|--------|
| **IZA** (Internet-Zollanmeldung Import) | Privatpersonen | 4 | 12 | ✅ Voll funktionsf&auml;hig |
| **IPK** (Import-Paketverkehr) | Kleine Unternehmen | 3 | 10 | ✅ Definiert |
| **IAA** (Internet-Ausfuhranmeldung) | Kleine Unternehmen | 3 | 16 | ✅ Definiert |

#### B) Case-Management-Workflow

```
DRAFT → IN_PROCESS → PREPARED → COMPLETED → ARCHIVED
```

- Case erstellen, Verfahren ausw&auml;hlen, Wizard durchlaufen
- Server-seitige Validierung
- Immutable Snapshots bei Submission
- PDF-Export (1 Credit pro PDF)

#### C) Invoice Prefill (v1 - nur Heuristik)

- PDF-Upload mit Drag&Drop
- **Regex-basierte** Textextraktion (kein AI/ML!)
- Erkannte Felder: Warenwert, Versandkosten, W&auml;hrung, H&auml;ndlername
- Konfidenz-Scores (0.0-1.0)
- Nutzer muss jeden Vorschlag manuell best&auml;tigen
- DSGVO-konform: In-Memory-Verarbeitung, keine Speicherung

#### D) Billing & Credits

- Plan-Verwaltung (FREE-Plan automatisch zugewiesen)
- Credit-System auf Tenant-Ebene
- Immutable Ledger f&uuml;r alle Transaktionen
- Stripe-Integration: **Mock-Implementierung** (echte SDK auskommentiert)

#### E) Content-Management

- Blog-System mit MDX, Draft/Publish-Workflow
- FAQ-System mit Kategorien
- Admin-Interface f&uuml;r Blog/FAQ
- SEO: Sitemap, Robots.txt, Meta-Tags

#### F) Admin-Panel

- Plan-Management (CRUD)
- Tenant-Verwaltung
- Credit-Ledger
- Content-Admin
- Security-Events-Log

---

## 4. Was funktioniert

### ✅ Vollst&auml;ndig funktional

- **User-Registration & Login** - Session-basiert, HTTP-only Cookies
- **Multi-Tenant-Isolation** - Alle Daten tenant-scoped
- **RBAC** - 5 Rollen: SYSTEM_ADMIN > OWNER > ADMIN > EDITOR > USER
- **IZA-Wizard** - 4-Schritt-Formular mit Autosave
- **Case-Lifecycle** - Status-Transitionen mit Validierung
- **PDF-Export** - WeasyPrint + Jinja2-Templates
- **Invoice-Prefill** - Regex-basierte PDF-Extraktion
- **Blog & FAQ** - Vollst&auml;ndiges CMS
- **Admin-Backend** - Plan-, Tenant-, User-Verwaltung
- **Docker-Deployment** - Multi-Stage-Builds, docker-compose
- **CI/CD** - GitHub Actions (Lint, Type-Check, Tests, Build)

### ⚠️ Teilweise funktional

- **Stripe-Checkout** - Mock-Implementierung, echte Integration auskommentiert
- **Sidebar** - Navigation funktioniert, aber kein schwebendes Overlay/Widget
- **IPK/IAA-Verfahren** - Definiert in DB, aber weniger getestet als IZA
- **Profil-Defaults** - Autof&uuml;ll aus Profil m&ouml;glich, aber begrenzt

---

## 5. Was fehlt

### ❌ Nicht implementiert

| Feature | Priorit&auml;t | Aufwand |
|---------|------------|---------|
| **AI/ML-Integration** (CrewAI, LLM) | Hoch | Groß |
| **Browser-Extension/Widget/Overlay** | Hoch | Groß |
| **ATLAS/Zollseite-Automation** | Hoch | Groß |
| **E-Mail-Benachrichtigungen** | Mittel | Mittel |
| **Echte Stripe-Integration** | Mittel | Mittel |
| **OCR f&uuml;r Bilder** | Mittel | Mittel |
| **2FA / Account-Lockout** | Mittel | Klein |
| **Security-Headers** | Hoch | Klein |
| **Redis Rate-Limiting** | Hoch | Klein |
| **Error-Tracking (Sentry)** | Mittel | Klein |
| **E2E-Tests (Playwright)** | Mittel | Mittel |
| **HSCode-Suche** | Mittel | Mittel |
| **Zoll-/MwSt-Rechner** | Niedrig | Mittel |

### Realit&auml;ts-Check: Marketing vs. Code

| Versprechen | Realit&auml;t |
|-------------|-----------|
| "KI-gest&uuml;tzte Plattform" | Regex-Heuristik, kein ML/LLM |
| "Intelligente Feldvorschl&auml;ge" | Statische Profil-Defaults |
| "Lernende Fehlermeldungen" | Hardcodierte Regeln |
| "Tarif-Suche" | Nicht implementiert |

---

## 6. Technische Architektur

### Monorepo-Struktur

```
zollpilotNeu/
├── apps/
│   ├── api/          → FastAPI Backend (Python 3.12)
│   │   ├── app/
│   │   │   ├── core/         → Config, Security, Logging, Errors, RBAC
│   │   │   ├── db/           → Prisma Client
│   │   │   ├── dependencies/ → Auth-Dependencies (FastAPI Depends)
│   │   │   ├── domain/       → Business-Logik (Wizard, Cases, Procedures)
│   │   │   ├── middleware/    → Session, RateLimit, RequestID, ContractVersion
│   │   │   ├── routes/        → 16 API-Router-Module
│   │   │   └── services/      → PDF-Service
│   │   ├── tests/             → 23 pytest-Testdateien
│   │   └── Dockerfile
│   │
│   └── web/          → Next.js 14 Frontend (TypeScript)
│       ├── src/
│       │   ├── app/           → Pages & Routes (App Router)
│       │   │   ├── app/       → Authenticated routes (/app/*)
│       │   │   ├── admin/     → Admin routes (/admin/*)
│       │   │   ├── components/→ Shared UI-Komponenten
│       │   │   ├── design-system/ → Tokens, Primitives (Button, Card, Alert, etc.)
│       │   │   ├── hooks/     → useSidebarState, useToast
│       │   │   └── lib/       → API-Client, Auth-Helpers
│       │   ├── procedures/    → IZA/IPK/IAA Verfahrens-Definitionen
│       │   └── navigation/    → Sidebar-Config
│       ├── tests/             → 24 vitest-Testdateien
│       └── Dockerfile
│
├── packages/
│   └── shared/       → Shared DTOs & Types
│
├── prisma/           → DB-Schema & 16 Migrations
├── docs/             → 80+ Dokumentations-Dateien
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### Backend-API-Endpunkte

| Route-Modul | Pfad | Zweck |
|-------------|------|-------|
| `auth.py` | `/auth/*` | Register, Login, Logout, /me |
| `cases.py` | `/cases/*` | Case CRUD, Fields |
| `wizard.py` | `/cases/{id}/wizard/*` | Wizard Navigation & State |
| `lifecycle.py` | `/cases/{id}/*` | prepare, complete, archive |
| `procedures.py` | `/procedures/*` | Verfahrens-Definitionen |
| `prefill.py` | `/prefill/*` | Invoice-Upload & Extraktion |
| `pdf.py` | `/cases/{id}/pdf` | PDF-Export |
| `billing.py` | `/billing/*` | Credits & Purchases |
| `checkout.py` | `/billing/checkout/*` | Stripe-Sessions |
| `admin.py` | `/admin/*` | Plans, Tenants, Users |
| `admin_content.py` | `/admin/content/*` | Blog & FAQ CRUD |
| `content.py` | `/content/*` | Public Blog & FAQ |
| `knowledge.py` | `/knowledge/*` | Knowledge Base |
| `dashboard.py` | `/dashboard` | Metriken |
| `profile.py` | `/profile/*` | User-Profil |
| `health.py` | `/health`, `/ready` | Health Checks |

### Frontend-Routen

```
/                      → Landing Page
/login, /register      → Auth
/blog, /blog/[slug]    → Blog
/faq                   → FAQ
/app                   → Dashboard (auth required)
/app/cases             → Case-Liste
/app/cases/[id]        → Case-Detail
/app/cases/[id]/wizard → Wizard (Kernst&uuml;ck!)
/app/cases/[id]/summary→ Zusammenfassung
/app/billing           → Credits & Abrechnung
/app/profile           → Profil-Einstellungen
/admin/*               → Admin-Backend (SYSTEM_ADMIN required)
```

### Middleware-Stack (Backend)

```
Request → CORS → RequestID → ContractVersion → Session → RateLimit → Route Handler
```

### Datenbank-Modell (Kern)

```
User ──1:N── Session
User ──1:1── UserProfile
User ──1:N── Membership ──N:1── Tenant
Tenant ──1:N── Case
Case ──1:N── CaseField
Case ──1:N── CaseSnapshot
Case ──1:1── WizardProgress
Case ──N:1── Procedure ──1:N── ProcedureStep ──1:N── ProcedureField
Tenant ──1:1── TenantCreditBalance ──1:N── CreditLedgerEntry
Tenant ──N:1── Plan
```

---

## 7. Codebase-Map

### Wo finde ich was?

#### Wenn ich den IZR-Flow &auml;ndern will:

| Was | Wo |
|-----|-----|
| IZA-Wizard-Schritte (Frontend) | `apps/web/src/procedures/IZA/v1/steps.ts` |
| IZA-Field-Mapping | `apps/web/src/procedures/IZA/v1/mapping.ts` |
| Wizard-UI-Komponente | `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx` |
| Field-Renderer | `apps/web/src/app/app/cases/[id]/wizard/FieldRenderer.tsx` |
| Procedure-Selector | `apps/web/src/app/app/cases/[id]/wizard/ProcedureSelector.tsx` |
| Invoice-Upload UI | `apps/web/src/app/app/cases/[id]/wizard/InvoicePrefill.tsx` |
| Wizard-Backend-API | `apps/api/app/routes/wizard.py` |
| Wizard-Business-Logik | `apps/api/app/domain/wizard.py` |
| Wizard-Step-Definitionen | `apps/api/app/domain/wizard_steps.py` |
| Case-Status-Logik | `apps/api/app/domain/case_status.py` |
| Prefill/Extraktion | `apps/api/app/routes/prefill.py` |

#### Wenn ich neue UI-Komponenten bauen will:

| Was | Wo |
|-----|-----|
| Design-Tokens (Farben, Spacing) | `apps/web/src/app/design-system/tokens.css` |
| Button, Card, Alert, Badge, Toast | `apps/web/src/app/design-system/primitives/` |
| Sidebar | `apps/web/src/app/components/Sidebar/` |
| App-Shell (Layout) | `apps/web/src/app/components/AppShell.tsx` |
| Toast-System | `apps/web/src/app/design-system/primitives/Toast.tsx` |
| Globale Styles | `apps/web/src/app/globals.css` |

#### Wenn ich API-Endpunkte hinzuf&uuml;gen will:

| Was | Wo |
|-----|-----|
| Neuen Router erstellen | `apps/api/app/routes/neuer_router.py` |
| Router registrieren | `apps/api/app/main.py` (include_router) |
| Auth-Dependency | `apps/api/app/dependencies/auth.py` |
| DB-Zugriff | `apps/api/app/db/client.py` (Prisma) |
| Fehler-Codes | `apps/api/app/core/errors.py` |
| Schema erweitern | `prisma/schema.prisma` → `npx prisma migrate dev` |

#### Wenn ich Billing/Credits &auml;ndern will:

| Was | Wo |
|-----|-----|
| Credit-Logik Backend | `apps/api/app/routes/billing.py` |
| Stripe-Checkout | `apps/api/app/routes/checkout.py` |
| Billing-UI | `apps/web/src/app/app/billing/BillingClient.tsx` |
| Plan-Admin | `apps/web/src/app/admin/plans/` |

---

## 8. IZR-Flow Analyse: Ist vs. Soll

### Aktueller IZR-Flow (Ist)

```
1. User loggt sich ein
2. User erstellt neuen Case
3. User w&auml;hlt Verfahren (IZA/IPK/IAA)
4. User durchl&auml;uft 3-4 Wizard-Schritte manuell
   - Optional: Invoice-PDF hochladen → Regex-Vorschl&auml;ge
   - Jedes Feld einzeln ausf&uuml;llen
5. Server-Validierung
6. Case einreichen (Snapshot erstellen)
7. PDF exportieren (1 Credit)
8. User geht manuell zur Zollseite und tippt alles nochmal ein
```

**Probleme:**
- User muss alles doppelt eingeben (ZollPilot + Zollseite)
- Kein Wissen dar&uuml;ber, welche Felder wann obligatorisch sind
- Keine Hilfe bei der eigentlichen Zollanmeldung auf der Beh&ouml;rdenseite
- Regex-Extraktion ist limitiert und unzuverl&auml;ssig
- Kein intelligenter Kontext (welches Feld unter welcher Bedingung?)

### Gew&uuml;nschter IZR-Flow (Soll)

```
1. User l&auml;dt Rechnung hoch (PDF/Screenshot/Foto)
   → Sp&auml;ter auch: Spracheingabe
2. CrewAI-Agents analysieren:
   a) Was ist das f&uuml;r eine Ware?
   b) Welche Zollfelder sind relevant?
   c) Internet-Recherche: Welche Werte m&uuml;ssen eingetragen werden?
3. Ergebnis: Scrollbares Popup
   - Alle Felder mit Soll-Werten
   - Suchfunktion (nach Begriffen und Sollwerten)
   - Nutzer kann scrollen und nachschlagen
4. Overlay-Widget auf der Zollseite
   - Wie Lucia-Plugin auf LinkedIn
   - &Ouml;ffnet sich als Sidebar auf der Zollseite
   - Zeigt die ermittelten Werte an
   - Kann Felder automatisch ausf&uuml;llen (Test-Phase)
5. Direkte Zollanmeldung
   - Werte direkt &uuml;ber die Zollseite einreichen
   - Mit user-generierter E-Mail-Adresse
   - Im Account speichern
```

### Gap-Analyse

| Feature | Ist | Soll | Gap |
|---------|-----|------|-----|
| Rechnungs-Upload | ✅ PDF-Upload | PDF/Bild/Screenshot/Sprache | OCR, Speech-to-Text |
| Daten-Extraktion | ⚠️ Regex | CrewAI + Internet-Recherche | Komplett neu |
| Feld-Wissen | ❌ Statisch | Dynamisch (welches Feld wann?) | CrewAI-Agents |
| Ergebnis-Anzeige | ⚠️ Inline-Formular | Scrollbares Popup mit Suche | Neue Komponente |
| Zollseite-Integration | ❌ Nicht vorhanden | Overlay-Widget/Sidebar | Browser Extension |
| Auto-Fill | ❌ Nicht vorhanden | Felder automatisch setzen | Extension + DOM-Manipulation |
| Direkte Einreichung | ❌ Nicht vorhanden | &Uuml;ber Zollseite senden | Automation/API |

---

## 9. Soll-Architektur: CrewAI + Popup + Widget

### &Uuml;bersicht der drei Hauptkomponenten

```
┌─────────────────────────────────────────────────────────┐
│                    ZollPilot Web App                      │
│                                                           │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │  1. Upload   │───→│  2. CrewAI    │───→│ 3. Ergebnis │ │
│  │  (Rechnung)  │    │  (Backend)   │    │ (Popup)     │ │
│  └─────────────┘    └──────┬───────┘    └──────┬──────┘ │
│                             │                    │        │
│                             │                    ▼        │
│                    ┌────────▼────────┐  ┌─────────────┐  │
│                    │  Internet-      │  │ 4. Browser   │  │
│                    │  Recherche      │  │ Extension    │  │
│                    │  (Agents)       │  │ (Widget)     │  │
│                    └─────────────────┘  └──────┬──────┘  │
│                                                 │        │
│                                        ┌────────▼──────┐ │
│                                        │ 5. Zollseite  │ │
│                                        │ Auto-Fill     │ │
│                                        └───────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Komponente 1: Vereinfachter Upload

**Wo ansetzen:** `apps/web/src/app/app/cases/[id]/wizard/InvoicePrefill.tsx`

**Was &auml;ndern:**
- Bestehende Upload-Komponente erweitern
- Neue Eingabem&ouml;glichkeiten: Screenshot, Foto, (sp&auml;ter Sprache)
- Vereinfachtes Formular: Weniger manuelle Eingabe, mehr automatische Erkennung
- Neuer API-Endpunkt f&uuml;r AI-gest&uuml;tzte Analyse

### Komponente 2: CrewAI Backend

**Wo ansetzen:** Neues Modul `apps/api/app/services/crew_service.py`

**Architektur:**
```python
# Neue Dateien:
apps/api/app/services/crew_service.py     # CrewAI Orchestrierung
apps/api/app/services/agents/              # Agent-Definitionen
  ├── invoice_analyzer.py                  # Rechnungs-Analyse
  ├── customs_researcher.py                # Zoll-Recherche
  └── field_mapper.py                      # Feld-Zuordnung
apps/api/app/routes/ai_analysis.py         # API-Endpunkt
```

**Agents:**
1. **Invoice Analyzer Agent** - Analysiert die hochgeladene Rechnung (OCR + LLM)
2. **Customs Researcher Agent** - Recherchiert im Internet: Welche Zollfelder sind relevant?
3. **Field Mapper Agent** - Ordnet die extrahierten Daten den Zollfeldern zu

**Dependencies hinzuf&uuml;gen:**
```
crewai
langchain
openai  # oder anthropic
pytesseract  # f&uuml;r OCR
```

### Komponente 3: Scrollbares Ergebnis-Popup

**Wo ansetzen:** Neue Komponente `apps/web/src/app/components/ZollPilotPopup/`

**Features:**
- Scrollbare Liste aller Zollfelder mit Soll-Werten
- Suchfunktion (nach Begriffen, Feldnamen, Werten)
- Gruppierung nach Kategorien (Senderdaten, Empf&auml;ngerdaten, Warendaten, etc.)
- Status-Anzeige pro Feld (ausgef&uuml;llt/offen/unsicher)
- Konfidenz-Score f&uuml;r AI-ermittelte Werte
- "Zur Zollanmeldung &uuml;bernehmen"-Button

### Komponente 4: Browser-Extension / Overlay-Widget

**Neues Projekt:** Separates Verzeichnis `apps/extension/` oder `packages/widget/`

**Technologie-Optionen:**
- **Chrome Extension (Manifest V3)** - F&uuml;r Chrome/Edge/Brave
- **Lit Web Component** - F&uuml;r framework-agnostisches Widget
- **Shadow DOM** - Isolation vom Zollseiten-CSS

**Funktionsweise:**
```
1. User installiert Browser-Extension
2. User navigiert zur Zollseite (z.B. ATLAS/IZA)
3. Extension erkennt die Seite (URL-Pattern-Matching)
4. Sidebar-Widget &ouml;ffnet sich (wie Lucia auf LinkedIn)
5. Widget zeigt die im ZollPilot vorbereiteten Werte an
6. "Auto-Fill"-Button: Werte werden in die Zollseiten-Felder eingetragen
7. User pr&uuml;ft und best&auml;tigt
```

**Architektur der Extension:**
```
apps/extension/
├── manifest.json              # Chrome Extension Manifest V3
├── src/
│   ├── background.ts          # Service Worker
│   ├── content/
│   │   ├── content-script.ts  # In Zollseite injiziert
│   │   ├── sidebar.ts         # Sidebar-Widget (Lit/Shadow DOM)
│   │   └── autofill.ts        # DOM-Manipulation f&uuml;r Auto-Fill
│   ├── popup/
│   │   └── popup.tsx          # Extension-Popup (React)
│   └── lib/
│       ├── api-client.ts      # Kommunikation mit ZollPilot-Backend
│       └── field-mapping.ts   # Zollseiten-Felder ↔ ZollPilot-Felder
├── styles/
└── public/
    └── icons/
```

### Komponente 5: Direkte Einreichung (sp&auml;ter)

**Ans&auml;tze:**
- Browser-Extension f&uuml;llt Felder aus UND klickt "Absenden"
- Oder: Headless-Browser im Backend (Playwright) f&uuml;llt die Zollseite aus
- User-generierte E-Mail-Adresse f&uuml;r die Anmeldung auf der Zollseite

---

## 10. Empfohlene Implementierungsreihenfolge

### Phase 1: CrewAI-Backend (Fundament)

**Ziel:** AI-gest&uuml;tzte Analyse von Rechnungen und Zollanforderungen

1. CrewAI + Dependencies installieren und konfigurieren
2. Invoice Analyzer Agent: Rechnung → strukturierte Daten
3. Customs Researcher Agent: Internet-Recherche zu Zollanforderungen
4. Field Mapper Agent: Daten → Zollfelder zuordnen
5. Neuer API-Endpunkt: `POST /ai/analyze`
6. Bestehenden Prefill-Flow erweitern

**Ansatzpunkte im Code:**
- `apps/api/requirements.txt` - Dependencies erweitern
- `apps/api/app/routes/prefill.py` - Bestehende Logik als Fallback behalten
- `apps/api/app/main.py` - Neuen Router registrieren

### Phase 2: Scrollbares Popup (Frontend)

**Ziel:** Ergebnisse sichtbar und durchsuchbar machen

1. Neue Popup-Komponente mit Suche und Scroll
2. Integration in den Wizard-Flow
3. Feld-Gruppen und Konfidenz-Anzeige
4. "Zur Zollanmeldung &uuml;bernehmen"-Funktion

**Ansatzpunkte im Code:**
- `apps/web/src/app/design-system/primitives/` - Neue Primitives (Modal, Search)
- `apps/web/src/app/app/cases/[id]/wizard/` - Integration in Wizard
- `apps/web/src/app/components/` - Shared Popup-Komponente

### Phase 3: Browser-Extension / Sidebar-Widget

**Ziel:** Werte auf der Zollseite anzeigen und (test-weise) ausf&uuml;llen

1. Chrome Extension Manifest V3 aufsetzen
2. Content-Script f&uuml;r Zollseiten-Erkennung
3. Sidebar-Widget (Lit/Shadow DOM) f&uuml;r Wert-Anzeige
4. Auto-Fill: DOM-Manipulation der Zollseiten-Felder
5. API-Anbindung: Extension ↔ ZollPilot-Backend

**Ansatzpunkte im Code:**
- Neues Verzeichnis `apps/extension/`
- `apps/web/src/app/lib/api/client.ts` - API-Client als Referenz
- `apps/web/src/procedures/IZA/v1/mapping.ts` - Feld-Mappings als Basis

### Phase 4: Direkte Einreichung (Zukunft)

**Ziel:** Zollanmeldung direkt &uuml;ber die Zollseite absenden

1. Extension erweitern: "Absenden"-Automation
2. Oder: Backend-Automation mit Playwright
3. User-generierte E-Mail-Adressen
4. Ergebnis im Account speichern

---

## Zusammenfassung

ZollPilot hat ein **solides technisches Fundament** (Architektur, Multi-Tenancy, RBAC, CI/CD, Tests), aber der Kern-Wertversprechen - die intelligente, einfache Zollanmeldung - ist noch **manuell und ohne AI**. Die drei gew&uuml;nschten Hauptfeatures (CrewAI-Analyse, scrollbares Popup, Browser-Extension/Widget) existieren **noch nicht im Code**.

Der bestehende Code bietet aber eine gute Basis:
- Das Procedure-/Wizard-System ist erweiterbar
- Die API-Architektur unterst&uuml;tzt neue Endpunkte problemlos
- Das Prefill-System kann als Fallback/Basis f&uuml;r die AI-Integration dienen
- Das Feld-Mapping-System (IZA/IPK/IAA) kann f&uuml;r das Extension-Mapping wiederverwendet werden
