# Architecture

> **🏗️ Sprint 1 Stable (v1.0.0)** – Architektur ist eingefrorern und stabil.
> Änderungen erfordern ADR in [DECISIONS.md](./DECISIONS.md).

---

## Produktpositionierung & Haftungsabgrenzung

ZollPilot ist ein **Vorbereitungstool** für Zollanmeldungen. Die Plattform:

- **Bereitet vor**: Geführte Datenerfassung, Validierung, formatierte Übersichten
- **Führt NICHT durch**: Keine Übermittlung an Zollbehörden, kein ATLAS-Zugang
- **Erstellt Ausfüllhilfen**: PDFs zeigen wo welche Angaben einzutragen sind

**Haftungsabgrenzung:**
- ZollPilot übermittelt keine Daten an Zollbehörden
- Die eigentliche Zollanmeldung liegt in der Verantwortung des Nutzers
- Die Richtigkeit der eingegebenen Daten verantwortet der Nutzer

---

## Layers

1. **Database (PostgreSQL + Prisma)**
   - Owns schema and migrations
   - No business logic

2. **API (FastAPI)**
   - Owns business logic and orchestration
   - Exposes HTTP interfaces
   - No UI responsibilities

3. **Frontend (Next.js)**
   - Owns presentation and user experience
   - No business logic

## Boundaries

- The API is strictly separated from the frontend to keep the backend reusable
  for future mobile clients.
- Shared contracts live in `packages/shared` to keep API/FE alignment explicit.
- Frontend talks only to the API, never directly to the database.

## Designsystem & UI Layer

Das Frontend nutzt ein zentrales, austauschbares Design System.

### Struktur

```
apps/web/src/app/design-system/
├── tokens.css          # CSS Custom Properties (Farben, Typo, Spacing)
├── base.css            # Reset, Typografie-Defaults
├── index.ts            # Export-Datei
└── primitives/         # Wiederverwendbare UI-Komponenten
    ├── Button.tsx
    ├── Badge.tsx
    ├── Card.tsx
    ├── Alert.tsx
    ├── Section.tsx
    ├── PageShell.tsx
    └── Stepper.tsx
```

### Design-Prinzipien

1. **Token-basiert**: Alle Styles nutzen CSS-Variablen
2. **Austauschbar**: Rebranding durch Anpassen von `tokens.css`
3. **Deutsch-first**: Alle UI-Texte auf Deutsch
4. **Barrierefrei**: Focus-Styles, ARIA-Labels, Kontrast

### Stilrichtung

- **Ästhetik**: Ruhig, modern, SaaS/GovTech
- **Farben**: Helle Hintergründe, grüne Primärfarbe
- **Layout**: Viel Weißraum, klare Hierarchie

Siehe [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) für Details.

## Public Pages & SEO

Die öffentlichen Seiten (Landing, Blog, FAQ) nutzen das Design System v1 und sind für Suchmaschinen optimiert.

### Seitenstruktur

| Route | Beschreibung | Indexiert |
|-------|--------------|-----------|
| `/` | Landing Page mit Hero, Features, CTA | ✓ |
| `/blog` | Blog-Index (API-basiert) | ✓ |
| `/blog/[slug]` | Blog-Artikel | ✓ |
| `/faq` | FAQ-Index mit Akkordeon-Antworten | ✓ |
| `/impressum` | Impressum | ✓ |
| `/datenschutz` | Datenschutzerklärung | ✓ |
| `/app/*` | App-Bereich | ✗ |
| `/admin/*` | Admin-Bereich | ✗ |

**Hinweis:** FAQ hat keine Einzelseiten mehr (`/faq/[slug]`). Antworten werden inline im Akkordeon-Stil angezeigt.

### SEO-Implementierung

- **Sitemap**: Auto-generiert unter `/sitemap.xml`
  - Statische Seiten (/, /blog, /faq, /impressum, /datenschutz, /login, /register)
  - Dynamische Blog-Posts (aus API, nur PUBLISHED)
  - Keine FAQ-Einzelseiten (Antworten inline auf /faq)
  - Revalidierung: stündlich (1h Cache)
- **robots.txt**: Erlaubt öffentliche Seiten, blockiert `/app`, `/admin`, `/api`
- **Meta-Tags**: Per-Page `title`, `description`, Open Graph
- **Canonical URLs**: Selbstreferenzierend pro Seite

### Vertrauen & Wording

Die öffentlichen Seiten kommunizieren klar die Produktgrenzen:

