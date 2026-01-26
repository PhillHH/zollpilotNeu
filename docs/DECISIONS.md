# Architecture Decision Records (ADR)

Dieses Dokument erfasst wichtige Architektur- und Technologieentscheidungen im Projekt ZollPilot.

Format: ADR-light (Kontext → Entscheidung → Konsequenzen)

---

## ADR-001: API-First Architektur

**Status:** Akzeptiert (Sprint 1)

### Kontext

Die Anwendung muss langfristig mehrere Clients unterstützen (Web, potentiell Mobile, Drittanbieter-Integrationen). Die Business-Logik soll zentral und wiederverwendbar sein.

### Entscheidung

Wir implementieren eine strikte API-First Architektur:
- Backend (FastAPI) besitzt alle Business-Logik
- Frontend (Next.js) ist ein reiner API-Consumer
- Kein direkter Datenbankzugriff aus dem Frontend
- OpenAPI-Dokumentation als Vertrag

### Konsequenzen

**Positiv:**
- Backend ist wiederverwendbar für Mobile/CLI
- Klare Trennung der Verantwortlichkeiten
- Einfachere Skalierung (Backend unabhängig vom Frontend)
- Swagger/OpenAPI automatisch verfügbar

**Negativ:**
- Mehr Netzwerk-Overhead (kein Server-Side-Rendering mit DB)
- Zwei separate Deployments notwendig
- CORS-Konfiguration erforderlich

---

## ADR-002: Prisma als ORM

**Status:** Akzeptiert (Sprint 1)

### Kontext

Wir benötigen einen Type-Safe Datenbankzugriff für PostgreSQL mit guter Migrations-Unterstützung.

### Entscheidung

Wir nutzen Prisma als ORM mit dem Python-Client (`prisma-client-py`):
- Schema-Definition in `prisma/schema.prisma`
- Migrationen via `prisma migrate`
- Type-Safe Queries in Python

### Konsequenzen

**Positiv:**
- Typsicherheit für DB-Queries
- Deklaratives Schema-Management
- Automatische Migrationen
- Gute PostgreSQL-Unterstützung

**Negativ:**
- Node.js Dependency auch im Python-Container (für CLI)
- Weniger Control über Raw-SQL
- Lernkurve für Prisma-spezifische Syntax

**Alternative betrachtet:** SQLAlchemy (zu viel Boilerplate für MVP)

---

## ADR-003: Session-basierte Authentifizierung

**Status:** Akzeptiert (Sprint 1)

### Kontext

Wir benötigen einen sicheren Authentifizierungsmechanismus für die Web-Anwendung.

### Entscheidung

Wir nutzen serverseitige Sessions mit HTTP-only Cookies:
- Sessions werden in PostgreSQL gespeichert
- Session-Token als HTTP-only Cookie
- Kein JWT für Business-Logik

### Konsequenzen

**Positiv:**
- Einfache Session-Invalidierung (Logout, Passwort-Änderung)
- Keine Token-Größe im Cookie (nur Session-ID)
- Serverseitige Session-Daten (User, Tenant, Role)
- Keine Client-seitigen Secrets

**Negativ:**
- DB-Lookup bei jedem Request
- Session-State auf Server
- Nicht stateless (problematisch bei horizontaler Skalierung ohne Shared State)

**Alternative betrachtet:** JWT (Revocation zu komplex für MVP)

---

## ADR-004: Config-Driven Procedure Engine

**Status:** Akzeptiert (Sprint 1)

### Kontext

Verschiedene Zollverfahren (IZA, IPK, IAA) haben unterschiedliche Formulare, Felder und Validierungsregeln. Diese können sich durch regulatorische Änderungen ändern.

### Entscheidung

Verfahren werden als Daten modelliert, nicht als Code:
- `Procedure`, `ProcedureStep`, `ProcedureField` in DB
- Generischer Wizard rendert jede Procedure
- Validierungsregeln pro Procedure definierbar
- Versionierung für Compliance

### Konsequenzen

**Positiv:**
- Neue Verfahren ohne Code-Deployment
- Regulatorische Änderungen als Daten-Update
- Alte Cases behalten ihre Procedure-Version
- Zentrale Validierung (nicht im UI verstreut)

**Negativ:**
- Komplexere Architektur
- Business-Rules in Config können unübersichtlich werden
- Admin-UI für Procedure-Pflege nicht implementiert

---

## ADR-005: Immutable Snapshots bei Submit

**Status:** Akzeptiert (Sprint 1)

### Kontext

Eingereichte Zollanmeldungen müssen rechtssicher dokumentiert werden. Der Zustand zum Zeitpunkt der Einreichung muss nachvollziehbar sein.

### Entscheidung

Bei Case-Submit wird ein immutabler `CaseSnapshot` erstellt:
- Enthält komplette `fields_json` zum Submit-Zeitpunkt
- Enthält `validation_json` mit Validierungsergebnis
- Procedure-Code und -Version gespeichert
- PDF wird aus Snapshot generiert (nicht aus aktuellem Case)

### Konsequenzen

**Positiv:**
- Rechtssicherheit: Exakter Zustand dokumentiert
- Reproduzierbare PDFs (Snapshot ist konstant)
- Audit-Trail: Wann wurde was eingereicht
- Basis für Versionierung (bei Reopen)

**Negativ:**
- Mehr Speicherplatz (Duplikation der Daten)
- Snapshot-Tabelle wächst mit jedem Submit
- Kein nachträgliches Editieren möglich (Design-Entscheidung)

---

