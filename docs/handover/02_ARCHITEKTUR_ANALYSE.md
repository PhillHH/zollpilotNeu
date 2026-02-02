# 02 - Architektur-Analyse

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Systemarchitektur (IST)

### Übersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Landing  │  │   App    │  │  Admin   │  │  Public  │    │   │
│  │  │  Page    │  │  Shell   │  │  Panel   │  │  Pages   │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                              │                               │   │
│  │                    ┌─────────▼─────────┐                    │   │
│  │                    │   API Proxy       │                    │   │
│  │                    │ /api/backend/*    │                    │   │
│  │                    └─────────┬─────────┘                    │   │
│  └──────────────────────────────┼──────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │ HTTP (Session Cookie)
┌─────────────────────────────────┼───────────────────────────────────┐
│                         API LAYER                                    │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │                    FastAPI Backend                           │   │
│  │  ┌────────────────────────────────────────────────────┐     │   │
│  │  │               Middleware Stack                      │     │   │
│  │  │  CORS → RequestId → ContractVersion → Session →    │     │   │
│  │  │  RateLimit → Logging                               │     │   │
│  │  └────────────────────────────────────────────────────┘     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │  /auth   │  │  /cases  │  │  /admin  │  │ /content │    │   │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                              │                               │   │
│  │  ┌───────────────────────────▼────────────────────────┐     │   │
│  │  │              Core Services                          │     │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │     │   │
│  │  │  │ Procedure│  │   PDF    │  │ Security │         │     │   │
│  │  │  │  Engine  │  │ Service  │  │  Guards  │         │     │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │     │   │
│  │  └────────────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │ Prisma ORM
┌─────────────────────────────────┼───────────────────────────────────┐
│                        DATA LAYER                                    │
│  ┌──────────────────────────────▼──────────────────────────────┐   │
│  │                    PostgreSQL 15                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │  Users   │  │  Cases   │  │ Procedures│  │ Billing  │    │   │
│  │  │ Tenants  │  │  Fields  │  │   Steps   │  │ Credits  │    │   │
│  │  │ Sessions │  │ Snapshots│  │   Fields  │  │ Purchases│    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Verantwortlichkeiten

### Frontend (Next.js)

| Bereich | Verantwortung | Nicht-Verantwortlich für |
|---------|---------------|--------------------------|
| Präsentation | UI-Rendering, Styling, Responsive Design | Geschäftslogik |
| Navigation | Routing, Seitenzustände, URL-Struktur | Datenvalidierung |
| State | UI-State, Formular-Zwischenzustände | Persistenz |
| SEO | Meta-Tags, Sitemap, robots.txt | Inhalts-Management |
| Authentifizierung | Cookie-Handling, Redirects | Session-Validierung |

**Schlüsseldateien:**
- `/apps/web/src/app/layout.tsx` - Root Layout
- `/apps/web/src/app/app/layout.tsx` - App Shell
- `/apps/web/src/procedures/` - Procedure Configs

### Backend (FastAPI)

| Bereich | Verantwortung | Nicht-Verantwortlich für |
|---------|---------------|--------------------------|
| Geschäftslogik | Validierung, Workflows, Regeln | UI-Rendering |
| Authentifizierung | Sessions, Token-Hashing, RBAC | Cookie-Präsentation |
| Datenintegrität | Tenant-Isolation, Constraints | Caching-Strategie |
| API | Endpoints, Response-Format, Versioning | Frontend-Routing |
| PDF | Generierung, Templates, Credits | Download-UI |

**Schlüsseldateien:**
- `/apps/api/app/main.py` - FastAPI App
- `/apps/api/app/core/` - Security, Config, Errors
- `/apps/api/app/domain/procedures.py` - Validierungslogik

### Datenbank (PostgreSQL + Prisma)

| Bereich | Verantwortung | Nicht-Verantwortlich für |
|---------|---------------|--------------------------|
| Persistenz | Daten speichern, ACID | Geschäftsregeln |
| Schema | Struktur, Constraints, Indizes | Validierung |
| Migrationen | Schema-Evolution | Daten-Seeding |
| Relationen | Foreign Keys, Cascades | Anwendungs-Joins |

**Schlüsseldateien:**
- `/prisma/schema.prisma` - Schema-Definition
- `/prisma/migrations/` - 14 Migrationen

---

## Deployment- und Laufzeitannahmen

### Container-Architektur

```yaml
# docker-compose.yml - Vereinfacht
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

  api:
    build: apps/api
    ports: ["8000:8000"]
    depends_on: [postgres]
    environment:
      - DATABASE_URL=postgresql://...
      - SESSION_SECRET=${SESSION_SECRET}

  web:
    build: apps/web
    ports: ["3000:3000"]
    depends_on: [api]
    environment:
      - API_BASE_URL=http://api:8000
```

### Annahmen

| Annahme | Aktueller Stand | Produktionsrisiko |
|---------|-----------------|-------------------|
| Single Instance | ✅ Erfüllt | Rate Limiting bricht bei Scale |
| Shared Database | ✅ Erfüllt | Kein Read-Replica |
| Stateless API | ⚠️ Teilweise | In-Memory Rate Limit Store |
| Container-Runtime | ✅ Docker | K8s-Ready (Health Probes) |

---

## Authentifizierung (IST)

### Session-Flow

```
┌──────────┐     POST /auth/login      ┌──────────┐
│  Client  │ ─────────────────────────▶│   API    │
│          │  (email, password)        │          │
└──────────┘                           └────┬─────┘
                                            │
                                            ▼
                                   ┌────────────────┐
                                   │ Validate Creds │
                                   │ Create Session │
                                   │ Hash Token     │
                                   └────────┬───────┘
                                            │
┌──────────┐     Set-Cookie               │
│  Client  │ ◀────────────────────────────┘
│          │  session=<token>; HttpOnly; SameSite=Lax
└──────────┘
```

### Session-Speicherung

```sql
-- Session-Modell (Prisma)
model Session {
  id         String   @id @default(uuid())
  user_id    String
  token_hash String   @unique  -- HMAC-SHA256
  expires_at DateTime
  created_at DateTime @default(now())
}
```

**Sicherheitsmerkmale:**
- ✅ Token wird gehasht (nicht im Klartext)
- ✅ HTTP-only Cookie (XSS-Schutz)
- ✅ SameSite=Lax (CSRF-Schutz)
- ✅ Expiry-Prüfung bei jedem Request
- ⚠️ Secure=false in Development (muss in Prod true sein)

### RBAC-Hierarchie

```
SYSTEM_ADMIN (5) ─────────────────────────────────────────┐
       │                                                   │
       │  Kann alles: Plans, alle Tenants, Content        │
       ▼                                                   │
    OWNER (4) ────────────────────────────────────────┐   │
       │                                               │   │
       │  Volle Tenant-Kontrolle, User-Management     │   │
       ▼                                               │   │
    ADMIN (3) ────────────────────────────────────┐   │   │
       │                                           │   │   │
       │  Tenant-Admin ohne Owner-Rechte          │   │   │
       ▼                                           │   │   │
   EDITOR (2) ────────────────────────────────┐   │   │   │
       │                                       │   │   │   │
       │  Nur Content (Blog, FAQ)             │   │   │   │
       ▼                                       │   │   │   │
    USER (1) ──────────────────────────────   │   │   │   │
                                               │   │   │   │
       Standard-Nutzer: eigene Cases          │   │   │   │
                                               │   │   │   │
                                               ▼   ▼   ▼   ▼
                                          Tenant-Scope
```

---

## Sicherheitsmodell (IST)

### Tenant-Isolation

```python
# app/core/tenant_guard.py

def build_tenant_where(tenant_id: str, **kwargs) -> dict:
    """Erzwingt tenant_id in jeder Query."""
    return {"tenant_id": tenant_id, **kwargs}

def require_tenant_scope(
    resource: Any,
    resource_type: str,
    resource_id: str,
    current_tenant_id: str,
    user_id: str
) -> Any:
    """
    Defense-in-depth: Prüft auch nach Query.
    Gibt 404 (nicht 403) zurück - keine Info-Leaks.
    """
    if resource is None:
        log_security_event(SecurityEventType.tenant_scope_violation, ...)
        raise HTTPException(404)  # Absichtlich 404
    return resource
```

**Garantien:**
- Jede Daten-Query enthält `tenant_id`
- Cross-Tenant-Zugriff gibt 404 (nicht 403)
- Security-Events werden geloggt

### Middleware-Stack (Reihenfolge)

```python
# apps/api/app/main.py

# 1. CORS - Erlaubt definierte Origins
app.add_middleware(CORSMiddleware, allow_origins=[...])

# 2. Request-ID - Generiert UUID für Tracing
app.add_middleware(RequestIdMiddleware)

# 3. Contract-Version - Prüft X-Contract-Version Header
app.add_middleware(ContractVersionMiddleware)

# 4. Session - Extrahiert User/Tenant aus Cookie
app.add_middleware(SessionMiddleware)

# 5. Rate-Limit - Begrenzt Requests pro Tenant
app.add_middleware(RateLimitMiddleware)
```

---

## Solide Architekturentscheidungen

### 1. API-First mit strikter Trennung

**Entscheidung:** Frontend konsumiert nur API, kein Server-Side DB-Zugriff

**Vorteile:**
- Backend wiederverwendbar für Mobile/CLI
- Klare Contracts via OpenAPI
- Unabhängige Skalierung

**Code-Evidenz:**
```typescript
// apps/web/src/app/api/backend/[...path]/route.ts
// Proxy-Route - Frontend spricht nie direkt mit DB
```

### 2. Config-Driven Procedure Engine

**Entscheidung:** Zollverfahren als Daten, nicht als Code

**Vorteile:**
- Neue Verfahren ohne Deployment
- Versionierung für Compliance
- Zentralisierte Validierung

**Code-Evidenz:**
```python
# apps/api/app/domain/procedures.py
class ProcedureLoader:
    async def load_procedure(self, code: str, version: str):
        return await prisma.procedure.find_first(
            where={"code": code, "version": version}
        )
```

### 3. Immutable Snapshots bei Submit

**Entscheidung:** Eingereichte Cases werden als unveränderlicher Snapshot gespeichert

**Vorteile:**
- Rechtssicherheit / Audit
- Reproduzierbare PDFs
- Keine nachträgliche Manipulation

**Code-Evidenz:**
```python
# CaseSnapshot enthält fields_json + validation_json
# PDF wird aus Snapshot generiert, nicht aus Case
```

### 4. Multi-Tenant by Design

**Entscheidung:** `tenant_id` in allen Geschäftsentitäten von Tag 1

**Vorteile:**
- Datentrennung garantiert
- Shared Infrastructure (kosteneffizient)
- Skaliert mit Kundenzahl

### 5. Credits mit Audit-Ledger

**Entscheidung:** Immutables Ledger statt einfachem Balance-Feld

**Vorteile:**
- Nachvollziehbarkeit aller Transaktionen
- Debugging bei Diskrepanzen
- Basis für Refunds/Reversals

---

## Fragile / Inkonsistente Architekturstellen

### 1. In-Memory Rate Limiting

**Problem:** `RateLimitMiddleware` speichert State im Application Memory

```python
# apps/api/app/middleware/rate_limit.py
class RateLimitMiddleware:
    def __init__(self):
        self.store: Dict[str, List[float]] = {}  # ⚠️ In-Memory
```

**Risiko:** Bei horizontaler Skalierung (2+ Instanzen) wird das Limit pro Instanz gezählt → effektives Limit verdoppelt sich.

**Empfehlung:** Redis-basierter Store (siehe KNOWN_GAPS.md TD-001)

---

### 2. CORS zu permissiv

**Problem:** `allow_headers=["*"]` erlaubt alle Header

```python
# apps/api/app/main.py
CORSMiddleware(
    allow_origins=[settings.web_origin, ...],
    allow_headers=["*"],  # ⚠️ Zu offen
)
```

**Risiko:** Unterminiert CORS-Schutz für Custom Headers

**Empfehlung:** Explizite Whitelist: `["Content-Type", "X-Contract-Version", "X-Request-Id"]`

---

### 3. Fehlende Security Headers

**Problem:** Keine Standard-Security-Headers gesetzt

**Fehlend:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Empfehlung:** Middleware für Security Headers hinzufügen

---

### 4. Debug-Logging sensitiver Daten

**Problem:** SessionMiddleware loggt Token-Hash

```python
# apps/api/app/middleware/session.py
logger.error(f"raw_cookie_header={raw_cookie_header}, token_hash={token_hash}")
```

**Risiko:** Sensitive Daten in Logs

**Empfehlung:** Logging-Level auf WARNING, keine Token-Hashes

---

### 5. Content-Models ohne Migration

**Problem:** BlogPost, FaqEntry, KnowledgeTopic, KnowledgeEntry sind in `schema.prisma` definiert, aber es fehlen entsprechende CREATE TABLE Migrationen.

**Interpretation:** Wahrscheinlich wurden Tabellen manuell angelegt oder via SQL-Skripte (`create_content_tables.sql`).

**Risiko:** Schema-Drift zwischen Prisma und Datenbank

**Empfehlung:** Migration generieren: `prisma migrate dev --name add_content_tables`

---

### 6. Stripe Webhook Secret optional

**Problem:** Webhook-Secret kann leer sein

```python
# apps/api/app/routes/checkout.py
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
```

**Risiko:** In Development werden Webhooks nicht verifiziert

**Empfehlung:** Fail-Fast wenn in Production ohne Secret

---

### 7. Session-Cookie Secure Flag

**Problem:** `secure=False` in Development

```python
response.set_cookie(
    key="session",
    value=token,
    httponly=True,
    samesite="lax",
    secure=settings.session_cookie_secure,  # Aus Config
)
```

**Risiko:** Wenn `SESSION_COOKIE_SECURE` nicht gesetzt, läuft Prod ohne HTTPS-Only

**Empfehlung:** Explizite Validierung dass Secure=True in Production

---

## Architektur-Diagramm: Request-Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                          REQUEST LIFECYCLE                              │
└────────────────────────────────────────────────────────────────────────┘

Browser                  Next.js                   FastAPI                 Postgres
   │                        │                         │                       │
   │  GET /app/cases        │                         │                       │
   ├───────────────────────▶│                         │                       │
   │                        │                         │                       │
   │                        │  GET /api/backend/cases │                       │
   │                        ├────────────────────────▶│                       │
   │                        │  (Session Cookie)       │                       │
   │                        │                         │                       │
   │                        │                         │──┐ CORS Check         │
   │                        │                         │◀─┘                    │
   │                        │                         │                       │
   │                        │                         │──┐ Session Lookup     │
   │                        │                         │  │ (DB Query)         │
   │                        │                         │  ├──────────────────▶│
   │                        │                         │◀─┤ User + Tenant      │
   │                        │                         │  │                    │
   │                        │                         │──┐ Rate Limit Check   │
   │                        │                         │◀─┘                    │
   │                        │                         │                       │
   │                        │                         │  SELECT * FROM cases  │
   │                        │                         │  WHERE tenant_id = ?  │
   │                        │                         ├──────────────────────▶│
   │                        │                         │◀─────────────────────┤
   │                        │                         │  Cases[]              │
   │                        │                         │                       │
   │                        │  200 { data: [...] }    │                       │
   │                        │◀────────────────────────┤                       │
   │                        │                         │                       │
   │  HTML + JSON           │                         │                       │
   │◀───────────────────────┤                         │                       │
   │                        │                         │                       │
```

---

## Zusammenfassung

| Kategorie | Bewertung | Begründung |
|-----------|-----------|------------|
| Schichttrennung | ✅ Exzellent | Frontend/Backend/DB strikt getrennt |
| Skalierbarkeit | ⚠️ Eingeschränkt | Rate Limit und Session State in Memory |
| Sicherheit | ✅ Gut | Tenant-Isolation, RBAC, aber Header fehlen |
| Wartbarkeit | ✅ Gut | Klare Struktur, dokumentierte ADRs |
| Erweiterbarkeit | ✅ Gut | Procedure Engine config-driven |