- **Globaler Disclaimer im Footer**: „ZollPilot bereitet Zollanmeldungen vor. Die eigentliche Anmeldung führen Sie selbst durch."
- **Impressum**: Vollständige Anbieterkennzeichnung gemäß § 5 TMG
- **Kein Behörden-Framing**: Keine irreführenden Aussagen über offizielle/amtliche Funktionen

Siehe [WORDING_GUIDE.md](./WORDING_GUIDE.md) für erlaubte/verbotene Begriffe.

### Content-Workflow

Blog- und FAQ-Inhalte werden in PostgreSQL gespeichert und über die API bereitgestellt:

- `BlogPost`: Titel, Slug, Excerpt, Content (MDX), Status (DRAFT/PUBLISHED)
- `FaqEntry`: Frage, Antwort, Kategorie, Reihenfolge, Status

Siehe [CONTENT_MODEL.md](./CONTENT_MODEL.md) für das Datenmodell.
Siehe [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) für Formatierung und SEO-Regeln.

## App UI Layer (Designsystem v1)

Der App-Bereich (`/app/*`) nutzt das gleiche Design System wie die öffentlichen Seiten, mit spezialisierten Komponenten für den Anwendungskontext.

### App Shell

Die `AppShell`-Komponente (`apps/web/src/app/app/components/AppShell.tsx`) bildet das Layout für alle App-Seiten:

- **Header**: Logo, Navigation (Übersicht, Fälle, Abrechnung), Abmelden
- **Main**: Seiteninhalt
- **Footer**: Copyright, rechtliche Links

### Dashboard (`/app`)

- **Aktive Fälle**: Card mit den letzten 5 Fällen
- **Credits**: Aktueller Kontostand
- **Schnellaktionen**: Buttons für häufige Aufgaben
- **Anleitung**: "So funktioniert's" Schritte

### Cases (`/app/cases`)

- **Filter-Tabs**: Aktive / Archivierte Fälle
- **Case-Liste**: Cards mit Status-Badge, Datum
- **Leerer State**: Freundlicher Hinweis + CTA

### Wizard (`/app/cases/[id]/wizard`)

| Komponente | Funktion |
|------------|----------|
| `Stepper` | Horizontaler Fortschritt (Schritte) |
| `Card` | Gruppierung der Formularfelder |
| `Alert` | Validierungsfehler (Warning) |
| `Button` | Zurück / Prüfen / Weiter / Einreichen |

**States:**
- Readonly-Banner bei eingereichten Fällen
- Feld-Autosave mit Status (Speichern, Gespeichert, Fehler)
- Validierungsfehler pro Feld und pro Schritt

### Summary (`/app/cases/[id]/summary`)

- **Zwei-Spalten-Layout**: Inhalt links, Meta-Sidebar rechts
- **Sections**: Kategorisierte Label/Wert-Paare
- **Info-Banner**: Rechtlicher Hinweis
- **PDF-Export**: Button mit Credit-Prüfung, Loading-State

## Admin UI Layer (Designsystem v1)

Der Admin-Bereich (`/admin/*`) nutzt das gleiche Design System mit einem professionellen, zurückhaltenden Stil.

### Admin Shell

Die `AdminShell`-Komponente (`apps/web/src/app/admin/components/AdminShell.tsx`) bildet das Layout:

- **Header**: Titel „Administration", Navigation (Übersicht, Mandanten, Tarife)
- **Footer**: Hinweis „Nur für autorisierte Benutzer"

### Admin Dashboard (`/admin`)

- **Navigations-Cards**: Links zu Mandanten und Tarife
- **Beschreibende Texte**: Erklärung der Funktionen

### Mandanten (`/admin/tenants`)

| Spalte | Beschreibung |
|--------|--------------|
| Mandant | Name der Organisation |
| Tarif | Aktueller Plan-Code (Badge) |
| Guthaben | Credits-Stand |
| Erstellt am | Registrierungsdatum |
| Aktionen | Link zu Details |

### Mandanten-Detail (`/admin/tenants/[id]`)

**Cards:**
- **Tarif**: Aktueller Plan, Dropdown zur Zuweisung
- **Guthaben**: Credits-Anzeige, Formular zur Vergabe

**Tabelle: Guthaben-Historie**
- Datum, Änderung (+/-), Grund (Badge), Hinweis

### Tarife (`/admin/plans`)

| Spalte | Beschreibung |
|--------|--------------|
| Code | Eindeutiger Bezeichner |
| Name | Anzeigename |
| Intervall | Monatlich/Jährlich/Einmalig |
| Preis | Preis in EUR |
| Status | Aktiv/Inaktiv (Badge) |
| Aktionen | Aktivieren/Deaktivieren |

**Erstellungsformular:**
- Code, Name, Intervall, Preis
- Labels über Inputs, Hilfetexte dezent

