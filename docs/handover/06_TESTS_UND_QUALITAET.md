# 06 - Tests und Qualität

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Vorhandene Tests

### Backend (Python/pytest)

**Pfad:** `/apps/api/tests/`
**Framework:** pytest 8.3.3
**Testanzahl:** 24 Dateien

| Datei | Typ | Abdeckung |
|-------|-----|-----------|
| `test_auth.py` | Unit/Integration | Registrierung, Login, Logout, Session |
| `test_cases.py` | Integration | CRUD, Fields, Status-Übergänge |
| `test_procedures.py` | Unit | Validierungslogik |
| `test_iza_validation.py` | Unit | IZA-spezifische Regeln |
| `test_lifecycle.py` | Integration | Submit, Snapshots |
| `test_pdf.py` | Integration | PDF-Generierung |
| `test_billing.py` | Integration | Credits, Ledger |
| `test_checkout.py` | Integration | Stripe-Flow (Mocks) |
| `test_content.py` | Integration | Blog, FAQ APIs |
| `test_knowledge.py` | Integration | Knowledge Base |
| `test_admin_views.py` | Integration | Admin-Endpunkte |
| `test_admin_content.py` | Integration | Content-Admin |
| `test_security_isolation.py` | Security | Tenant-Isolation (18+ Tests) |
| `test_rate_limit.py` | Unit | Rate Limiting |
| `test_contract_version.py` | Unit | API-Versioning |
| `test_health.py` | Unit | Health Probes |
| `test_prefill.py` | Unit | Rechnungs-Extraktion |
| `test_config.py` | Unit | Config-Validierung |
| `test_json_normalization.py` | Unit | JSON-Handling |
| `test_user_types.py` | Integration | UserType-Handling |
| `test_e2e_happy_path.py` | E2E-like | Kompletter User-Flow |

**Geschätzte LOC:** ~9.500

### Frontend (TypeScript/Vitest)

**Pfad:** `/apps/web/tests/`
**Framework:** Vitest 2.0.5 + Testing Library
**Testanzahl:** 51+ Dateien

| Datei | Typ | Abdeckung |
|-------|-----|-----------|
| `login.test.tsx` | Component | Login-Formular |
| `dashboard.test.tsx` | Component | Dashboard-Komponenten |
| `cases-page.test.tsx` | Component | Case-Liste |
| `case-detail.test.tsx` | Component | Case-Detail-Ansicht |
| `wizard.test.tsx` | Component | Wizard-Logik |
| `billing.test.tsx` | Component | Billing-Seite |
| `billing-page.test.tsx` | Component | Billing-UI |
| `admin-ui.test.tsx` | Component | Admin-Panel |
| `app-ui.test.tsx` | Component | App-Shell |
| `public-pages.test.tsx` | Component | Öffentliche Seiten |
| `content.test.tsx` | Component | Blog/FAQ |
| `api-client.test.ts` | Unit | API-Client |
| `auth-cookie.test.ts` | Unit | Cookie-Handling |
| `guard.test.ts` | Unit | Route-Guards |
| `seo.test.ts` | Unit | Meta-Tags |
| `errors.test.tsx` | Component | Error-Banner |
| `design-system.test.tsx` | Component | UI-Primitives |
| `mapping-view.test.tsx` | Component | Mapping-Ansicht |
| `Sidebar.test.tsx` | Component | Sidebar |
| `useSidebarState.test.ts` | Hook | Sidebar-State |

**Geschätzte LOC:** ~6.500

---

## Einschätzung der Testabdeckung

### Backend

| Bereich | Abdeckung | Bewertung |
|---------|-----------|-----------|
| **Auth/Session** | Hoch | Gut getestet |
| **Cases CRUD** | Hoch | Comprehensive |
| **Procedure Validation** | Hoch | Alle 3 Verfahren |
| **Security/Isolation** | Sehr hoch | 18+ dedizierte Tests |
| **Billing/Credits** | Mittel | Happy Path, wenig Edge Cases |
| **PDF Generation** | Mittel | Funktional, wenig Edge Cases |
| **Admin Routes** | Mittel | Basis-Abdeckung |
| **Error Handling** | Niedrig | Wenig explizite Tests |

