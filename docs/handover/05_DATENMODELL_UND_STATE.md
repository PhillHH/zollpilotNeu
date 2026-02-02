# 05 - Datenmodell und State

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Verwendete Datenbanken

| Komponente | Technologie | Version | Zweck |
|------------|-------------|---------|-------|
| **Primär** | PostgreSQL | 15 | Haupt-Datenbank |
| **ORM** | Prisma | 0.13.1 | Schema, Migrationen, Queries |
| **Client** | prisma-client-py | - | Python-Integration |

**Keine weiteren Datenbanken:** Kein Redis (geplant), kein Elasticsearch, keine Message Queue.

---

## Schema-Übersicht

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         IDENTITY & ACCESS                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   User   │──│Membership│──│  Tenant  │  │ Session  │  │UserEvent │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │                            │                                     │
│       └────────────────────────────┼─────────────────────────────────   │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────┐
│                         BUSINESS DOMAIN                                  │
│                                    │                                     │
│  ┌──────────┐  ┌──────────┐  ┌────▼─────┐  ┌──────────┐                │
│  │Procedure │──│  Step    │──│   Case   │──│ Snapshot │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
│       │                            │                                     │
│       └──── ProcedureField         └──── CaseField                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────┐
│                         BILLING                                          │
│  ┌──────────┐  ┌──────────┐  ┌────▼─────┐  ┌──────────┐                │
│  │   Plan   │──│  Tenant  │──│ Purchase │  │ Ledger   │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
│                      │                                                   │
│                      └──── TenantCreditBalance                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼─────────────────────────────────────┐
│                         CONTENT                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ BlogPost │  │ FaqEntry │  │Knowledge │  │Knowledge │                │
│  │          │  │          │  │  Topic   │  │  Entry   │                │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Entity-Relationship-Details

### Identity & Access

```sql
-- User: Kern-Identität
User {
  id              UUID PK
  email           STRING UNIQUE
  password_hash   STRING
  user_type       ENUM(PRIVATE, BUSINESS)
  status          ENUM(ACTIVE, DISABLED)
  created_at      TIMESTAMP
  last_login_at   TIMESTAMP?
}

-- UserProfile: Erweitertes Profil (optional)
UserProfile {
  user_id                   UUID PK FK→User
  name                      STRING?
  address                   STRING?
  default_sender_name       STRING?
  default_sender_country    STRING?
  default_recipient_name    STRING?
  default_recipient_country STRING?
  preferred_countries       JSON?    -- ["DE", "CN", "US"]
  preferred_currencies      JSON?    -- ["EUR", "USD"]
  updated_at                TIMESTAMP
}

-- Tenant: Mandant/Organisation
Tenant {
  id                UUID PK
  name              STRING
  type              ENUM(BUSINESS)
  plan_id           UUID? FK→Plan
  plan_activated_at TIMESTAMP?
  created_at        TIMESTAMP
}

-- Membership: User-Tenant-Zuordnung mit Rolle
Membership {
  user_id   UUID FK→User      ┐
  tenant_id UUID FK→Tenant    ├── Composite PK
  role      ENUM(SYSTEM_ADMIN, OWNER, ADMIN, EDITOR, USER)
}

-- Session: Aktive Login-Sessions
Session {
  id         UUID PK
  user_id    UUID FK→User
  token_hash STRING UNIQUE    -- HMAC-SHA256 des Tokens
  expires_at TIMESTAMP
  created_at TIMESTAMP
}

-- UserEvent: Audit-Log
UserEvent {
  id            UUID PK
  user_id       UUID FK→User
  type          ENUM(REGISTERED, LOGIN, LOGOUT, PASSWORD_RESET,
                     STATUS_CHANGED, PURCHASE, CREDIT_USED, PLAN_CHANGED)
  metadata_json JSON?
  created_at    TIMESTAMP
}
```

### Business Domain

