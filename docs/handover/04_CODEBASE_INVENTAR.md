# 04 - Codebase-Inventar

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Repository-Struktur

```
zollpilotNeu/
├── apps/                           # Anwendungen
│   ├── api/                        # FastAPI Backend
│   │   ├── app/
│   │   │   ├── main.py            # Einstiegspunkt, Middleware
│   │   │   ├── core/              # Infrastruktur
│   │   │   ├── routes/            # API-Endpunkte
│   │   │   ├── domain/            # Geschäftslogik
│   │   │   ├── services/          # Externe Dienste
│   │   │   ├── middleware/        # HTTP-Middleware
│   │   │   ├── db/                # Datenbankzugriff
│   │   │   └── dependencies/      # FastAPI DI
│   │   ├── tests/                 # Backend-Tests
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── web/                        # Next.js Frontend
│       ├── src/
│       │   ├── app/               # App Router Pages
│       │   ├── procedures/        # Verfahrens-Configs
│       │   ├── components/        # UI-Komponenten
│       │   └── navigation/        # Routing-Utilities
│       ├── tests/                 # Frontend-Tests
│       ├── public/                # Statische Assets
│       ├── Dockerfile
│       └── package.json
│
├── packages/                       # Shared Code
│   └── shared/                     # DTOs & Contracts
│       └── src/index.ts
│
├── prisma/                         # Datenbank
│   ├── schema.prisma              # Schema-Definition
│   └── migrations/                # 14 Migrationen
│
├── docs/                           # Dokumentation
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── AUTH.md
│   ├── PROCEDURES/
│   ├── SECURITY/
│   ├── sprints/
│   └── handover/                  # Diese Dokumente
│
├── scripts/                        # Utility-Skripte
│   ├── seed_articles.py
│   └── seed_knowledge.py
│
├── docker-compose.yml             # Lokale Entwicklung
├── .github/workflows/ci.yml       # CI/CD
└── .env.example                   # Umgebungsvariablen
```

---

## Zentrale Module und Verantwortlichkeiten

### Backend (`apps/api/`)

#### Core-Module (`app/core/`)

| Datei | Verantwortung | LOC |
|-------|---------------|-----|
| `config.py` | Umgebungsvariablen, Settings-Singleton | ~80 |
| `errors.py` | Error-Codes, Exception-Klassen | ~100 |
| `rbac.py` | Rollen-Hierarchie, `role_at_least()` | ~50 |
| `role_guard.py` | `require_admin()`, `require_editor()` | ~40 |
| `tenant_guard.py` | `build_tenant_where()`, `require_tenant_scope()` | ~80 |
| `security.py` | Token-Hashing, Passwort-Hashing | ~60 |
| `security_events.py` | Audit-Logging für Security-Events | ~70 |
| `logging.py` | JSON-Logging-Setup | ~40 |
| `json.py` | Custom JSON-Encoder für Pydantic | ~30 |
| `responses.py` | Standard-Response-Wrapper | ~20 |

#### Route-Module (`app/routes/`)

| Datei | Endpunkte | Auth | Bemerkung |
|-------|-----------|------|-----------|
| `auth.py` | `/auth/*` | ❌ Öffentlich | Register, Login, Logout |
| `cases.py` | `/cases/*` | ✅ Session | CRUD, Fields, Submit |
| `procedures.py` | `/procedures/*` | ✅ Session | List, Get, Validate |
| `pdf.py` | `/pdf/*` | ✅ Session | Generate, Download |
| `prefill.py` | `/prefill/*` | ✅ Session | Upload, Extract |
| `billing.py` | `/billing/*` | ✅ Session | Credits-Info |
| `checkout.py` | `/checkout/*` | ✅ Session | Stripe-Flow |
| `content.py` | `/content/*` | ❌ Öffentlich | Blog, FAQ lesen |
| `knowledge.py` | `/knowledge/*` | ❌ Öffentlich | Knowledge Base |
| `admin.py` | `/admin/*` | ✅ SYSTEM_ADMIN | Tenants, Plans |
| `admin_content.py` | `/admin/content/*` | ✅ EDITOR+ | Blog/FAQ CRUD |
| `health.py` | `/health`, `/ready` | ❌ Öffentlich | Health Probes |
| `profile.py` | `/profile` | ✅ Session | User-Profil |
| `lifecycle.py` | `/cases/{id}/submit` | ✅ Session | Case-Lifecycle |