### Content Admin (`/admin/content/*`)

Der Content-Admin-Bereich ermöglicht die Verwaltung von Blog-Artikeln und FAQ-Einträgen.

**Zugriff:** EDITOR, ADMIN, OWNER, SYSTEM_ADMIN (Role ≥ EDITOR)

**Blog (`/admin/content/blog`):**
- **Liste**: Alle Artikel mit Status-Filter (Alle/Entwürfe/Veröffentlicht)
- **Editor**: Titel, Slug, Excerpt, MDX-Inhalt, SEO-Metadaten
- **Actions**: Speichern, Veröffentlichen, Zurückziehen, Löschen

**FAQ (`/admin/content/faq`):**
- **Liste**: Alle Einträge mit Status-Filter und Kategorie-Anzeige
- **Editor**: Frage, Antwort (MDX), Kategorie, Reihenfolge
- **Actions**: Speichern, Veröffentlichen, Zurückziehen, Löschen

**Draft/Publish Workflow:**
- Neue Inhalte starten als DRAFT
- Veröffentlichen setzt Status auf PUBLISHED und published_at
- Zurückziehen setzt Status auf DRAFT

Siehe `docs/ADMIN_CONTENT.md` für Details.

### Verwendete Primitives

Alle App-Komponenten nutzen die Design-System-Primitives:

- `Section` – Seitencontainer mit max-width
- `Card` – Content-Container
- `Button` – Primär, Sekundär, Ghost
- `Badge` – Status (Entwurf, Eingereicht, Archiviert)
- `Alert` – Info, Warning, Error
- `Stepper` – Wizard-Fortschritt

## Auth Flow (text)

1. Client sends `POST /auth/register` or `POST /auth/login`.
2. API validates credentials and creates a DB session.
3. API sets an HTTP-only session cookie.
4. Client uses the cookie for subsequent requests.
5. API resolves the session and enforces RBAC.

## RBAC

- RBAC is enforced exclusively in the backend.
- Role hierarchy: `SYSTEM_ADMIN > OWNER > ADMIN > EDITOR > USER`
- **SYSTEM_ADMIN**: ZollPilot internal, full system access (plans, all tenants, content)
- **EDITOR**: Content management only (blog, FAQ), no system admin access
- **OWNER/ADMIN/USER**: Tenant-scoped access only

### User vs. Admin Separation

| Context | Routes | Roles |
|---------|--------|-------|
| User | `/app/*` | All authenticated users |
| Content Admin | `/admin/content/*` | EDITOR, ADMIN, OWNER, SYSTEM_ADMIN |
| System Admin | `/admin/*` (except content) | SYSTEM_ADMIN only |

Admin endpoints return 403 (not 401) for authenticated non-admin users.

See `docs/AUTH.md` for complete role documentation.

## API Contracts

- Contract versioning is enforced via `X-Contract-Version`.
- Standard response shapes are documented in `docs/API_CONTRACTS.md`.

## Data Models

### User & Tenant Model

Das Datenmodell unterscheidet zwischen Privat- und Unternehmensnutzern.

**User**:
- id, email, password_hash
- user_type: PRIVATE | BUSINESS
- status: ACTIVE | DISABLED
- created_at, last_login_at

**UserType**:
- `PRIVATE`: Privatnutzer ohne Unternehmensbezug
- `BUSINESS`: Unternehmensnutzer mit Mandantenzugehörigkeit

**UserStatus**:
- `ACTIVE`: Aktiver Nutzer (kann sich einloggen)
- `DISABLED`: Deaktivierter Nutzer (Login gesperrt)

**Tenant** (Mandant):
- id, name, type
- plan_id, plan_activated_at
- created_at

**TenantType**:
- `BUSINESS`: Unternehmens-/Firmenmandant

**Beziehungen**:
- BUSINESS-User gehören zu genau einem Tenant (via Membership)
- PRIVATE-User können ohne Tenant existieren
- Ein Tenant kann mehrere User haben

**UserEvent** (Historie):
- id, user_id, type, created_at, metadata_json

**UserEventType**:
| Event | Beschreibung |
|-------|--------------|
| `REGISTERED` | Nutzer hat sich registriert |
| `LOGIN` | Erfolgreicher Login |
| `LOGOUT` | Logout durchgeführt |
| `PASSWORD_RESET` | Passwort wurde zurückgesetzt |
| `STATUS_CHANGED` | Status geändert (ACTIVE ↔ DISABLED) |
| `PURCHASE` | Kauf getätigt |
| `CREDIT_USED` | Credits verwendet (z.B. PDF-Export) |
| `PLAN_CHANGED` | Tarif wurde geändert |