```sql
-- Procedure: Verfahrensdefinition
Procedure {
  id         UUID PK
  code       STRING           -- IZA, IPK, IAA
  name       STRING
  version    STRING DEFAULT "v1"
  is_active  BOOLEAN DEFAULT true
  created_at TIMESTAMP
  updated_at TIMESTAMP

  UNIQUE(code, version)
}

-- ProcedureStep: Wizard-Schritt
ProcedureStep {
  id           UUID PK
  procedure_id UUID FK→Procedure
  step_key     STRING          -- package, sender, recipient
  title        STRING
  order        INT
  is_active    BOOLEAN DEFAULT true

  UNIQUE(procedure_id, step_key)
}

-- ProcedureField: Formularfeld
ProcedureField {
  id                UUID PK
  procedure_step_id UUID FK→ProcedureStep
  field_key         STRING
  field_type        ENUM(TEXT, NUMBER, SELECT, COUNTRY, CURRENCY, BOOLEAN)
  required          BOOLEAN DEFAULT false
  config_json       JSON?           -- placeholder, options, min/max
  order             INT

  UNIQUE(procedure_step_id, field_key)
}

-- Case: Einzelner Vorgang
Case {
  id                 UUID PK
  tenant_id          UUID FK→Tenant
  created_by_user_id UUID FK→User
  title              STRING
  status             ENUM(DRAFT, SUBMITTED, ARCHIVED)
  version            INT DEFAULT 1
  procedure_id       UUID? FK→Procedure
  procedure_version  STRING?
  created_at         TIMESTAMP
  updated_at         TIMESTAMP
  submitted_at       TIMESTAMP?
  archived_at        TIMESTAMP?

  INDEX(tenant_id)
  INDEX(procedure_id)
}

-- CaseField: Dynamische Feldwerte
CaseField {
  id         UUID PK
  case_id    UUID FK→Case (CASCADE)
  key        STRING
  value_json JSON            -- Eigentlicher Wert
  value_text STRING?         -- Für Fulltext (ungenutzt)
  updated_at TIMESTAMP

  UNIQUE(case_id, key)
  INDEX(case_id)
  INDEX(key)
}

-- CaseSnapshot: Immutables Abbild bei Submit
CaseSnapshot {
  id                UUID PK
  case_id           UUID FK→Case (CASCADE)
  version           INT
  procedure_code    STRING
  procedure_version STRING
  fields_json       JSON      -- Alle Felder zum Zeitpunkt
  validation_json   JSON      -- Validierungsergebnis
  created_at        TIMESTAMP

  UNIQUE(case_id, version)
  INDEX(case_id)
}
```

### Billing

```sql
-- Plan: Tarif-Definition
Plan {
  id                 UUID PK
  code               STRING UNIQUE    -- FREE, BASIC, PRO
  name               STRING
  is_active          BOOLEAN DEFAULT true
  price_cents        INT?
  currency           STRING DEFAULT "EUR"
  interval           ENUM(ONE_TIME, YEARLY, MONTHLY, NONE)
  credits_included   INT DEFAULT 0
  allowed_procedures ENUM[](IZA, IPK, IAA)  -- Array
  created_at         TIMESTAMP
  updated_at         TIMESTAMP
}

-- TenantCreditBalance: Aktueller Credit-Stand
TenantCreditBalance {
  tenant_id  UUID PK FK→Tenant (CASCADE)
  balance    INT DEFAULT 0
  updated_at TIMESTAMP
}

-- CreditLedgerEntry: Immutables Transaktions-Log
CreditLedgerEntry {
  id                 UUID PK
  tenant_id          UUID FK→Tenant (CASCADE)
  delta              INT           -- +/- Betrag
  reason             STRING        -- ADMIN_GRANT, PDF_EXPORT, PURCHASE
  metadata_json      JSON?         -- { caseId, note, ... }
  created_by_user_id UUID? FK→User
  created_at         TIMESTAMP

  INDEX(tenant_id)
  INDEX(created_at)
}

-- Purchase: Zahlungs-Aufzeichnung
Purchase {
  id             UUID PK
  tenant_id      UUID FK→Tenant (CASCADE)
  user_id        UUID FK→User
  provider       ENUM(STRIPE)
  provider_ref   STRING              -- Stripe Session ID
  type           ENUM(CREDITS, IZA_PASS)
  amount_cents   INT
  currency       STRING DEFAULT "EUR"
  credits_amount INT?
  status         ENUM(PENDING, PAID, FAILED, REFUNDED)
  metadata_json  JSON?
  created_at     TIMESTAMP
  updated_at     TIMESTAMP
  paid_at        TIMESTAMP?

  UNIQUE(provider, provider_ref)    -- Idempotenz
  INDEX(tenant_id)
  INDEX(status)
}
```

### Content

