# Known Gaps & Technical Debt

Dieses Dokument listet bewusste MVP-Entscheidungen, technische Schulden und bekannte Risiken auf.

**Stand: Sprint 1 Complete (v1.0.0)**

> ✅ = In Sprint 1 behoben | ⏳ = Für Sprint 2 geplant

---

## 🔴 Critical (Muss vor Production behoben werden)

### 1. In-Memory Rate Limiting

**Problem:** Rate Limit Store ist im Application Memory. Bei horizontaler Skalierung (mehrere Instanzen) werden Limits nicht geteilt.

**Risiko:** Ein User kann das Rate Limit umgehen, indem Requests auf verschiedene Instanzen verteilt werden.

**Lösung:** Redis-basierter Rate Limiter mit Sliding Window.

**Aufwand:** ~4h

---

### 2. Keine Payment-Integration

**Problem:** Credits können nur manuell von Admins vergeben werden. Keine automatische Aufladung.

**Risiko:** Kein Self-Service für Kunden, hoher manueller Aufwand.

**Lösung:** Stripe/PayPal Integration für Credit-Kauf.

**Aufwand:** ~3 Tage

---

### 3. Session-Validierung bei Logout

**Problem:** Bei Logout wird die Session aus der DB gelöscht, aber bestehende Requests mit gültigem Cookie können noch durchkommen (Timing Window).

**Risiko:** Minimal, da Sessions kurzlebig sind.

**Lösung:** Redis Session Store mit sofortiger Invalidierung.

**Aufwand:** ~4h

---

## 🟡 Important (Sollte zeitnah adressiert werden)

### 4. Keine Error Tracking (Sentry)

**Problem:** Frontend-Fehler werden nicht zentral erfasst. Backend-Fehler nur in Logs.

**Risiko:** Schwer zu debuggende Kundenprobleme, langsame Reaktionszeit.

**Lösung:** Sentry-Integration für Frontend und Backend.

**Aufwand:** ~2h

---

### 5. Keine Transaktions-E-Mails

**Problem:** Keine E-Mails bei Registrierung, Submit, Passwort-Reset.

**Risiko:** Kein Verifizierungsfluss, Kunden ohne Bestätigung.

**Lösung:** E-Mail-Service (SendGrid, AWS SES) + Templates.

**Aufwand:** ~2 Tage

---

### 6. ~~Keine Health Check für DB~~ ✅ BEHOBEN (P1p14)

**Status:** `/health` (Liveness) und `/ready` (Readiness mit DB-Check) implementiert.

---

### 7. Keine Logging-Aggregation

**Problem:** Logs gehen nach stdout. In Production wäre ein zentrales Log-Management nötig.

**Risiko:** Schwieriges Debugging bei mehreren Instanzen.

**Lösung:** ELK Stack, Datadog, oder CloudWatch Logs.

**Aufwand:** ~4h (Configuration)

---

### 8. Test Coverage Gaps

**Problem:** E2E-Tests für Frontend fehlen (Playwright/Cypress). Backend-Tests decken nicht alle Edge Cases.

**Risiko:** Regressions bei größeren Änderungen.

**Lösung:** E2E-Test Suite aufbauen.

**Aufwand:** ~2 Tage

---

## 🟢 Nice-to-Have (Kann später adressiert werden)

### 9. Keine React Error Boundary

**Problem:** Unerwartete Render-Fehler crashen die App ohne Fallback.

**Risiko:** Schlechte UX bei Bugs.

**Lösung:** Global Error Boundary mit Retry-Option.

**Aufwand:** ~2h

---

### 10. Keine Circuit Breaker

**Problem:** Kaskadierende Fehler bei DB-Ausfall nicht abgefangen.

**Risiko:** Alle Requests schlagen fehl statt graceful degradation.

**Lösung:** Circuit Breaker Pattern mit Fallback.

**Aufwand:** ~4h

---

### 11. Keine Metriken (Prometheus)

**Problem:** Keine Request Latency, Error Rate, Credit Consumption Metriken.

**Risiko:** Keine Observability für Performance-Issues.

**Lösung:** Prometheus + Grafana Dashboards.

**Aufwand:** ~1 Tag

---

### 12. Single PDF Template

**Problem:** Nur ein generisches PDF-Template. Keine procedure-spezifischen Layouts.

