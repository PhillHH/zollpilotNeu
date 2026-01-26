# Setup

> **📦 Sprint 1 Complete (v1.0.0)** – Stabile Basis für Beta-Nutzung und Weiterentwicklung.
> Siehe [ROADMAP.md](./ROADMAP.md) für geplante Erweiterungen.

---

## Was ZollPilot ist – und was nicht

**ZollPilot ist:**
- Ein Vorbereitungstool für Zollanmeldungen
- Eine Ausfüllhilfe, die Ihnen zeigt, welche Angaben wo einzutragen sind
- Ein geführter Prozess für die Datenerfassung

**ZollPilot ist NICHT:**
- Ein offizieller Zollanmeldeservice
- Mit dem ATLAS-System oder anderen Zollbehörden-Systemen verbunden
- Ein Ersatz für die eigentliche Zollanmeldung

Die eigentliche Zollanmeldung müssen Sie selbst über die offiziellen Kanäle vornehmen.

---

## Quick Start (Development)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Generate a secure session secret
openssl rand -hex 32  # Copy output to SESSION_SECRET in .env

# 3. Start all services
docker compose up --build

# 4. Verify health
curl -H "X-Contract-Version: 1" http://localhost:8000/health
curl -H "X-Contract-Version: 1" http://localhost:8000/ready
```

**Access Points:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Environments

### Development (`docker compose`)

Default configuration for local development:

```
NODE_ENV=development
SESSION_COOKIE_SECURE=false
DEBUG_MODE=true (optional)
```

### Staging

Pre-production environment with production-like settings:

```
NODE_ENV=staging
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_DOMAIN=staging.yourdomain.com
WEB_ORIGIN=https://staging.yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.staging.yourdomain.com
```

### Production

Full production settings with security hardening:

```
NODE_ENV=production
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAMESITE=Strict
SESSION_COOKIE_DOMAIN=yourdomain.com
WEB_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
DEBUG_MODE=false
```

---

## Environment Variables

**Positioning:** ZollPilot is a **Preparation Tool** ("Ausfüllhilfe"). It helps users prepare data for the official "Internetzollanmeldung" (IZA) to avoid carrier service fees. It does NOT submit data to ATLAS directly.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SESSION_SECRET` | 32+ char secret for session signing | `openssl rand -hex 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_HOST` | `0.0.0.0` | API bind host |
| `API_PORT` | `8000` | API port |
| `LOG_LEVEL` | `info` | Log level (debug, info, warning, error) |

### Session & Security

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_TTL_MINUTES` | `120` | Session lifetime |
| `SESSION_COOKIE_NAME` | `zollpilot_session` | Cookie name |
| `SESSION_COOKIE_SECURE` | `false` | Require HTTPS |
| `SESSION_COOKIE_DOMAIN` | (empty) | Cookie domain |
| `SESSION_COOKIE_SAMESITE` | `Lax` | SameSite policy |
| `WEB_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

### Rate Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_DEFAULT` | `60` | General API limit/min |
| `RATE_LIMIT_PDF` | `10` | PDF export limit/min |
| `RATE_LIMIT_VALIDATION` | `30` | Validation limit/min |
| `RATE_LIMIT_FIELDS` | `120` | Autosave limit/min |

### Frontend

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Public API URL for browser requests |
| `API_BASE_URL` | Internal API URL (Docker network) |

---

## Design System & Theming

Das Frontend verwendet ein zentrales Design System basierend auf CSS Custom Properties.

### Anpassung der Farben

```css
/* apps/web/src/app/design-system/tokens.css */
:root {
  --color-primary: #10b981;      /* Primärfarbe */
  --color-bg: #fafbfc;            /* Hintergrund */
  --color-surface: #ffffff;       /* Karten */
}
```

### Rebranding

1. Kopiere `tokens.css` nach `tokens-brand.css`
2. Passe die Variablen an
3. Importiere die neue Datei in `globals.css`

```css
/* globals.css */
@import './design-system/tokens-brand.css';  /* Statt tokens.css */
@import './design-system/base.css';
```

Siehe [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) für die vollständige Token-Liste.

### UI-Primitives in der App

Die App-Komponenten (`/app/*`) verwenden die Design-System-Primitives:

```tsx
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import { Button } from "../design-system/primitives/Button";
import { Badge } from "../design-system/primitives/Badge";
import { Alert } from "../design-system/primitives/Alert";
import { Stepper } from "../design-system/primitives/Stepper";
```

**Komponenten:**

| Primitive | Verwendung in App |
|-----------|-------------------|
| `Section` | Seitencontainer (Dashboard, Cases, Summary) |
| `Card` | Content-Gruppierung, Listen-Einträge |
| `Button` | Aktionen (Erstellen, Weiter, Einreichen) |
| `Badge` | Status-Anzeige (Entwurf, Eingereicht) |
| `Alert` | Fehlermeldungen, Hinweise |
| `Stepper` | Wizard-Fortschritt |

---

## Content (Blog & FAQ)

Blog- und FAQ-Inhalte werden als MDX-Dateien verwaltet.