#### Domain-Module (`app/domain/`)

| Datei | Verantwortung | Komplexität |
|-------|---------------|-------------|
| `procedures.py` | Validierungslogik, ProcedureLoader | Hoch (~460 LOC) |
| `summary.py` | Case-Summary-Formatierung | Mittel (~150 LOC) |

#### Middleware (`app/middleware/`)

| Datei | Funktion | Kritikalität |
|-------|----------|--------------|
| `session.py` | Session-Extraktion aus Cookie | Hoch |
| `rate_limit.py` | Sliding-Window Rate Limiting | Mittel |
| `request_id.py` | UUID-Generierung für Tracing | Niedrig |
| `contract_version.py` | X-Contract-Version Enforcement | Niedrig |

### Frontend (`apps/web/`)

#### App-Pages (`src/app/`)

| Pfad | Typ | Beschreibung |
|------|-----|--------------|
| `page.tsx` | Public | Landing Page |
| `login/page.tsx` | Public | Login-Formular |
| `register/page.tsx` | Public | Registrierung |
| `blog/page.tsx` | Public | Blog-Index |
| `blog/[slug]/page.tsx` | Public | Blog-Artikel |
| `faq/page.tsx` | Public | FAQ mit Akkordeon |
| `impressum/page.tsx` | Public | Impressum |
| `datenschutz/page.tsx` | Public | Datenschutz |
| `app/page.tsx` | Protected | Dashboard |
| `app/cases/page.tsx` | Protected | Case-Liste |
| `app/cases/[id]/page.tsx` | Protected | Case-Detail |
| `app/cases/[id]/wizard/page.tsx` | Protected | Wizard-Formular |
| `app/cases/[id]/summary/page.tsx` | Protected | Case-Summary |
| `app/cases/[id]/assist/page.tsx` | Protected | Assist-Modus |
| `app/billing/page.tsx` | Protected | Billing-Übersicht |
| `app/profile/page.tsx` | Protected | User-Profil |
| `admin/page.tsx` | Admin | Admin-Dashboard |
| `admin/tenants/page.tsx` | Admin | Mandanten-Liste |
| `admin/tenants/[id]/page.tsx` | Admin | Mandanten-Detail |
| `admin/plans/page.tsx` | Admin | Tarife |
| `admin/events/page.tsx` | Admin | Event-Log |
| `admin/content/blog/page.tsx` | Editor | Blog-Verwaltung |
| `admin/content/faq/page.tsx` | Editor | FAQ-Verwaltung |

#### Procedure-Configs (`src/procedures/`)

| Pfad | Inhalt |
|------|--------|
| `types.ts` | TypeScript-Definitionen |
| `index.ts` | Registry, `getProcedureConfig()` |
| `IZA/v1/meta.ts` | IZA-Metadaten |
| `IZA/v1/steps.ts` | IZA-Schritte und Felder |
| `IZA/v1/mapping.ts` | IZA-Feldzuordnungen |
| `IZA/v1/hints.ts` | IZA-Feld-Erklärungen |
| `IPK/v1/*` | IPK-Konfiguration |
| `IAA/v1/*` | IAA-Konfiguration |

#### Komponenten (`src/components/`)