```sql
-- BlogPost: Blog-Artikel
BlogPost {
  id                 UUID PK
  title              STRING
  slug               STRING UNIQUE
  excerpt            STRING
  content            STRING          -- MDX
  status             ENUM(DRAFT, PUBLISHED)
  published_at       TIMESTAMP?
  meta_title         STRING?
  meta_description   STRING?
  created_by_user_id UUID? FK→User
  updated_by_user_id UUID? FK→User
  created_at         TIMESTAMP
  updated_at         TIMESTAMP

  INDEX(status)
  INDEX(published_at)
  INDEX(slug)
}

-- FaqEntry: FAQ-Eintrag
FaqEntry {
  id                   UUID PK
  question             STRING
  answer               STRING        -- MDX
  category             STRING DEFAULT "Allgemein"
  order_index          INT DEFAULT 0
  status               ENUM(DRAFT, PUBLISHED)
  published_at         TIMESTAMP?
  related_blog_post_id UUID? FK→BlogPost
  created_by_user_id   UUID? FK→User
  updated_by_user_id   UUID? FK→User
  created_at           TIMESTAMP
  updated_at           TIMESTAMP

  INDEX(status)
  INDEX(category)
}

-- KnowledgeTopic: Wissens-Kategorie
KnowledgeTopic {
  id          UUID PK
  code        STRING UNIQUE      -- zollwert, warennummer
  name        STRING
  description STRING?
  order_index INT DEFAULT 0
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

  INDEX(code)
  INDEX(order_index)
}

-- KnowledgeEntry: Wissens-Eintrag
KnowledgeEntry {
  id             UUID PK
  title          STRING
  summary        STRING
  explanation    STRING          -- Markdown
  applies_to     ENUM(IZA, IPK, IAA, ALL)
  related_fields STRING[]        -- ["zollwert", "versandkosten"]
  version        INT DEFAULT 1
  status         ENUM(DRAFT, PUBLISHED)
  topic_id       UUID? FK→KnowledgeTopic
  created_at     TIMESTAMP
  updated_at     TIMESTAMP

  INDEX(status)
  INDEX(applies_to)
  INDEX(topic_id)
}
```

---

## Reife des Schemas

### Stärken ✅

| Aspekt | Bewertung |
|--------|-----------|
| **Normalisierung** | Gut - kaum Redundanz |
| **Indizes** | Vorhanden auf wichtigen Feldern |
| **Constraints** | UNIQUE, FK mit CASCADE |
| **Enums** | Konsistent für Status-Felder |
| **Audit-Felder** | created_at, updated_at durchgängig |
| **Soft-Delete** | archived_at für Cases (statt DELETE) |

### Schwächen ⚠️

| Problem | Auswirkung | Empfehlung |
|---------|------------|------------|
| **Kein Soft-Delete global** | User/Tenant werden hart gelöscht | `deleted_at` hinzufügen |
| **JSON ohne Validierung** | `metadata_json` kann beliebig sein | JSON Schema oder Typing |
| **TenantCreditBalance denormalisiert** | Sync-Risiko mit Ledger | Trigger oder Konsistenz-Check |
| **CaseField.value_text ungenutzt** | Toter Code | Entfernen oder nutzen |
| **Fehlende Indizes** | `User.created_at`, `Case.created_at` | Für List-Queries hinzufügen |

---

## Migrationsstrategie

### Aktuelle Migrationen (14 Stück)

```
prisma/migrations/
├── 0001_init/                    # Basis-Setup
├── 0002_auth_baseline/           # User, Session, Tenant
├── 0003_cases/                   # Case-Modell
├── 0004_case_fields/             # CaseField-Modell
├── 0005_billing_foundation/      # Plan, Credits
├── 0006_procedures/              # Procedure-Engine
├── 0007_case_lifecycle/          # Snapshots, Status
├── 0008_iza_v1_realistic/        # IZA-Seeding
├── 0010_add_system_admin_role/   # SYSTEM_ADMIN Rolle
├── 0011_user_tenant_types/       # UserType, TenantType
├── 0012_extend_user_event_types/ # Mehr Event-Typen
├── 0013_extend_plan_model/       # Plan-Erweiterungen
└── 0014_ipk_iaa_v1/              # IPK, IAA Verfahren
```

**Lücke:** Migration 0009 fehlt (übersprungen oder gelöscht)

### Workflow

```bash
# Neue Migration erstellen
npx prisma migrate dev --name <name>

# Migrationen anwenden (Production)
npx prisma migrate deploy

# Schema validieren
npx prisma validate
```

### Risiken

| Risiko | Beschreibung | Mitigation |
|--------|--------------|------------|
| **Content-Tabellen** | In Schema aber keine Migration | Migration generieren |
| **Seeding in Migration** | IZA/IPK/IAA werden in Migrations geseeded | Idempotent gestalten |
| **Keine Rollback-Strategie** | Prisma hat kein `migrate down` | Manuelle SQL für Rollback |

---

## State-Handling

### Backend (FastAPI)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        REQUEST LIFECYCLE                             │
│                                                                      │
│  Request ──▶ Middleware ──▶ Route Handler ──▶ Response              │
│                  │                                                   │
│                  ▼                                                   │
│         ┌──────────────┐                                            │
│         │ Request State│  ← request.state.user                      │
│         │   (Scoped)   │  ← request.state.tenant                    │
│         │              │  ← request.state.request_id                │
│         └──────────────┘                                            │
│                                                                      │
│  ⚠️ Rate Limit Store: In-Memory (nicht persistent)                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**State-Arten:**