## ADR-006: Credits ohne Payment

**Status:** Akzeptiert (Sprint 1)

### Kontext

Für das MVP benötigen wir ein Monetarisierungsmodell, aber keine vollständige Payment-Integration (Stripe, PayPal).

### Entscheidung

Credits-System mit manuellem Admin-Grant:
- `TenantCreditBalance` für aktuellen Stand
- `CreditLedgerEntry` als Audit-Trail
- Admin vergibt Credits manuell
- PDF-Export verbraucht 1 Credit

### Konsequenzen

**Positiv:**
- Schnelle MVP-Entwicklung
- Monetarisierung bereits testbar
- Saubere Basis für Payment-Integration
- Audit-Trail von Anfang an

**Negativ:**
- Kein Self-Service für Kunden
- Manueller Admin-Aufwand
- Payment-Integration als separates Projekt nötig

---

## ADR-007: Multi-Tenant by Design

**Status:** Akzeptiert (Sprint 1)

### Kontext

Die Anwendung soll von mehreren unabhängigen Organisationen (Tenants) genutzt werden können, mit strikter Datentrennung.

### Entscheidung

Tenant-Scoping auf Datenbankebene:
- Jeder User gehört zu einem Tenant
- Alle Business-Entitäten haben `tenant_id`
- Jede Query filtert nach `tenant_id` aus Session
- Kein Client-übergebener `tenant_id` akzeptiert

### Konsequenzen

**Positiv:**
- Datentrennung garantiert
- Shared Infrastructure (kostengünstiger)
- Einfache Skalierung (neue Tenants ohne Aufwand)
- RBAC pro Tenant

**Negativ:**
- Jede Query braucht Tenant-Filter
- Performance bei vielen Tenants (Indizes wichtig)
- Tenant-Wechsel für User nicht vorgesehen

---

## ADR-008: Structured JSON Logging

**Status:** Akzeptiert (Sprint 1)

### Kontext

Für Debugging und Observability benötigen wir aussagekräftige Logs, die maschinell auswertbar sind.

### Entscheidung

Alle Logs sind JSON-formatiert mit standardisierten Feldern:
- `request_id` für Request-Korrelation
- `user_id`, `tenant_id` für Kontext
- `error_code` für Kategorisierung
- Timestamps in ISO 8601 UTC

### Konsequenzen

**Positiv:**
- Maschinelle Auswertung (ELK, CloudWatch, etc.)
- Einfaches Debugging per Request-ID
- Standardisierte Struktur

**Negativ:**
- Weniger lesbar in Raw-Terminal
- Mehr Speicherplatz als Plain-Text
- jq oder ähnliches Tool für Lesbarkeit nötig

---

## ADR-009: In-Memory Rate Limiting

**Status:** Akzeptiert (Sprint 1, mit Einschränkung)

### Kontext

API-Schutz vor Missbrauch ist essentiell. Für das MVP benötigen wir eine einfache Lösung.

### Entscheidung

In-Memory Rate Limiter pro Application-Instance:
- Sliding Window pro Tenant
- Konfigurierbare Limits pro Endpoint-Kategorie
- Keine externe Dependency (Redis)

### Konsequenzen

**Positiv:**
- Keine zusätzliche Infrastruktur
- Schnell implementiert
- Funktioniert für Single-Instance MVP

**Negativ:**
- **Nicht geeignet für horizontale Skalierung**
- Bei Restart werden Limits zurückgesetzt
- Tenant kann Limit umgehen durch Wechsel der Instance

**Migration geplant:** Redis-basierter Rate Limiter für Production-Scale

---

## ADR-010: WeasyPrint für PDF-Generierung

**Status:** Akzeptiert (Sprint 1)

### Kontext

PDFs müssen serverseitig aus Case-Daten generiert werden. Layout-Kontrolle und Reproduzierbarkeit sind wichtig.

### Entscheidung

WeasyPrint für HTML → PDF Konvertierung:
- Jinja2 Template für HTML
- CSS für Styling (DIN A4)
- Python-native Lösung

### Konsequenzen

**Positiv:**
- Volle CSS-Unterstützung
- Python-native (keine externe Dependencies wie Chromium)
- Deterministisches Rendering

**Negativ:**
- Zusätzliche System-Dependencies (Pango, Cairo)
- Größeres Docker-Image
- Komplexes Setup (Fonts, etc.)

**Alternative betrachtet:** wkhtmltopdf (WebKit-Dependency), Puppeteer (Node.js)

---

## Entscheidungs-Log

| ID | Entscheidung | Status | Sprint |
|----|--------------|--------|--------|
| ADR-001 | API-First Architektur | ✅ Akzeptiert | 1 |
| ADR-002 | Prisma als ORM | ✅ Akzeptiert | 1 |
| ADR-003 | Session-basierte Auth | ✅ Akzeptiert | 1 |
| ADR-004 | Config-Driven Procedures | ✅ Akzeptiert | 1 |
| ADR-005 | Immutable Snapshots | ✅ Akzeptiert | 1 |
| ADR-006 | Credits ohne Payment | ✅ Akzeptiert | 1 |
| ADR-007 | Multi-Tenant Design | ✅ Akzeptiert | 1 |
| ADR-008 | JSON Logging | ✅ Akzeptiert | 1 |
| ADR-009 | In-Memory Rate Limit | ⚠️ Akzeptiert (MVP) | 1 |
| ADR-010 | WeasyPrint PDF | ✅ Akzeptiert | 1 |

---

*Letzte Aktualisierung: Sprint 1 Abschluss*