| Komponente | Typ | Verwendung |
|------------|-----|------------|
| `AuthForm.tsx` | Client | Login/Register |
| `Landing.tsx` | Server | Landing Page |
| `PublicLayout.tsx` | Server | Öffentliche Seiten |
| `ErrorBanner.tsx` | Client | Fehleranzeige |
| `LoadingState.tsx` | Client | Ladeindikator |
| `MDXContent.tsx` | Client | Markdown-Rendering |
| `TopBar/` | Verzeichnis | Header-Komponenten |
| `Sidebar/` | Verzeichnis | Sidebar-Navigation |
| `Dashboard/` | Verzeichnis | Dashboard-Widgets |
| `guards/AdminGuard.tsx` | Client | Admin-Schutz |
| `design-system/` | Verzeichnis | UI-Primitives |

---

## Konsistenz von Benennung und Struktur

### Positiv ✅

| Aspekt | Bewertung |
|--------|-----------|
| **Backend-Struktur** | Konsistent: `routes/`, `core/`, `domain/` |
| **API-Endpunkte** | RESTful: `/cases`, `/cases/{id}`, `/cases/{id}/fields` |
| **Datei-Benennung** | snake_case für Python, PascalCase für TSX |
| **TypeScript-Typen** | Zentral in `procedures/types.ts` |
| **Error-Codes** | Konsistent UPPER_SNAKE_CASE |

### Inkonsistent ⚠️

| Problem | Beispiele |
|---------|-----------|
| **Deutsch/Englisch gemischt** | `geschaeftsart` (DE) vs. `content_description` (EN) |
| **Komponenten-Struktur** | Manche in Verzeichnissen, manche einzeln |
| **Test-Benennung** | `test_*.py` vs. `*.test.tsx` (framework-bedingt) |
| **Config-Pfade** | `app/core/config.py` vs. `next.config.js` (Root) |

---

## Trennung von Zuständigkeiten

### Gut getrennt ✅

```
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION (Web)                      │
│  - React Components                                        │
│  - Styling (TailwindCSS)                                  │
│  - Client-State (useState, useReducer)                    │
└───────────────────────────────────────────────────────────┘
                            │
                            │ HTTP API (JSON)
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    APPLICATION (API)                       │
│  - Routes (HTTP-Handling)                                 │
│  - Domain (Geschäftslogik)                               │
│  - Core (Infrastruktur)                                   │
└───────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌───────────────────────────────────────────────────────────┐
│                    PERSISTENCE (DB)                        │
│  - PostgreSQL                                             │
│  - Schema (Prisma)                                        │
│  - Migrationen                                            │
└───────────────────────────────────────────────────────────┘
```

### Verbesserungspotenzial ⚠️

| Bereich | Problem | Empfehlung |
|---------|---------|------------|
| **Frontend Domain** | Procedure-Validierung teils client-seitig dupliziert | Nur Server validieren |
| **API Response** | Manche Routen geben raw data, andere wrapped | Immer `{ data: ... }` |
| **Error Handling** | Inconsistent zwischen Routen | Zentrale Error-Middleware |

---

## Refactoring-Kandidaten

### Hohe Priorität 🔴

#### 1. `app/domain/procedures.py` (460 LOC)

**Problem:** Monolithische Datei mit Loader, Validator und Business Rules

**Empfehlung:**
```
domain/
├── procedures/
│   ├── __init__.py
│   ├── loader.py          # ProcedureLoader
│   ├── validator.py       # ProcedureValidator
│   └── rules/
│       ├── iza.py         # IZA-spezifische Regeln
│       ├── ipk.py         # IPK-spezifische Regeln
│       └── iaa.py         # IAA-spezifische Regeln
```

#### 2. `app/routes/cases.py` (~400 LOC)

**Problem:** Zu viele Verantwortlichkeiten

**Empfehlung:** Aufteilen in:
- `cases_crud.py` - CRUD-Operationen
- `cases_fields.py` - Feld-Management
- `cases_lifecycle.py` - Status-Übergänge (existiert teils)

### Mittlere Priorität 🟡

#### 3. Wizard-Komponenten

**Problem:** `WizardClient.tsx` ist sehr groß

**Empfehlung:**
```
wizard/
├── WizardContainer.tsx    # State-Management
├── WizardSidebar.tsx      # Navigation
├── WizardForm.tsx         # Formular-Container
├── fields/
│   ├── TextField.tsx
│   ├── NumberField.tsx
│   ├── SelectField.tsx
│   └── CountryField.tsx
└── hooks/
    ├── useWizardState.ts
    └── useAutoSave.ts
```