Die UserEvent-Tabelle protokolliert wichtige Nutzeraktionen für Audit, Analyse und Nachvollziehbarkeit. Alle Events sind read-only und werden über die Admin-Historie (`/admin/events`) einsehbar.

### Case + CaseField Architecture

The Case model represents a customs/import process container. CaseField provides
a generic key-value storage layer that enables flexible data collection.

**Case** (tenant-scoped):
- id, tenant_id, created_by_user_id
- title, status (DRAFT | SUBMITTED | ARCHIVED)
- created_at, updated_at, archived_at

**CaseField** (wizard-ready):
- case_id + key (unique constraint)
- value_json (JSONB for arbitrary data)
- value_text (optional, for full-text search)

### User Interface Layer
- **Next.js App Router**: Server components for data fetching, Client components for interactivity.
- **Design System**: Atomic components (Button, Card, Input).
- **Preparation UI Layer (Assist Flow)**:
  - Specialized view mode (`/assist`) optimized for data transfer.
  - No business logic; purely strict view-only presentation of valid data.
  - Client-side state for tracking "copied" status (ephemeral).

### API Layer
This design supports:
1. **Procedures/Wizards**: Different procedures can define different field schemas
2. **Autosave**: Fields can be saved individually without full case updates
3. **Validation**: Field schemas can be enforced at the API layer per procedure
4. **Search**: value_text enables full-text search across field contents

### Procedure Engine v1 (Configuration-Driven)

The Procedure Engine enables customs processes (IZA, IPK, IAA) to be defined
as data rather than UI code. This allows:
- Adding new procedures without code changes
- Versioning procedures for compliance
- Server-side validation independent of UI

**Why Config-Driven?**
1. **Regulatory Changes**: Customs rules change; data is easier to update
2. **Multi-Version Support**: Old cases keep their original procedure version
3. **Separation of Concerns**: Business logic in data, not scattered in UI
4. **Testability**: Procedure definitions can be unit tested

**Procedure** (definition container):
- id, code (e.g., "IZA"), name, version
- is_active (soft disable without deletion)
- Unique constraint: (code, version)

**ProcedureStep** (wizard step):
- procedure_id, step_key (e.g., "package", "person")
- title, order, is_active
- Groups related fields together

**ProcedureField** (form field definition):
- procedure_step_id, field_key
- field_type: TEXT | NUMBER | SELECT | COUNTRY | CURRENCY | BOOLEAN
- required, config_json (placeholder, options, min/max, etc.)
- order

**Case Binding**:
- Case has optional procedure_id + procedure_version
- Binding locks the case to a specific procedure version
- Validation only runs against bound procedure

**Validation Engine**:
- Validates CaseFields against ProcedureFields
- Checks: required fields, type constraints, config rules
- Returns structured errors: { stepKey, fieldKey, message }

See `docs/PROCEDURES.md` for implementation details.

### Wizard Renderer v1 (Frontend)

The Wizard Renderer is a generic, procedure-driven UI component that dynamically renders forms based on procedure definitions. It maintains strict separation between the rendering layer and the procedure engine.

**Key Principles:**

1. **No Procedure-Specific Code**: The wizard renders any procedure without custom UI logic
2. **Config-Driven**: All labels, validation, and behavior come from procedure definitions
3. **Autosave**: Fields are automatically persisted with debounced saves
4. **Progressive Validation**: Errors shown inline, not blocking navigation

**Components:**

- `WizardClient`: Main orchestrator - loads case, procedure, manages state
- `StepSidebar`: Navigation with progress indication and error badges
- `FieldRenderer`: Generic field component that maps `field_type` to input components
- `ProcedureSelector`: Shown when case has no bound procedure

**Field Type Mapping:**

| field_type | UI Component | Notes |
|------------|--------------|-------|
| TEXT | `<input type="text">` | Supports maxLength, placeholder |
| NUMBER | `<input type="number">` | Supports min, max, step |
| BOOLEAN | `<input type="checkbox">` | Custom label from config |
| SELECT | `<select>` | Options from config.options |
| COUNTRY | `<select>` | Predefined ISO country list |
| CURRENCY | `<select>` | Predefined ISO currency list |

**Data Flow:**

1. Load case → check for bound procedure
2. If no procedure → show ProcedureSelector → bind via API
3. Load procedure definition → render steps/fields
4. On field change → debounce (500ms) → PUT /cases/{id}/fields/{key}
5. On step change or button click → POST /cases/{id}/validate
6. Display validation errors inline

**State Management:**

