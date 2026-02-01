# 01 - Projektüberblick

**Stand:** 2026-02-01
**Dokumenttyp:** Handover-Dokumentation
**Autor:** Automatisierte Analyse

---

## Zusammenfassung

**ZollPilot** ist ein B2B/B2C-SaaS-Produkt zur **Vorbereitung von Zollanmeldungen**. Die Plattform führt Nutzer durch strukturierte Formulare für verschiedene Zollverfahren und generiert daraus exportierbare Übersichten (PDF).

**Kernaussage:** ZollPilot ist ein **Ausfüllhilfe-Tool**, kein Zoll-Gateway. Die eigentliche Übermittlung an Behörden erfolgt durch den Nutzer selbst.

---

## Das Problem, das ZollPilot löst

| Problem | ZollPilot-Lösung |
|---------|------------------|
| Zollformulare sind komplex und fehleranfällig | Geführte Wizard-Flows mit Validierung |
| Nutzer wissen nicht, welche Felder wohin gehören | Mapping-Ansicht zeigt Zuordnung zu Zollformularen |
| Daten müssen manuell übertragen werden | Export als formatierte PDF mit Copy-Assist |
| Wiederholte Eingaben bei ähnlichen Sendungen | Profil-Daten werden vorausgefüllt |
| Unsicherheit bei fachlichen Begriffen | Knowledge Base mit Erklärungen zu Zollthemen |

---

## Zielgruppen (aus Code abgeleitet)

### 1. Privatpersonen (`UserType.PRIVATE`)
- **Anwendungsfall:** Einzelne Importe aus dem Nicht-EU-Ausland
- **Verfahren:** IZA (Internetbestellung - Import Zollanmeldung)
- **Typisches Szenario:** Bestellung aus China/USA, Wert über 150 EUR

### 2. Unternehmen (`UserType.BUSINESS`)
- **Anwendungsfall:** Regelmäßige Import-/Exportvorgänge
- **Verfahren:**
  - IPK (Import-Paketverkehr) - für Geschäftsimporte
  - IAA (Internet-Ausfuhranmeldung) - für Exporte
- **Typisches Szenario:** E-Commerce-Händler, kleine Exporteure

### Evidenz aus Code:
```typescript
// apps/web/src/procedures/IZA/v1/meta.ts
targetAudience: "Private"

// apps/web/src/procedures/IPK/v1/meta.ts
targetAudience: "Business"

// apps/web/src/procedures/IAA/v1/meta.ts
targetAudience: "Business"
```

---

## Reifegrad

**Einstufung: Fortgeschrittener Prototyp / Frühe Alpha**

| Kriterium | Bewertung | Begründung |
|-----------|-----------|------------|
| Code-Qualität | ● ● ● ○ ○ | Strukturiert, aber lückenhaft getestet |
| Architektur | ● ● ● ● ○ | Saubere Trennung, skalierbar konzipiert |
| Feature-Vollständigkeit | ● ● ● ○ ○ | 3 Verfahren, kein Payment, keine E-Mails |
| Produktionsreife | ● ● ○ ○ ○ | Kritische Gaps (Rate Limiting, Monitoring) |
| Dokumentation | ● ● ● ● ○ | Umfangreich, aber teilweise veraltet |
| Sicherheit | ● ● ● ○ ○ | Solide Basis, CORS/Header-Lücken |

---

## Was heute real existiert

### Implementiert und funktionsfähig

| Feature | Status | Bemerkung |
|---------|--------|-----------|
| Benutzerregistrierung/-login | ✅ | Session-basiert, Multi-Tenant |
| IZA-Verfahren (Import privat) | ✅ | 4 Schritte, vollständige Validierung |
| IPK-Verfahren (Import Business) | ✅ | 3 Schritte, vollständige Validierung |
| IAA-Verfahren (Export Business) | ✅ | 3 Schritte, vollständige Validierung |
| Wizard mit Autosave | ✅ | Debounced, Feld-für-Feld |
| Case-Lifecycle (Draft→Submit→Archive) | ✅ | Mit immutablen Snapshots |
| PDF-Export | ✅ | WeasyPrint, Credit-basiert |
| Credits-System | ✅ | Ledger, Balance, Admin-Vergabe |
| Admin-Panel (Basis) | ✅ | Tenants, Plans, Credits, Events |
| Blog & FAQ | ✅ | MDX-Content, CRUD via Admin |
| Knowledge Base | ✅ | Topics, Entries, API |
| Rechnungs-Prefill | ✅ | Regex-basiert, kein AI |
| Multi-Tenant-Isolation | ✅ | Alle Queries tenant-scoped |
| RBAC | ✅ | 5 Rollen-Hierarchie |

