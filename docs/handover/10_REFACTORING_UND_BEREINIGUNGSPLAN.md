# 10 - Refactoring und Bereinigungsplan

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Sofort-Refactorings (geringes Risiko, hoher Nutzen)

### 1. Security Headers Middleware

**Aufwand:** 1-2 Stunden
**Risiko:** Minimal
**Nutzen:** Hoch (Security-Baseline)

**Implementierung:**
```python
# apps/api/app/middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # HSTS nur in Production
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

# In main.py hinzufügen
app.add_middleware(SecurityHeadersMiddleware)
```

---

### 2. CORS Header-Whitelist

**Aufwand:** 30 Minuten
**Risiko:** Minimal
**Nutzen:** Mittel (Security)

**Änderung:**
```python
# apps/api/app/main.py
# Vorher:
allow_headers=["*"]

# Nachher:
allow_headers=[
    "Content-Type",
    "Authorization",
    "X-Contract-Version",
    "X-Request-Id",
]
```

---

### 3. CI Linting Fix

**Aufwand:** 1-2 Stunden
**Risiko:** Minimal
**Nutzen:** Hoch (Code-Qualität)

**Änderungen:**

1. ESLint konfigurieren:
```json
// apps/web/.eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

2. CI-Workflow korrigieren:
```yaml
# .github/workflows/ci.yml
# Vorher:
- run: npm run lint || true

# Nachher:
- run: npm run lint
```

3. mypy enforced:
```yaml
# Vorher:
- run: mypy app/ --ignore-missing-imports || true

# Nachher:
- run: mypy app/ --ignore-missing-imports
```

---

### 4. Toter Code entfernen: CaseField.value_text

**Aufwand:** 30 Minuten
**Risiko:** Gering (Migration nötig)
**Nutzen:** Gering (Bereinigung)

**Entscheidung:** Entweder nutzen (Fulltext-Suche) oder entfernen

**Falls entfernen:**
```sql
-- Migration
ALTER TABLE "CaseField" DROP COLUMN "value_text";
```

---

### 5. Debug-Logging bereinigen

**Aufwand:** 30 Minuten
**Risiko:** Minimal
**Nutzen:** Mittel (Security)

**Änderung:**
```python
# apps/api/app/middleware/session.py
# Vorher:
logger.error(f"raw_cookie_header={raw_cookie_header}, token_hash={token_hash}")

# Nachher:
logger.warning("Session token invalid or expired")
```

---

## Strukturelle Refactorings (mittleres Risiko)

### 6. Domain-Module aufteilen

**Aufwand:** 1-2 Tage
**Risiko:** Mittel (viele Abhängigkeiten)
**Nutzen:** Hoch (Wartbarkeit)

**Aktuelle Struktur:**
```
app/domain/
└── procedures.py  # 460+ LOC - Monolith
```

**Zielstruktur:**
```
app/domain/
├── __init__.py
├── procedures/
│   ├── __init__.py
│   ├── loader.py           # ProcedureLoader
│   ├── validator.py        # ProcedureValidator
│   └── rules/
│       ├── __init__.py
│       ├── base.py         # BaseRule
│       ├── iza.py          # IZA-spezifische Regeln
│       ├── ipk.py          # IPK-spezifische Regeln
│       └── iaa.py          # IAA-spezifische Regeln
└── summary.py              # Unverändert
```

**Schritte:**
1. Tests für bestehende Funktionalität schreiben
2. Klassen extrahieren
3. Import-Pfade aktualisieren
4. Tests verifizieren

---

### 7. Cases-Route aufteilen

**Aufwand:** 4-8 Stunden
**Risiko:** Mittel
**Nutzen:** Mittel (Wartbarkeit)

**Aktuelle Struktur:**
```
app/routes/
└── cases.py  # ~400 LOC - CRUD + Fields + Validation
```

**Zielstruktur:**
```
app/routes/
├── cases/
│   ├── __init__.py         # Router-Aggregation
│   ├── crud.py             # Create, Read, Update, Delete
│   ├── fields.py           # Field-Management
│   └── validation.py       # Validierungs-Endpunkte
```

---

### 8. Content-Migrationen konsolidieren

**Aufwand:** 2-4 Stunden
**Risiko:** Mittel (DB-Änderung)
**Nutzen:** Mittel (Konsistenz)

**Problem:** Content-Tabellen möglicherweise außerhalb Prisma erstellt

**Schritte:**
1. Aktuellen DB-Stand prüfen
2. Prisma Introspection: `prisma db pull`
3. Fehlende Migrationen generieren
4. `prisma migrate status` verifizieren

---

### 9. Wizard-Komponenten aufteilen

**Aufwand:** 1-2 Tage
**Risiko:** Mittel (UI-Änderungen)
**Nutzen:** Hoch (Wartbarkeit, Testbarkeit)

**Aktuelle Struktur:**
```
app/cases/[id]/wizard/
├── page.tsx
└── WizardClient.tsx  # ~350 LOC - Monolith
```

**Zielstruktur:**
```
app/cases/[id]/wizard/
├── page.tsx
├── components/
│   ├── WizardContainer.tsx    # State-Management
│   ├── WizardSidebar.tsx      # Step-Navigation
│   ├── WizardForm.tsx         # Formular-Container
│   └── fields/
│       ├── TextField.tsx
│       ├── NumberField.tsx
│       ├── SelectField.tsx
│       ├── CountryField.tsx
│       ├── CurrencyField.tsx
│       └── BooleanField.tsx
└── hooks/
    ├── useWizardState.ts
    ├── useAutoSave.ts
    └── useValidation.ts