### Neuen Blog-Artikel erstellen

1. Erstelle eine neue `.mdx`-Datei in `apps/web/content/blog/`
2. Füge Frontmatter hinzu:

```yaml
---
title: "Ihr Artikeltitel"
description: "SEO-Beschreibung (150-160 Zeichen)"
slug: "url-freundlicher-slug"
published_at: "2026-01-20"
tags: ["Zoll", "Import"]
---
```

3. Schreibe den Inhalt als Markdown
4. Starte den Dev-Server und prüfe unter `/blog/[slug]`

### Neue FAQ erstellen

1. Erstelle eine neue `.mdx`-Datei in `apps/web/content/faq/`
2. Füge Frontmatter hinzu:

```yaml
---
title: "Ihre Frage?"
description: "Kurze Antwort"
slug: "url-freundlicher-slug"
published_at: "2026-01-20"
category: "Allgemein"
---
```

3. Schreibe die ausführliche Antwort als Markdown
4. Starte den Dev-Server und prüfe unter `/faq/[slug]`

**Wichtig:** Alle sichtbaren Texte müssen auf Deutsch sein.

Siehe [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) für ausführliche Formatierungsregeln.

---

## Deployment Options

### Option 1: Single-Host Docker

Recommended for small deployments and staging.

```bash
# Build images
docker compose build

# Start with production config
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check logs
docker compose logs -f
```

### Option 2: Managed PaaS

Supported platforms:
- **Render**: Deploy via `render.yaml` Blueprint
- **Fly.io**: Use `fly.toml` configuration
- **Railway**: Connect GitHub repo
- **Hetzner Apps**: Docker-based deployment

**General Steps:**
1. Set environment variables in platform dashboard
2. Configure database (managed PostgreSQL recommended)
3. Deploy API and Web as separate services
4. Configure custom domain and SSL

### Option 3: Kubernetes

For enterprise/scale deployments:
1. Build images and push to registry
2. Apply Kubernetes manifests (see `k8s/` if available)
3. Configure Ingress with SSL
4. Use managed PostgreSQL (RDS, Cloud SQL, etc.)

## Tests

- API: `pytest` (run in `apps/api`)
- Web: `npm test` (run in `apps/web`)

## Development Flow

1. Register a user at `/register`
2. Login at `/login`
3. Access the app at `/app`
4. Create and manage cases at `/app/cases`
5. Click on a case to view details and add notes
6. View billing at `/app/billing`

## Admin Flow

The first registered user becomes OWNER and has admin access:

1. Navigate to `/admin`
2. Manage plans at `/admin/plans`
3. Manage tenants and credits at `/admin/tenants`

See `docs/ADMIN_MANUAL.md` for detailed admin instructions.

## Database Migrations

Migrations are applied automatically on container startup.
To create a new migration manually:

```bash
cd prisma
npx prisma migrate dev --name <migration_name>
```

## Seeds

The migration `0005_billing_foundation` seeds a FREE plan automatically.
New tenants do not have a plan assigned by default; admins can assign plans
via `/admin/tenants`.

## Blog & FAQ Content

Content is stored as MDX files in `apps/web/content/`:

```
apps/web/content/
├── blog/           # Blog articles
│   └── article.mdx
└── faq/            # FAQ entries
    └── question.mdx
```

### Adding a Blog Post

1. Create a new `.mdx` file in `apps/web/content/blog/`
2. Add frontmatter:
   ```yaml
   ---
   title: "Your Title"
   description: "SEO description"
   slug: "url-friendly-slug"
   published_at: "2026-01-15"
   tags: ["Tag1", "Tag2"]
   ---
   ```
3. Write markdown content below the frontmatter
4. Commit and deploy

### Adding an FAQ Entry

1. Create a new `.mdx` file in `apps/web/content/faq/`
2. Add frontmatter:
   ```yaml
   ---
   title: "Question title"
   description: "Short answer"
   slug: "url-friendly-slug"
   published_at: "2026-01-15"
   category: "Allgemein"
   ---
   ```
3. Write detailed answer as markdown
4. Commit and deploy

See `docs/CONTENT_GUIDE.md` for detailed formatting guidelines.

## Logs & Debugging

### Viewing Logs

API logs are JSON-formatted and can be viewed with:

```bash
# Docker logs
docker logs zollpilot-api -f

# With jq for pretty printing
docker logs zollpilot-api -f | jq
```

### Searching by Request ID

When debugging an error, find the `requestId` from the error response and search:

```bash
# Find all logs for a request
docker logs zollpilot-api 2>&1 | grep "abc-123-xyz"
```

### Log Fields

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 timestamp (UTC) |
| `level` | INFO, WARNING, ERROR |
| `request_id` | Unique request identifier |
| `user_id` | Authenticated user (if any) |
| `tenant_id` | User's tenant (if authenticated) |
| `path` | Request path |
| `method` | HTTP method |
| `status_code` | Response status |
| `duration_ms` | Request duration |
| `error_code` | Error code (if error) |

### Rate Limit Debugging

Rate limits are logged when exceeded:

```json
{
  "level": "WARNING",
  "message": "Rate limit exceeded",
  "tenant_id": "tenant-123",
  "path": "/cases/abc/pdf",
  "error_code": "RATE_LIMITED"
}
```

To check current rate limit status, look at response headers:
- `X-RateLimit-Limit`: Max requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: When window resets (Unix timestamp)

## Troubleshooting

### Container startet nicht (Exit Code 255)

**Symptom:** `docker logs zollpilot-api` zeigt `exec /app/entrypoint.sh: no such file or directory`

**Ursache:** Windows CRLF Line Endings im Shell Script.

**Lösung:** Das Dockerfile konvertiert die Line Endings automatisch. Falls trotzdem Probleme:
```bash
# Im Repository-Root:
git config core.autocrlf false
git rm --cached -r .
git reset --hard
```

---

### Prisma Migration Failed

**Symptom:** `P3018: ERROR: relation already exists`

**Ursache:** Migration wurde teilweise angewendet oder manuell in DB geändert.

**Lösung:**
```bash
# 1. Aktuelle Migration-Status prüfen
docker exec zollpilot-api npx prisma migrate status

# 2. Falls inkonsistent: Migration-Tabelle zurücksetzen (VORSICHT: nur Dev!)
docker exec zollpilot-db psql -U postgres -d zollpilot -c "DELETE FROM _prisma_migrations WHERE migration_name = '0007_...';"

# 3. Dann erneut migrieren
docker exec zollpilot-api npx prisma migrate deploy
```

---

### CORS-Fehler im Browser

**Symptom:** `Access to fetch blocked by CORS policy: No 'Access-Control-Allow-Origin' header`

**Ursache:** `WEB_ORIGIN` in `.env` stimmt nicht mit der Frontend-URL überein.

**Lösung:**
1. `.env` prüfen: `WEB_ORIGIN=http://localhost:3000` (mit `http`, ohne Trailing Slash)
2. Container neu starten: `docker compose restart api`

---

### 500 Internal Server Error ohne Details

**Symptom:** API gibt 500 zurück, aber keine hilfreichen Logs.

**Lösung:**
1. Request-ID aus Response Header holen: `X-Request-Id`
2. Logs durchsuchen: `docker logs zollpilot-api 2>&1 | grep "<request-id>"`
3. Falls keine Logs: Prüfen ob Container läuft: `docker ps`

---

### PDF-Export schlägt fehl

**Symptom:** 500 Error bei `POST /cases/{id}/pdf`

**Mögliche Ursachen:**

1. **WeasyPrint Dependencies fehlen:**
   ```bash
   docker exec zollpilot-api python -c "from weasyprint import HTML; print('OK')"
   ```

2. **Case nicht submitted:** PDF nur für SUBMITTED Cases.

3. **Keine Credits:** Prüfen mit `GET /billing/me`

---

### Session wird nicht gesetzt

**Symptom:** Nach Login wird Cookie nicht gesetzt, `/auth/me` gibt 401.

**Ursachen:**

1. **Cross-Origin Issue:** Frontend und API auf unterschiedlichen Ports/Domains.
   - Lösung: `SESSION_COOKIE_DOMAIN` in `.env` setzen (z.B. `localhost`)
   
2. **Secure Cookie in Dev:** `SESSION_COOKIE_SECURE=true` aber HTTP (nicht HTTPS).
   - Lösung für Dev: `SESSION_COOKIE_SECURE=false`

---

### Tests schlagen fehl

**Backend Tests:**
```bash
# Im Container ausführen
docker exec zollpilot-api pytest -v

# Einzelner Test
docker exec zollpilot-api pytest tests/test_auth.py -v
```

**Frontend Tests:**
```bash
cd apps/web
npm test

# Mit Coverage
npm run test:coverage
```

---

### Docker Compose Build hängt

**Symptom:** Build bleibt bei "Installing dependencies" stehen.

**Lösung:**
```bash
# Cache löschen und neu bauen
docker compose down -v
docker system prune -f
docker compose build --no-cache
docker compose up
```

---

### Database Connection Refused

**Symptom:** `Connection refused` oder `ECONNREFUSED` bei DB-Zugriff.

**Ursachen:**

1. **DB-Container nicht gestartet:**
   ```bash
   docker ps | grep zollpilot-db
   ```

2. **Falsche DB URL:** Prüfen ob `DATABASE_URL` in `.env` korrekt ist.

3. **Port-Konflikt:** Lokaler PostgreSQL läuft auf Port 5432.
   ```bash
   # Port freigeben oder anderen Port in docker-compose.yml
   lsof -i :5432
   ```

---

### Quickstart Checklist

Falls alles nicht funktioniert, hier die komplette Neuinstallation:

```bash
# 1. Alles stoppen und löschen
docker compose down -v
docker system prune -af

# 2. .env erstellen (falls nicht vorhanden)
cp .env.example .env

# 3. Bauen und starten
docker compose up --build

# 4. Prüfen ob Container laufen
docker ps

# 5. API Health Check
curl -H "X-Contract-Version: 1" http://localhost:8000/health

# 6. Im Browser öffnen
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