- Field values: Local state, synced via autosave
- Save status per field: idle | saving | saved | error
- Validation errors: Stored and mapped to fields/steps

**Why Separated from Procedure Engine?**

The Wizard Renderer is intentionally decoupled from the backend Procedure Engine:
- Backend: Defines rules, validates data, owns business logic
- Frontend: Renders UI, handles UX, manages local state
- This allows swapping the wizard UI without touching backend logic

### Billing/Credits (No-Payment Foundation)

The billing system provides plan management and credit tracking without payment
processing. This foundation enables future monetization.

**Plan**:
- id, code (unique, e.g., "FREE", "BASIC")
- name, is_active
- price_cents, currency (informational only)
- interval (ONE_TIME | YEARLY | MONTHLY | NONE)

**Tenant Plan Assignment**:
- Tenant has optional plan_id + plan_activated_at
- Default: FREE plan on tenant creation (via migration seed)

**Credits System**:
- `TenantCreditBalance`: Single row per tenant with current balance
- `CreditLedgerEntry`: Immutable audit log of all balance changes
  - delta (+/- amount)
  - reason (e.g., "ADMIN_GRANT", "PDF_EXPORT")
  - metadata_json (optional context like caseId, note)
  - created_by_user_id (who triggered)

**Why a Ledger?**
- Audit trail for compliance
- Debugging balance discrepancies
- Foundation for usage analytics
- Supports future features: refunds, reversals, expiration

**Credit Operations**:
- Grant (admin): +N credits, reason="ADMIN_GRANT"
- Consume (future): -1 credit per action, reason="ACTION_NAME"

Balance updates are atomic: ledger entry + balance update in same operation.

### Case Lifecycle & Versioning

The Case Lifecycle defines a clear state machine for case progression with immutable snapshots for compliance and auditability.

**Case States:**
- **DRAFT**: Case is being edited
  - Fields can be updated
  - Validation can be run
  - Submit is allowed (only if validation passes)
- **SUBMITTED**: Case has been submitted
  - Fields are read-only (updates blocked with 409 CASE_NOT_EDITABLE)
  - A snapshot exists with the submitted data
  - Validation is read-only
- **ARCHIVED**: Case is archived
  - Fully read-only
  - No submit allowed

**Case Fields (extended):**
- `version` (int, default 1): Incremented on reopen (future feature)
- `submitted_at` (nullable datetime): Timestamp of submission

**CaseSnapshot (immutable record):**
- `id` (UUID)
- `case_id` (UUID, indexed)
- `version` (int, matches case.version at submission time)
- `procedure_code`, `procedure_version`: The procedure definition used
- `fields_json` (JSONB): Complete snapshot of all CaseFields at submission
- `validation_json` (JSONB): Validation result at submission time
- `created_at`

Unique constraint: `(case_id, version)` ensures one snapshot per version.

**Submit Flow:**
1. Validate case fields against procedure
2. If invalid → 409 CASE_INVALID with error details
3. Create CaseSnapshot (fields + validation result)
4. Set case.status = SUBMITTED, case.submitted_at = now
5. Return snapshot info

Submit is idempotent: calling on already-submitted case returns existing snapshot.

**Why Snapshots?**
- Legal compliance: Immutable record of what was submitted
- Audit trail: Track exactly what data was valid at submission
- Version history: Future reopens create new versions with separate snapshots
- Debugging: Compare submitted data vs current state

### Hero-Flow IZA v1

The IZA (Internetbestellung - Import Zollanmeldung) is the first production-ready procedure implementing a complete end-to-end customs declaration flow.

**Flow Overview:**
1. User creates a new case
2. User selects IZA procedure in wizard
3. Wizard guides through 4 steps: Package → Sender → Recipient → Additional Info
4. Validation runs IZA-specific business rules (origin ≠ DE, recipient = DE, etc.)
5. User submits case (only if valid)
6. Summary page shows formatted, human-readable output

**Key Components:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wizard    │────▶│ Validation  │────▶│   Submit    │
│  (4 Steps)  │     │   Engine    │     │  + Snapshot │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │ IZA Rules   │     │   Summary   │
                    │ (Business)  │     │  Formatter  │
                    └─────────────┘     └─────────────┘