```

---

## Langfristige Architekturverbesserungen

### 10. Redis-Integration

**Aufwand:** 2-3 Tage
**Risiko:** Mittel (neue Infrastruktur)
**Nutzen:** Hoch (Skalierbarkeit)

**Komponenten:**
1. **Rate Limiting** - Redis Sliding Window
2. **Session Caching** - Optional, nach DB-Lookup cachen
3. **General Cache** - Procedure-Definitionen

**Infrastruktur:**
```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

---

### 11. Event-Sourcing für Audit

**Aufwand:** 1-2 Wochen
**Risiko:** Hoch (Architektur-Änderung)
**Nutzen:** Hoch (Compliance)

**Idee:** Alle Änderungen als Events speichern

**Beispiel:**
```python
# Events statt direkte Updates
CaseFieldChanged(case_id, field_key, old_value, new_value, user_id, timestamp)
CaseStatusChanged(case_id, old_status, new_status, user_id, timestamp)
```

**Empfehlung:** Erst nach Product-Market-Fit

---

### 12. API-Gateway

**Aufwand:** 1 Woche
**Risiko:** Hoch (Infrastruktur)
**Nutzen:** Mittel (Skalierung)

**Wenn benötigt:**
- Kong, Traefik oder AWS API Gateway
- Zentrales Rate Limiting
- API Key Management
- Request/Response Transformation

**Empfehlung:** Erst bei >1000 DAU

---

## Dinge, die bewusst NICHT angefasst werden sollten

### 1. Session → JWT Migration

**Grund:** Funktioniert, Refactoring-Aufwand hoch, Nutzen gering

**Problem mit JWT:**
- Revocation komplex
- Token-Größe in Cookie
- Refresh-Token-Flow nötig

**Empfehlung:** Beibehalten, ggf. Redis für Session-Store

---

### 2. PostgreSQL → NoSQL

**Grund:** Relationales Modell passt zur Domäne

**PostgreSQL-Vorteile:**
- ACID für Finanzdaten (Credits)
- JSON-Support für flexible Felder
- Prisma-Integration

**Empfehlung:** Beibehalten

---

### 3. Monorepo → Multi-Repo

**Grund:** Monorepo funktioniert gut für Team-Größe

**Vorteile Monorepo:**
- Atomare Commits über Frontend/Backend
- Einfaches Dependency-Management
- Shared Packages

**Empfehlung:** Beibehalten bis Team >5 Entwickler

---

### 4. Next.js → SPA (Vite/CRA)

**Grund:** SSR-Vorteile für SEO, App Router ist modern

**Next.js-Vorteile:**
- Server Components
- Optimierte Builds
- Image Optimization
- SEO-Features

**Empfehlung:** Definitiv beibehalten

---

### 5. TailwindCSS → CSS-in-JS

**Grund:** Tailwind funktioniert, Team kennt es

**Tailwind-Vorteile:**
- Schnelle Entwicklung
- Konsistente Styles
- Kleine Bundle-Size

**Empfehlung:** Beibehalten

---

## Priorisierte Aufgabenliste

### Woche 1: Quick Wins

| # | Task | Aufwand | Risiko |
|---|------|---------|--------|
| 1 | Security Headers | 2h | Minimal |
| 2 | CORS Whitelist | 30m | Minimal |
| 3 | CI Linting Fix | 2h | Minimal |
| 4 | Debug Logging | 30m | Minimal |

### Woche 2-3: Strukturelle Verbesserungen

| # | Task | Aufwand | Risiko |
|---|------|---------|--------|
| 5 | Domain-Module aufteilen | 2d | Mittel |
| 6 | Content-Migrationen | 4h | Mittel |
| 7 | Cases-Route aufteilen | 8h | Mittel |

### Monat 2: Infrastruktur

| # | Task | Aufwand | Risiko |
|---|------|---------|--------|
| 8 | Redis Rate Limiting | 2d | Mittel |
| 9 | Wizard-Refactoring | 2d | Mittel |

### Langfristig

| # | Task | Aufwand | Risiko |
|---|------|---------|--------|
| 10 | Redis Session Cache | 1d | Gering |
| 11 | Event-Sourcing | 2w | Hoch |
| 12 | API Gateway | 1w | Hoch |

---

## Zusammenfassung

**Sofort machen (diese Woche):**
- Security Headers ← Kritisch für Produktion
- CORS-Fix ← Kritisch für Produktion
- CI-Linting ← Verhindert zukünftige Schulden

**Bald machen (nächster Monat):**
- Domain-Code aufteilen ← Wartbarkeit
- Redis Rate Limiting ← Skalierbarkeit

**Nicht machen:**
- Session→JWT, PostgreSQL→NoSQL, Monorepo→Multi
- Diese Entscheidungen sind gut und sollten bleiben