**Geschätzte Gesamt-Coverage:** ~65-70%

### Frontend

| Bereich | Abdeckung | Bewertung |
|---------|-----------|-----------|
| **Login/Register** | Hoch | Form-Validierung getestet |
| **Dashboard** | Hoch | Comprehensive (~500 LOC) |
| **Case List/Detail** | Mittel | Basis-Rendering |
| **Wizard** | Mittel | Logik getestet, wenig UI |
| **Billing** | Mittel | Happy Path |
| **Admin** | Niedrig-Mittel | Basis-Tests |
| **Hooks** | Mittel | Einige getestet |
| **API Client** | Hoch | Contract-Tests |

**Geschätzte Gesamt-Coverage:** ~50-60%

---

## Kritische Pfade ohne Tests

### Backend

| Pfad | Risiko | Empfehlung |
|------|--------|------------|
| **Concurrent Submit** | Hoch | Race-Condition-Tests |
| **Credit Underflow** | Mittel | Negative-Balance-Tests |
| **Session Expiry Edge Cases** | Mittel | Grenzwert-Tests |
| **Large File Upload** | Mittel | Size-Limit-Tests |
| **Malformed JSON** | Niedrig | Fuzzing |
| **DB Connection Failure** | Mittel | Circuit-Breaker-Tests |

### Frontend

| Pfad | Risiko | Empfehlung |
|------|--------|------------|
| **Wizard mit vielen Feldern** | Mittel | Performance-Tests |
| **Offline/Network Failure** | Hoch | Error-State-Tests |
| **Session Timeout während Eingabe** | Hoch | Token-Refresh-Tests |
| **Browser Back/Forward** | Mittel | Navigation-Tests |
| **Mobile Responsiveness** | Mittel | Viewport-Tests |
| **Accessibility** | Hoch | a11y-Tests (fehlen komplett) |

---

## Qualitäts-Red-Flags

### 1. Keine E2E-Browser-Tests 🔴

**Problem:** Kein Playwright, kein Cypress

**Risiko:**
- Login-Flow nicht in echtem Browser getestet
- Form-Submits nicht E2E verifiziert
- Cross-Browser-Kompatibilität unbekannt

**Empfehlung:** Playwright für kritische Flows

### 2. Frontend Linting nicht funktional 🔴

**Problem:** ESLint in CI referenziert aber nicht konfiguriert

**Evidenz:**
```yaml
# .github/workflows/ci.yml:86
- run: npm run lint || true  # Silently fails
```

**Risiko:** Code-Qualitätsprobleme werden nicht erkannt

**Empfehlung:** ESLint konfigurieren, `|| true` entfernen

### 3. Keine Code-Coverage-Reports 🟡

**Problem:** Weder pytest noch Vitest generieren Coverage

**Risiko:** Keine Sichtbarkeit über Testlücken

**Empfehlung:**
```bash
# Backend
pytest --cov=app --cov-report=xml

# Frontend
vitest --coverage
```

### 4. Type-Checking optional 🟡

**Problem:** mypy läuft mit `|| true`

**Evidenz:**
```yaml
# .github/workflows/ci.yml:49
- run: mypy app/ --ignore-missing-imports || true
```

**Risiko:** Type-Fehler werden nicht blockiert

**Empfehlung:** Strict mypy, `|| true` entfernen

### 5. Keine Accessibility-Tests 🟡

**Problem:** Kein axe-core, kein a11y-Testing

**Risiko:** WCAG-Compliance unbekannt

**Empfehlung:** Testing Library a11y-Queries, axe-core

### 6. Keine Visual Regression Tests 🟢

**Problem:** Keine Screenshot-Vergleiche

