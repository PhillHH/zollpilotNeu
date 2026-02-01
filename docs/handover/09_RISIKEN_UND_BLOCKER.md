# 09 - Risiken und Blocker

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation

---

## Technische Risiken

### 1. In-Memory Rate Limiting 🔴 KRITISCH

**Beschreibung:**
Rate-Limit-State wird im Application Memory gespeichert, nicht in einem verteilten Store.

**Code-Referenz:**
```python
# apps/api/app/middleware/rate_limit.py
class RateLimitMiddleware:
    def __init__(self):
        self.store: Dict[str, List[float]] = {}  # In-Memory
```

**Risiko:**
- Bei 2+ API-Instanzen wird Rate Limit pro Instanz gezählt
- User kann Limit umgehen durch Load-Balancer
- Bei Restart werden alle Limits zurückgesetzt

**Eintrittswahrscheinlichkeit:** Hoch (sobald horizontal skaliert wird)
**Schadensausmaß:** Mittel (API-Missbrauch möglich)

**Mitigation:** Redis-basierter Rate Limiter

**Aufwand:** 4-8 Stunden

---

### 2. Keine Error-Tracking-Integration 🟡 WICHTIG

**Beschreibung:**
Keine Sentry, Bugsnag oder ähnliches integriert.

**Risiko:**
- Frontend-Fehler werden nicht erfasst
- Schwer zu debuggen bei Kundenproblemen
- Keine Alerting bei Fehler-Spikes

**Eintrittswahrscheinlichkeit:** Hoch (Fehler passieren immer)
**Schadensausmaß:** Mittel (langsame Reaktion auf Bugs)

**Mitigation:** Sentry-Integration

**Aufwand:** 2-4 Stunden

---

### 3. Session-Invalidierung Timing 🟢 NIEDRIG

**Beschreibung:**
Bei Logout wird Session gelöscht, aber parallele Requests mit gültigem Cookie könnten noch durchkommen.

**Risiko:**
- Kurzes Zeitfenster (~100ms) nach Logout
- Bestehende Requests könnten noch durchlaufen

**Eintrittswahrscheinlichkeit:** Niedrig
**Schadensausmaß:** Gering (Session ist dann eh gelöscht)

**Mitigation:** Redis Session Store mit Instant-Invalidierung

**Aufwand:** 4-8 Stunden

---

### 4. Keine Circuit Breaker 🟡 WICHTIG

**Beschreibung:**
Keine Resilience-Patterns bei externen Abhängigkeiten (DB, Stripe).

**Risiko:**
- Kaskadierende Fehler bei DB-Ausfall
- Alle Requests blockiert statt graceful degradation

**Eintrittswahrscheinlichkeit:** Niedrig
**Schadensausmaß:** Hoch (kompletter Ausfall)

**Mitigation:** Circuit Breaker Pattern implementieren

**Aufwand:** 1 Tag

---

## Architektonische Sackgassen

### 1. Monolithische Domain-Datei 🟡

**Beschreibung:**
`apps/api/app/domain/procedures.py` enthält 460+ LOC mit Loader, Validator und Business Rules.

**Risiko:**
- Schwer wartbar bei weiteren Verfahren
- God-Class Anti-Pattern
- Testbarkeit erschwert

**Auswirkung:** Technische Schulden akkumulieren

**Empfehlung:** Aufteilen in `procedures/loader.py`, `procedures/validator.py`, `procedures/rules/*.py`

---

### 2. Frontend ohne State-Management-Library 🟢

**Beschreibung:**
Kein Redux, Zustand oder React Query - nur useState/useReducer.

**Beurteilung:** Aktuell kein Problem, da Komplexität überschaubar.

**Risiko:** Bei wachsender Komplexität schwer nachzurüsten

**Empfehlung:** Beobachten, nicht sofort handeln

---

### 3. Content-Tabellen außerhalb Migrations 🟡

**Beschreibung:**
BlogPost, FaqEntry etc. sind im Schema, aber Migrations-Status unklar.

**Risiko:**
- Schema-Drift zwischen Prisma und DB
- `prisma migrate` könnte fehlschlagen

**Empfehlung:** Migration generieren und validieren

---

## Security- und Compliance-Risiken

### 1. CORS zu permissiv 🔴 KRITISCH

**Beschreibung:**
```python
CORSMiddleware(
    allow_headers=["*"],  # Erlaubt ALLE Header
)
```

**Risiko:**
- Unterminiert CORS-Schutz
- Custom Headers unkontrolliert

**Mitigation:** Explizite Header-Whitelist

**Aufwand:** 30 Minuten

---

### 2. Fehlende Security Headers 🔴 KRITISCH

**Beschreibung:**
Keine Standard-Security-Headers gesetzt.