| State | Speicherort | Lebensdauer | Teilen zwischen Instanzen |
|-------|-------------|-------------|---------------------------|
| Request Context | `request.state` | Ein Request | Nein |
| Session | PostgreSQL | Bis Logout/Expiry | Ja |
| Rate Limits | In-Memory Dict | App-Restart | **Nein** ⚠️ |
| Business Data | PostgreSQL | Persistent | Ja |

### Frontend (Next.js)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND STATE                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    SERVER COMPONENTS                        │     │
│  │  - Kein State                                              │     │
│  │  - Data Fetching via fetch()                               │     │
│  │  - Props werden an Client Components übergeben             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    CLIENT COMPONENTS                        │     │
│  │                                                             │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │     │
│  │  │ useState    │  │useReducer   │  │  Context    │        │     │
│  │  │ (lokal)     │  │ (komplex)   │  │  (shared)   │        │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        │     │
│  │                                                             │     │
│  │  Beispiele:                                                 │     │
│  │  - Wizard: fieldValues, saveStatus, validationErrors       │     │
│  │  - Sidebar: isOpen, activeItem                             │     │
│  │  - Forms: inputValues, isSubmitting                        │     │
│  │                                                             │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ⚠️ Kein globaler State-Manager (Redux, Zustand)                    │
│  ⚠️ Kein Server-State-Caching (React Query, SWR)                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**State-Patterns im Wizard:**

```typescript
// apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx

// 1. Feld-Werte (lokal, sync mit Server)
const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

// 2. Save-Status pro Feld
const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});

// 3. Validierungsfehler (von API)
const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

// 4. Debounced Auto-Save
useEffect(() => {
  const timer = setTimeout(() => saveField(key, value), 500);
  return () => clearTimeout(timer);
}, [fieldValue]);
```

---

## Risiken bzgl. Datenintegrität

### 1. TenantCreditBalance Sync

**Problem:** Balance ist denormalisiert (nicht `SUM(delta)` aus Ledger)

**Risiko:** Diskrepanz zwischen Balance und Ledger-Summe

**Mitigation:**
```python
# Atomare Operation in app/routes/billing.py
async with db.transaction():
    await prisma.creditledgerentry.create(...)
    await prisma.tenantcreditbalance.update(...)
```

**Empfehlung:** Periodischer Konsistenz-Check oder DB-Trigger

### 2. Session-Token-Invalidierung

**Problem:** Bei Logout wird Session gelöscht, aber in-flight Requests könnten noch Token haben

**Risiko:** Kurzes Timing-Window für parallele Requests

**Mitigation:** Akzeptables Risiko bei kurzlebigen Sessions

### 3. Cascade-Deletes

**Problem:** User-Delete cascaded zu allen zugehörigen Daten

**Risiko:** Unbeabsichtigter Datenverlust

**Mitigation:** Soft-Delete implementieren, harte Löschung nur für GDPR

---

## Risiken bzgl. Skalierung

### 1. Keine Read-Replicas

**Problem:** Alle Queries gehen auf Primary

**Limit:** ~1000 concurrent users (geschätzt)

**Lösung:** PostgreSQL Read-Replica + Connection Pooling

### 2. Session-Lookup pro Request

**Problem:** Jeder Request macht DB-Query für Session

**Mitigation:** Redis Session Store (TD-003)

### 3. Große JSON-Felder

**Problem:** `fields_json` in CaseSnapshot kann groß werden

**Risiko:** Langsame Queries bei vielen Snapshots

**Mitigation:** JSONB-Indizes wenn nötig

---

## Risiken bzgl. Mandantenfähigkeit

### 1. Tenant-ID in allen Queries (Positiv)

**Status:** ✅ Implementiert via `build_tenant_where()`

### 2. Kein Row-Level Security

**Problem:** PostgreSQL RLS nicht aktiviert

**Risiko:** Versehentliche Queries ohne Tenant-Filter

**Mitigation:** Application-Level Guards (aktuell)

### 3. Shared Sequences

**Problem:** UUIDs sind global, nicht tenant-spezifisch

**Risiko:** Keins (UUIDs sind nicht erratbar)

---

## Zusammenfassung

| Kategorie | Bewertung | Begründung |
|-----------|-----------|------------|
| **Schema-Reife** | ✅ Gut | Normalisiert, Constraints, Indizes |
| **Migrationsstrategie** | ⚠️ Ausreichend | Funktioniert, aber keine Rollback-Strategie |
| **State-Handling Backend** | ⚠️ Risiko | In-Memory Rate Limit nicht skalierbar |
| **State-Handling Frontend** | ✅ Angemessen | Einfach gehalten, kein Over-Engineering |
| **Datenintegrität** | ✅ Gut | Atomic Operations, Snapshots |
| **Skalierbarkeit** | ⚠️ Begrenzt | Single DB, keine Caching-Layer |
| **Mandantenfähigkeit** | ✅ Gut | Tenant-Scoping durchgängig |