**Risiko:** Weniger professionell für bestimmte Verfahren.

**Lösung:** Template-Auswahl basierend auf Procedure Code.

**Aufwand:** ~4h

---

### 13. Keine Batch-Operationen

**Problem:** Bulk-Aktionen (mehrere Cases archivieren, Credits vergeben) nicht möglich.

**Risiko:** Ineffizient für Admin-Tasks.

**Lösung:** Batch-Endpoints im Admin-API.

**Aufwand:** ~4h

---

### 14. Frontend i18n

**Problem:** Nur Deutsch, keine Internationalisierung vorbereitet.

**Risiko:** Aufwändig nachzurüsten.

**Lösung:** next-intl oder react-i18next Integration.

**Aufwand:** ~2 Tage

---

### 15. Keine Audit Logs (außer Credits)

**Problem:** Nur Credit-Ledger hat Audit Trail. Andere Aktionen (Login, Case Edit) nicht.

**Risiko:** Compliance-Anforderungen nicht erfüllt.

**Lösung:** Generisches Audit Log System.

**Aufwand:** ~1 Tag

---

## 📋 Technical Debt Log

| ID | Bereich | Beschreibung | Priorität | Geschätzt |
|----|---------|--------------|-----------|-----------|
| TD-001 | Rate Limit | In-Memory → Redis | 🔴 | 4h |
| TD-002 | Payment | Stripe Integration | 🔴 | 3 Tage |
| TD-003 | Session | Redis Session Store | 🔴 | 4h |
| TD-004 | Observability | Sentry Integration | 🟡 | 2h |
| TD-005 | Email | Transaktions-E-Mails | 🟡 | 2 Tage |
| TD-006 | Health | ~~DB Health Check~~ | ✅ | – |
| TD-007 | Logging | Log Aggregation | 🟡 | 4h |
| TD-008 | Testing | E2E Tests | 🟡 | 2 Tage |
| TD-009 | Frontend | Error Boundary | 🟢 | 2h |
| TD-010 | Resilience | Circuit Breaker | 🟢 | 4h |
| TD-011 | Metrics | Prometheus | 🟢 | 1 Tag |
| TD-012 | PDF | Template-Auswahl | 🟢 | 4h |
| TD-013 | Admin | Batch-Endpoints | 🟢 | 4h |
| TD-014 | i18n | Internationalisierung | 🟢 | 2 Tage |
| TD-015 | Audit | General Audit Log | 🟢 | 1 Tag |

---

## 🔒 Security Considerations

### Bereits implementiert:
- HTTP-only Session Cookies
- CORS Restrictions
- Tenant Isolation (alle Queries tenant-scoped)
- RBAC (Role-Based Access Control)
- Rate Limiting (basic)
- Input Validation (Pydantic)
- SQL Injection Protection (Prisma ORM)

### Noch offen:
- [ ] CSRF-Token für State-ändernde Requests
- [ ] Password Strength Policy (aktuell nur min 8 chars)
- [ ] Account Lockout nach X Fehlversuchen
- [ ] Session Invalidation on Password Change
- [ ] 2FA (Two-Factor Authentication)
- [ ] IP-based Rate Limiting (zusätzlich zu Tenant)

---

## 📌 Known Bugs

Keine bekannten Bugs zum aktuellen Zeitpunkt.

Wenn Bugs entdeckt werden, hier dokumentieren mit:
- **Symptom**: Was passiert?
- **Reproduktion**: Schritte
- **Workaround**: Falls vorhanden
- **Fix Status**: Offen/In Arbeit/Geschlossen

---

## 🔄 Migration Path

Für Production-Readiness empfohlene Reihenfolge:

1. **Phase 1 (Vor Go-Live):**
   - TD-001: Redis Rate Limit
   - TD-003: Redis Sessions
   - ~~TD-006: DB Health Check~~ ✅
   - Security: CSRF, Account Lockout

2. **Phase 2 (Direkt nach Go-Live):**
   - TD-004: Sentry
   - TD-007: Log Aggregation
   - TD-005: E-Mails

3. **Phase 3 (Bei Wachstum):**
   - TD-002: Payment Integration
   - TD-011: Prometheus
   - TD-008: E2E Tests

---

*Letzte Aktualisierung: Sprint 1 Abschluss (v1.0.0)*