### Nicht implementiert (explizit abgegrenzt)

| Feature | Status | Begründung |
|---------|--------|------------|
| Payment-Integration | ❌ | Credits nur manuell vergeben |
| E-Mail-Benachrichtigungen | ❌ | Keine Transaktionsmails |
| ATLAS-Anbindung | ❌ | Bewusst out of scope |
| HSCode-Lookup | ❌ | Kein Tarif-Service integriert |
| Zoll-/MwSt-Berechnung | ❌ | Keine Steuerberechnung |
| AI/LLM-Unterstützung | ❌ | Prefill ist Regex, kein ML |
| Mobile App | ❌ | Web-First |
| Multi-Language | ❌ | Nur Deutsch |

---

## Was das Projekt werden soll (Vision)

**Interpretation basierend auf Code-Struktur und Roadmap:**

### Kurzfristig (nächste 3 Monate)
- Self-Service Payment (Stripe) für Credit-Kauf
- E-Mail-Benachrichtigungen
- Redis-basiertes Rate Limiting für Skalierung

### Mittelfristig (6-12 Monate)
- HSCode-Lookup mit Autocomplete
- Zoll-/MwSt-Vorschau-Kalkulator
- Weitere Zollverfahren

### Langfristig (Vision)
- KI-gestützte Feldvorschläge (aktuell nur Regex)
- API für Drittanbieter-Integrationen
- White-Label-Fähigkeit für Enterprise

**Explizit nicht geplant:** Direkte ATLAS-Anbindung zur Behördenübermittlung

---

## Technologie-Stack

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Frontend | Next.js (App Router) | 14.2.22 |
| UI | React + TailwindCSS | 18.3.1 / 3.4.19 |
| Backend | FastAPI (Python) | 0.115.6 |
| ORM | Prisma (Python Client) | 0.13.1 |
| Datenbank | PostgreSQL | 15 |
| PDF | WeasyPrint + Jinja2 | 62.3 |
| Container | Docker (Multi-Stage) | - |
| CI/CD | GitHub Actions | - |

---

## Deployment-Modell

```
┌─────────────────────────────────────────────────┐
│                Load Balancer / CDN               │
└─────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
   ┌─────▼─────┐               ┌───────▼──────┐
   │ Web (Next)│               │ API (FastAPI)│
   │ Port 3000 │               │  Port 8000   │
   │ Node 22   │               │  Python 3.12 │
   └───────────┘               └──────────────┘
                                      │
                               ┌──────▼──────┐
                               │ PostgreSQL  │
                               │  Port 5432  │
                               └─────────────┘
```

**Lokale Entwicklung:** `docker compose up --build`

---

## Metriken (Stand der Analyse)

| Metrik | Wert |
|--------|------|
| Python-Dateien (API) | ~36 |
| TypeScript-Dateien (Web) | ~125 |
| Prisma-Modelle | 20+ |
| DB-Migrationen | 14 |
| API-Route-Module | 13 |
| Backend-Tests | 24 Dateien |
| Frontend-Tests | 51+ Dateien |
| Dokumentation | 80+ Markdown-Dateien |

---

## Fazit

ZollPilot ist ein **ernstzunehmendes Projekt** mit durchdachter Architektur, das die kritischen Bausteine für eine SaaS-Plattform implementiert hat. Die Kernfunktionalität (geführte Zollverfahren mit Export) ist vollständig.

**Stärken:**
- Saubere Multi-Tenant-Architektur
- Config-driven Procedure Engine
- Immutable Audit-Trail (Snapshots, Ledger)
- Umfangreiche Dokumentation

**Kritische Lücken für Produktivbetrieb:**
- Keine Payment-Integration → Kein Self-Service
- In-Memory Rate Limiting → Nicht skalierbar
- Keine E-Mails → Keine Nutzerverifizierung
- Keine Observability → Kein Monitoring

**Empfehlung:** Das Projekt ist tragfähig für einen Early-Access-Beta-Launch mit manuellem Onboarding. Für Self-Service-SaaS fehlen Payment und E-Mails.