**Fehlend:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`
- `Content-Security-Policy`

**Risiko:**
- Clickjacking möglich
- MIME-Type-Angriffe möglich
- Keine HSTS-Erzwingung

**Mitigation:** Security-Header-Middleware

**Aufwand:** 1-2 Stunden

---

### 3. Keine Account-Lockout 🟡 WICHTIG

**Beschreibung:**
Kein Schutz gegen Brute-Force-Angriffe auf Login.

**Risiko:**
- Passwort-Spraying möglich
- Keine automatische Sperre

**Mitigation:** Account-Lockout nach X Fehlversuchen

**Aufwand:** 4-8 Stunden

---

### 4. Password-Stärke minimal 🟡 WICHTIG

**Beschreibung:**
Nur min. 8 Zeichen, keine Komplexitätsanforderungen.

**Risiko:**
- Schwache Passwörter akzeptiert
- Leichteres Credential-Stuffing

**Mitigation:** Passwort-Policy (Groß/Klein/Zahl/Sonderzeichen)

**Aufwand:** 2 Stunden

---

### 5. Kein 2FA 🟢 NIEDRIG (für MVP)

**Beschreibung:**
Keine Zwei-Faktor-Authentifizierung.

**Risiko:**
- Bei kompromittiertem Passwort voller Zugriff

**Empfehlung:** Nach Product-Market-Fit priorisieren

---

### 6. DSGVO-Löschung nicht implementiert 🟡 WICHTIG

**Beschreibung:**
Kein automatisierter Prozess für "Recht auf Löschung".

**Risiko:**
- DSGVO-Compliance-Risiko
- Manuelle Löschung fehleranfällig

**Empfehlung:** Lösch-Workflow implementieren

---

## Risiken durch Solo-Entwicklung

### 1. Bus-Faktor = 1 🔴 KRITISCH

**Beschreibung:**
Ein Entwickler hat das gesamte Projekt erstellt.

**Risiko:**
- Keine zweite Person kennt den Code
- Ausfall = kompletter Stillstand
- Implizites Wissen nicht dokumentiert

**Mitigation:**
- Diese Handover-Dokumentation
- Onboarding eines zweiten Entwicklers
- Pair Programming Sessions

---

### 2. Keine Code Reviews 🟡

**Beschreibung:**
Vermutlich keine systematischen Code Reviews durchgeführt.

**Risiko:**
- Blinde Flecken unentdeckt
- Best Practices nicht durchgesetzt

**Mitigation:** PR-basierter Workflow mit Reviews

---

### 3. Persönliche Coding-Konventionen 🟢

**Beschreibung:**
Manche Entscheidungen spiegeln persönliche Präferenzen.

**Beispiele:**
- Deutsche Feldnamen (`geschaeftsart`)
- Bestimmte Verzeichnisstruktur

**Auswirkung:** Gering, konsistent innerhalb des Projekts

---

## Dinge die später teuer werden

### 1. Fehlende i18n von Anfang an

**Jetzt:** Hardcodierte deutsche Texte überall

**Später:** Nachträgliches Refactoring aller Strings

**Kosten:** 2-3 Wochen Refactoring + fortlaufende Übersetzung

**Empfehlung:** i18n-Setup jetzt, Übersetzung später

---

### 2. Keine automatischen Tests für A11y

**Jetzt:** Keine Accessibility-Tests

**Später:** WCAG-Compliance nachträglich herstellen

**Kosten:** 2-4 Wochen Audit + Fixes

**Empfehlung:** axe-core jetzt integrieren

---

### 3. Monolithische Deployment-Einheit

**Jetzt:** API als einzelner Service

**Später:** Microservices-Aufteilung schwierig

**Beurteilung:** Für MVP akzeptabel, bei Wachstum überdenken

---

### 4. Keine API-Rate-Limits pro Endpunkt-Typ

**Jetzt:** Globale Limits

**Später:** Unterschiedliche Limits für teure/günstige Operationen

**Empfehlung:** Jetzt Kategorien einführen (bereits teilweise vorhanden)

---

## Risiko-Matrix

| Risiko | Wahrscheinlichkeit | Schaden | Priorität |
|--------|-------------------|---------|-----------|
| In-Memory Rate Limit | Hoch | Mittel | 🔴 Kritisch |
| CORS zu permissiv | Hoch | Mittel | 🔴 Kritisch |
| Security Headers | Hoch | Mittel | 🔴 Kritisch |
| Bus-Faktor = 1 | Hoch | Hoch | 🔴 Kritisch |
| Keine Error-Tracking | Hoch | Mittel | 🟡 Wichtig |
| Account-Lockout | Mittel | Mittel | 🟡 Wichtig |
| Circuit Breaker | Niedrig | Hoch | 🟡 Wichtig |
| DSGVO-Löschung | Mittel | Mittel | 🟡 Wichtig |
| Session-Timing | Niedrig | Gering | 🟢 Niedrig |
| 2FA fehlt | Niedrig | Mittel | 🟢 Niedrig |

---

## Empfohlene Maßnahmenreihenfolge

### Phase 1: Vor Go-Live (1-2 Wochen)

1. ✅ Security Headers hinzufügen
2. ✅ CORS auf explizite Whitelist
3. ✅ Redis Rate Limiting
4. ✅ Account-Lockout
5. ✅ Sentry-Integration

### Phase 2: Nach Go-Live (1 Monat)

6. ⏳ Password-Policy verschärfen
7. ⏳ Circuit Breaker
8. ⏳ DSGVO-Löschworkflow
9. ⏳ Zweiter Entwickler onboarden

### Phase 3: Bei Wachstum (3+ Monate)

10. 📋 i18n-Framework
11. 📋 A11y-Testing
12. 📋 2FA
13. 📋 Domain-Code aufteilen

---

## Zusammenfassung

**Kritische Blocker für Produktion:**
- Security Headers (schnell behebbar)
- CORS-Konfiguration (schnell behebbar)
- Redis Rate Limiting (4-8h Aufwand)

**Mittelfristige Risiken:**
- Bus-Faktor durch Onboarding reduzieren
- Observability durch Sentry verbessern
- Compliance durch DSGVO-Workflow sichern

**Strategische Risiken:**
- i18n-Debt wird mit der Zeit teurer
- Solo-Entwicklung limitiert Geschwindigkeit