#### 4. Middleware-Konfiguration

**Problem:** Middleware-Setup in `main.py` vermischt mit App-Setup

**Empfehlung:** Eigene `middleware/__init__.py` mit `setup_middleware(app)`

### Niedrige Priorität 🟢

#### 5. Test-Utilities

**Problem:** Duplicate Test-Setup-Code

**Empfehlung:** Gemeinsames `tests/conftest.py` mit Fixtures

#### 6. Type-Definitionen

**Problem:** Einige Typen inline definiert

**Empfehlung:** Zentrale `types/` Verzeichnisse

---

## Toter Code, Platzhalter, TODOs

### Potentiell toter Code

| Datei | Code | Bemerkung |
|-------|------|-----------|
| `CaseField.value_text` | Schema-Feld | Nie verwendet, war für Fulltext-Suche gedacht |
| `seed_articles.py` | Seeding-Skript | Unklar ob ausgeführt |
| `seed_knowledge.py` | Seeding-Skript | Unklar ob ausgeführt |

### Platzhalter

| Datei | Platzhalter | Kontext |
|-------|-------------|---------|
| `checkout.py:28` | `STRIPE_WEBHOOK_SECRET=""` | Default leer |
| `.env.example` | `SESSION_SECRET=change-me` | Sicherheitsrisiko wenn nicht geändert |

### Bekannte TODOs (aus KNOWN_GAPS.md)

| ID | Beschreibung | Priorität |
|----|--------------|-----------|
| TD-001 | In-Memory Rate Limit → Redis | 🔴 |
| TD-002 | Stripe Payment Integration | 🔴 |
| TD-003 | Redis Session Store | 🔴 |
| TD-004 | Sentry Error Tracking | 🟡 |
| TD-005 | Transaktions-E-Mails | 🟡 |
| TD-008 | E2E-Tests (Playwright) | 🟡 |

---

## Dateien nach Wichtigkeit

### Kritische Dateien (Änderungen mit höchster Vorsicht)

| Datei | Grund |
|-------|-------|
| `prisma/schema.prisma` | Schema-Änderungen erfordern Migrationen |
| `app/core/security.py` | Authentifizierungslogik |
| `app/core/tenant_guard.py` | Tenant-Isolation |
| `app/middleware/session.py` | Session-Handling |
| `app/domain/procedures.py` | Validierungslogik |

### Wichtige Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Lokale Entwicklung |
| `.github/workflows/ci.yml` | CI/CD Pipeline |
| `apps/api/requirements.txt` | Python-Dependencies |
| `apps/web/package.json` | Node-Dependencies |
| `apps/web/next.config.js` | Next.js-Konfiguration |

### Häufig anzupassende Dateien

| Datei | Anpassungsgrund |
|-------|-----------------|
| `procedures/*/steps.ts` | Neue Felder hinzufügen |
| `procedures/*/hints.ts` | Erklärungstexte anpassen |
| `routes/*.py` | Neue Endpunkte |
| `components/*.tsx` | UI-Änderungen |

---

## Code-Statistiken

| Metrik | Wert |
|--------|------|
| Python-Dateien (API) | 36 |
| TypeScript-Dateien (Web) | ~125 |
| Test-Dateien (Backend) | 24 |
| Test-Dateien (Frontend) | 51+ |
| Prisma-Modelle | 20+ |
| API-Route-Module | 13 |
| Dokumentations-Dateien | 80+ |

### Größte Dateien

| Datei | LOC | Bemerkung |
|-------|-----|-----------|
| `procedures.py` | ~460 | Refactoring-Kandidat |
| `cases.py` | ~400 | Refactoring-Kandidat |
| `WizardClient.tsx` | ~350 | Komplex aber strukturiert |
| `schema.prisma` | ~480 | Vollständiges Schema |