```

**IZA Business Rules:**
- `origin_country ≠ DE`: Imports must come from outside Germany
- `sender_country ≠ DE`: Sender must be outside Germany
- `recipient_country = DE`: Import destination must be Germany
- `value_amount > 0`: Declared value must be positive
- `commercial_goods = true → remarks required`: Commercial imports need explanation

**Summary Formatting:**
The summary endpoint (`GET /cases/{id}/summary`) returns procedure-specific formatted output:
- Country codes → Full names (DE → Deutschland)
- Currency amounts → Formatted with symbol (150.00 EUR → 150,00 €)
- Booleans → Ja/Nein
- Grouped into logical sections

**Future Extensions:**
- HSCode lookup integration
- Duty/VAT calculation preview

### Document Generation (PDF)

The PDF generation system produces legally compliant, reproducible documents from submitted cases.

**Why Snapshot-Based?**
- **Immutability**: PDF always reflects the exact data at submission time
- **Reproducibility**: Same snapshot = same PDF content (timestamps excluded)
- **Legal Compliance**: Document represents official submission state
- **Audit Trail**: Request ID embedded in PDF footer

**PDF Service Components:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Snapshot   │────▶│   Summary   │────▶│    HTML     │
│   (JSON)    │     │  Generator  │     │  Template   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  WeasyPrint │────▶ PDF
                                        │  (Renderer) │
                                        └─────────────┘
```

**Technical Stack:**
- **Jinja2**: HTML template rendering with case data
- **WeasyPrint**: HTML → PDF conversion with CSS styling
- **DIN A4**: Standard European document format

**PDF Contents:**
1. **Header**: ZollPilot branding, generation timestamp (UTC), request ID
2. **Case Info**: Case ID (truncated), version, procedure code/version
3. **Sections**: All summary sections with label-value pairs (formatted)
4. **Footer**: Legal disclaimer, page numbers

**Credit Integration:**
- PDF export consumes 1 credit per download
- Credit is deducted only on successful generation
- Ledger entry created with `reason: "PDF_EXPORT"` and case metadata

**Flow:**
1. Validate preconditions (SUBMITTED status, snapshot exists, credits ≥ 1)
2. Fetch latest snapshot
3. Generate summary from snapshot data
4. Render HTML template with summary
5. Convert HTML → PDF via WeasyPrint
6. Deduct credit + create ledger entry
7. Stream PDF response with `Content-Disposition: attachment`

**Error Handling:**
- `CASE_NOT_SUBMITTED`: Case must be submitted first
- `NO_SNAPSHOT`: Submit creates snapshot; rare edge case
- `INSUFFICIENT_CREDITS`: User must acquire credits first

**Future Extensions:**
- Multiple document templates (customs form, invoice)
- Batch PDF generation
- PDF signing/timestamping

### Content & SEO Layer

The content system provides a public-facing blog and FAQ section for SEO and user education. Content is stored in PostgreSQL and served via read-only API endpoints.

**Design Principles:**
- **Database-Driven**: Content stored in PostgreSQL with Prisma ORM
- **Draft/Publish Workflow**: ContentStatus enum (DRAFT | PUBLISHED)
- **SEO Optimized**: Proper meta tags, canonical URLs, sitemap
- **Crawlable**: Public pages indexed; app/admin excluded
- **Trust-First**: Clear separation of explanation, instruction, and product boundaries

**Content Type Separation:**

| Type | Purpose | Example |
|------|---------|---------|
| Erklärung | Background knowledge | "Was ist eine Zollanmeldung?" |
| Anleitung | Step-by-step guidance | "So bereitest du deine Daten vor" |
| Produktgrenzen | What ZollPilot does NOT do | "ZollPilot übermittelt keine Daten" |

This separation ensures content never conflates educational information with product promises.
See `docs/WORDING_GUIDE.md` for allowed/forbidden terminology.

**Architecture:**

```
┌─────────────────┐
│   PostgreSQL    │  ← BlogPost, FaqEntry models
│   (Prisma ORM)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI API    │  ← GET /content/blog, /content/blog/{slug}, /content/faq
│  (Read-only)    │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Next.js Pages  │  ← /blog, /blog/[slug], /faq (no /faq/[slug])
│  (SSR)          │
└─────────────────┘
```

**Data Models:**

- **BlogPost**: id, title, slug, excerpt, content (MDX), status, published_at, meta_title, meta_description
- **FaqEntry**: id, question, answer (MDX), category, order_index, status, related_blog_post_id
- **ContentStatus**: DRAFT | PUBLISHED

**API Endpoints (Public, no auth required):**

| Endpoint | Description |
|----------|-------------|
| `GET /content/blog` | List published blog posts |
| `GET /content/blog/{slug}` | Get single blog post by slug |
| `GET /content/faq` | List FAQ entries grouped by category |