**Risiko:** UI-Regressions unbemerkt

**Empfehlung:** Playwright Visual Comparisons oder Chromatic

---

## CI/CD-Pipeline

### Aktueller Workflow

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r apps/api/requirements.txt
      - run: ruff check app/ tests/              # ✅ Linting
      - run: mypy app/ || true                   # ⚠️ Optional
      - run: pytest tests/ -v                    # ✅ Tests

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "22" }
      - run: npm ci
      - run: npm run lint || true                # ⚠️ Broken
      - run: npx tsc --noEmit                    # ✅ Type-Check
      - run: npm test -- --run                   # ✅ Tests
      - run: npm run build                       # ✅ Build

  docker:
    runs-on: ubuntu-latest
    steps:
      - run: docker build apps/api               # ✅ API Image
      - run: docker build apps/web               # ✅ Web Image

  security:
    runs-on: ubuntu-latest
    steps:
      - run: trivy image ...                     # ✅ Vulnerability Scan
```

### CI-Probleme

| Problem | Zeile | Empfehlung |
|---------|-------|------------|
| `npm run lint \|\| true` | 86 | ESLint konfigurieren, fail-fast |
| `mypy ... \|\| true` | 49 | Strict enforcement |
| Keine Coverage | - | pytest-cov, vitest coverage |
| Keine Artifacts | - | Test-Reports speichern |

---

## Voraussetzungen für Produktivbetrieb

### Muss-Tests vor Go-Live

| Test | Priorität | Aufwand |
|------|-----------|---------|
| **E2E: Login → Case → Submit → PDF** | 🔴 Kritisch | 2 Tage |
| **E2E: Payment Flow (mit Stripe Test)** | 🔴 Kritisch | 1 Tag |
| **Security: OWASP Top 10 Scan** | 🔴 Kritisch | 1 Tag |
| **Load: 100 concurrent Users** | 🟡 Wichtig | 1 Tag |
| **Accessibility: WCAG 2.1 AA** | 🟡 Wichtig | 2 Tage |

### Empfohlene Test-Erweiterungen

```
tests/
├── e2e/                          # Playwright
│   ├── auth.spec.ts              # Login/Register
│   ├── case-flow.spec.ts         # Case-Lifecycle
│   ├── payment.spec.ts           # Checkout
│   └── admin.spec.ts             # Admin-Panel
│
├── integration/                  # API-Integration
│   ├── concurrent-submit.test.ts # Race Conditions
│   └── session-edge-cases.test.ts
│
├── accessibility/                # a11y
│   ├── wizard.a11y.test.ts
│   └── forms.a11y.test.ts
│
└── visual/                       # Visual Regression
    ├── dashboard.visual.ts
    └── wizard.visual.ts
```

---

## Test-Qualitätsmetriken (Soll)

| Metrik | Aktuell | Ziel |
|--------|---------|------|
| Backend Coverage | ~65% | >80% |
| Frontend Coverage | ~50% | >70% |
| E2E Critical Paths | 0 | 5+ Flows |
| a11y Tests | 0 | Alle Formulare |
| CI-Laufzeit | ~5 min | <10 min |
| Flaky Tests | Unbekannt | <2% |

---

## Zusammenfassung

| Aspekt | Bewertung | Begründung |
|--------|-----------|------------|
| **Test-Vorhanden** | ✅ Gut | 75+ Test-Dateien, ~16k LOC |
| **Test-Coverage** | ⚠️ Lückenhaft | Keine Messung, geschätzt 55-65% |
| **E2E-Tests** | ❌ Fehlen | Kein Playwright/Cypress |
| **CI-Pipeline** | ⚠️ Funktional | Linting broken, optional checks |
| **Security-Tests** | ✅ Gut | Tenant-Isolation gut getestet |
| **Accessibility** | ❌ Fehlt | Keine a11y-Tests |
| **Produktionsreife** | ⚠️ Bedingt | Kritische E2E fehlen |