**SEO Implementation:**
- **sitemap.xml**: Auto-generated from content + static pages
- **robots.txt**: Allows /, /blog/*, /faq/*; Disallows /app/*, /admin/*, /api/*
- **Meta Tags**: Per-page title, description, Open Graph
- **Canonical URLs**: Self-referencing canonical for each page

**URL Structure:**

| Path | Description | Indexed |
|------|-------------|---------|
| `/` | Landing page | ✓ |
| `/blog` | Blog index | ✓ |
| `/blog/[slug]` | Blog article | ✓ |
| `/faq` | FAQ index (accordion) | ✓ |
| `/app/*` | App routes | ✗ |
| `/admin/*` | Admin routes | ✗ |

**Note:** FAQ no longer has individual `/faq/[slug]` pages. Answers are shown inline with accordions on the main FAQ page.

**Content Workflow:**
1. Create content in database with `status: DRAFT`
2. Preview using admin tools (future feature)
3. Publish by setting `status: PUBLISHED` and `published_at`
4. Content automatically appears on public pages

See `docs/CONTENT_MODEL.md` for detailed data model documentation.
See `docs/CONTENT_GUIDE.md` for authoring guidelines.

#### Preparation vs. Execution Boundary

ZollPilot operates strictly in the **Preparation Layer**.
- **Internal**: Input validation, data structuring, PDF generation.
- **External Boundary**: The system output conforms to customs requirements (field formats, codes) but stops *before* technical transmission.
- **Execution**: Performed manually by the user via external systems (IZA Portal).

This boundary must be maintained in all architectural decisions—no modules should attempt to implement ATLAS protocols without a major strategic shift and compliance review.

### Observability & Error Handling

The platform implements consistent observability patterns for debugging, monitoring, and support.

**Error Taxonomy:**

All errors use centrally defined codes (`app/core/errors.py`):
- Consistent error codes across all endpoints
- Standard error response format with `code`, `message`, `details`
- User-friendly default messages in German
- HTTP status mapping per error code

**Request Tracing:**

```
Request → RequestIdMiddleware → Generate UUID → Attach to State
                                     ↓
                              Response Header (X-Request-Id)
                                     ↓
                              Error Response (requestId)
                                     ↓
                              Structured Logs (request_id)
                                     ↓
                              PDF Footer (Request-Id)
```

**Structured Logging:**

All logs are JSON-formatted for observability platforms:

```json
{
  "timestamp": "2026-01-26T10:30:00Z",
  "level": "INFO",
  "request_id": "abc-123",
  "user_id": "user-456",
  "tenant_id": "tenant-789",
  "path": "/cases/123",
  "method": "GET",
  "status_code": 200,
  "duration_ms": 45.2
}
```

**Rate Limiting:**

Tenant-scoped rate limiting protects the API:

```
Request → SessionMiddleware → Extract tenant_id
                   ↓
         RateLimitMiddleware → Check store[tenant_id:category]
                   ↓
         Allow/Reject → 429 RATE_LIMITED with Retry-After
```

Categories with different limits:
- `default`: 60/min (general API)
- `pdf`: 10/min (expensive operations)
- `validation`: 30/min
- `fields`: 120/min (autosave needs higher limit)

**Frontend Error UX:**

```
API Error → ErrorBanner Component
                ↓
         ┌──────┴──────┐
         ↓             ↓
   Retryable?    Redirect?
   (RATE_LIMITED)  (AUTH_REQUIRED → /login)
         ↓         (INSUFFICIENT_CREDITS → /billing)
   Retry Button
```

All errors show:
- User-friendly message (translated from code)
- Support code (requestId) for debugging
- Contextual actions (retry, redirect)

---

## Current State (Sprint 1 Complete)

### What's Implemented ✅

**Authentication & Multi-Tenancy:**
- User registration/login with session-based auth
- Multi-tenant isolation (all data tenant-scoped)
- RBAC (OWNER > ADMIN > USER)
- HTTP-only session cookies

**Case Management:**
- Full CRUD with tenant scoping
- Status lifecycle (DRAFT → SUBMITTED → ARCHIVED)
- Generic key-value field storage (wizard-ready)
- Debounced autosave

**Procedure Engine:**
- IZA v1 fully implemented with 4 steps, 12 fields
- Server-side validation with business rules
- Version-aware procedure binding
- Config-driven (no UI-specific code)

**Wizard & Frontend:**
- Dynamic form rendering from procedure definitions
- Field type mapping (TEXT, NUMBER, BOOLEAN, SELECT, COUNTRY, CURRENCY)
- Step navigation with progress indication
- Inline validation error display
- Read-only mode for submitted cases

**Case Lifecycle:**
- Immutable snapshots on submit
- Submit gate (validation must pass)
- Field lock after submit

**PDF Generation:**
- Server-side generation from snapshots
- WeasyPrint/Jinja2 rendering
- Credit consumption (1 credit per PDF)
- Request ID tracing in footer

**Billing Foundation:**
- Plan management (CRUD, activate/deactivate)
- Credit balance per tenant
- Immutable ledger (audit trail)
- Admin credit grants

**Content & SEO:**
- Blog and FAQ with MDX
- Dynamic sitemap.xml
- robots.txt (app/admin excluded)
- Per-page SEO metadata

**Observability:**
- Centralized error taxonomy (20+ codes)
- Structured JSON logs
- Request tracing (X-Request-Id)
- Tenant-scoped rate limiting

### What's NOT Implemented (Deliberate MVP Cuts) ❌

**Payment Processing:**
- No Stripe/PayPal integration
- Credits are manually granted by admins
- Plan prices are informational only

**Reopen/Edit After Submit:**
- Once submitted, a case cannot be edited
- Future: Reopen creates new version

**Additional Procedures:**
- Only IZA v1 is implemented
- IPK (Import Permit) and IAA planned for future

**HSCode/Tariff Lookup:**
- No customs tariff number lookup
- User must know the correct code

**Duty/VAT Calculation:**
- No automatic calculation of import duties
- Future: Integration with customs calculation APIs

**Email Notifications:**
- No email on submit, status change, etc.
- Future: Transactional emails

**Multi-Language:**
- German only (UI and content)
- Future: EN, FR support

**Error Tracking (External):**
- No Sentry/Bugsnag integration
- Logs go to stdout only

**Metrics/Monitoring:**
- No Prometheus/Grafana
- No OpenTelemetry
- Rate limit uses in-memory store (not Redis)

**Advanced PDF:**
- No digital signatures
- No timestamping
- Single template only

**Admin Analytics:**
- No dashboard for usage statistics
- No credit consumption reports

See `docs/KNOWN_GAPS.md` for detailed technical debt and risk assessment.

---

## Deployment & Environments

### Environment Strategy

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Development │────▶│   Staging   │────▶│  Production │
│  (local)    │     │  (preview)  │     │   (live)    │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                    │
     │ docker compose     │ PaaS/Cloud         │ PaaS/Cloud
     │ localhost          │ staging.domain     │ domain.com
     │ DEBUG=true         │ DEBUG=false        │ DEBUG=false
```

### Container Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer / CDN               │
└─────────────────────────────────────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
    ┌──────▼──────┐              ┌───────▼──────┐
    │  Web (Next) │              │  API (Fast)  │
    │  Port 3000  │              │  Port 8000   │
    │  node:22    │              │  python:3.12 │
    └─────────────┘              └──────────────┘
                                        │
                                 ┌──────▼──────┐
                                 │  PostgreSQL │
                                 │  Port 5432  │
                                 └─────────────┘
```

### Docker Security Hardening

Both containers implement:
- **Non-root user**: `appuser:appgroup` (UID/GID 1000)
- **Slim base images**: python:3.12-slim, node:22-slim
- **Multi-stage builds**: Separate build and runtime stages
- **Health checks**: `/health` and `/ready` endpoints
- **No secrets in image**: All configuration via environment

### Health Probes

| Endpoint | Type | Checks | Use For |
|----------|------|--------|---------|
| `/health` | Liveness | App running | K8s liveness probe |
| `/ready` | Readiness | App + DB | K8s readiness probe, LB health |

**Response Format:**
```json
// GET /ready
{
  "data": {
    "status": "ok",      // or "degraded"
    "database": "ok",    // or "error: ..."
    "version": "1.0.0"
  }
}
```

### CI/CD Pipeline

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  Push   │────▶│  Lint   │────▶│  Test   │────▶│  Build  │
│         │     │ ruff    │     │ pytest  │     │ Docker  │
│         │     │ ESLint  │     │ vitest  │     │         │
└─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                     │
                                              ┌──────▼──────┐
                                              │   Deploy    │
                                              │ (on main)   │
                                              └─────────────┘
```

**CI Gates (fail-fast):**
1. Backend lint (ruff)
2. Backend tests (pytest)
3. Frontend lint (ESLint)
4. Frontend type check (tsc)
5. Frontend tests (vitest)
6. Frontend build (next build)
7. Docker build test
8. Security scan (Trivy, optional)

### Configuration Management

**Principles:**
- Secrets NEVER in code or images
- Environment-specific config via env vars
- Defaults safe for development
- Production requires explicit overrides

**Config Validation:**
- Critical settings validated at startup
- Missing `SESSION_SECRET` or `DATABASE_URL` → fail fast
- Production-specific warnings logged

See `docs/SETUP.md` for full environment variable reference.

