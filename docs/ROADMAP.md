# Product Roadmap

Übersicht der geplanten Erweiterungen und Features nach Sprint 1.

---

## 📍 Aktueller Stand

**Sprint 1 Complete (v1.0.0):**
- ✅ IZA Hero-Flow vollständig
- ✅ PDF-Export mit Credits
- ✅ Multi-Tenant Architektur
- ✅ Admin-Panel (Basis)
- ✅ Blog/FAQ Content

---

## 🎯 Sprint 2 – Vorschläge

### 1. IPK Hero-Flow (Import Permit / Kontingente)

**Beschreibung:**
Zweites Produktions-Verfahren für genehmigungspflichtige Waren mit Kontingenten.

**Scope:**
- Procedure-Definition für IPK
- Zusätzliche Felder: Kontingent-Nummer, Genehmigungsdatum
- IPK-spezifische Validierungsregeln
- Summary-Formatter für IPK

**Abhängigkeiten:**
- Procedure Engine (vorhanden ✅)
- Wizard Renderer (vorhanden ✅)

**Risiken:**
- Fachliche Komplexität (Zoll-Know-how erforderlich)
- Schätzung: 1-2 Wochen

**Priorität:** 🔴 Hoch (zweites Produkt-Feature)

---

### 2. IAA Hero-Flow (Ausfuhranmeldung)

**Beschreibung:**
Export-Pendant zu IZA – für Ausfuhren aus Deutschland.

**Scope:**
- Procedure-Definition für IAA
- Felder: Bestimmungsland, Exporteur, Warenklassifikation
- IAA-spezifische Validierung
- Unterschiedliches PDF-Layout

**Abhängigkeiten:**
- Procedure Engine (vorhanden ✅)
- Möglicherweise: ATLAS-Integration (extern)

**Risiken:**
- Regulatorische Komplexität höher als IZA
- ATLAS-Schnittstelle nicht im Scope
- Schätzung: 2-3 Wochen

**Priorität:** 🟡 Mittel

---

### 3. Payment Integration (Stripe)

**Beschreibung:**
Self-Service Credit-Kauf für Kunden.

**Scope:**
- Stripe Integration (Checkout Session)
- Credit-Pakete definieren (10, 50, 100 Credits)
- Webhook für Payment-Bestätigung
- Credit-Gutschrift nach erfolgreicher Zahlung
- Rechnungsstellung (Stripe Invoices)

**Abhängigkeiten:**
- Credits-System (vorhanden ✅)
- Ledger (vorhanden ✅)
- Stripe Account Setup (extern)

**Risiken:**
- PCI-Compliance beachten
- Webhook-Sicherheit
- Fehlerbehandlung bei Payment-Failures
- Schätzung: 2 Wochen

**Priorität:** 🔴 Hoch (Monetarisierung)

---

### 4. HSCode / Commodity Code Lookup

**Beschreibung:**
Hilfestellung bei der Warenklassifikation (Zolltarifnummer).

**Scope:**
- Suchfunktion für HSCodes
- Datenbank mit Codes + Beschreibungen
- Integration in Wizard (Autocomplete)
- Optional: KI-gestützte Vorschläge

**Abhängigkeiten:**
- HSCode-Datenquelle (z.B. EU TARIC)
- Volltextsuche (evtl. Elasticsearch)

**Risiken:**
- Datenqualität und Aktualität
- Lizenzierung der Daten
- Performance bei großen Datenmengen
- Schätzung: 2-4 Wochen (abhängig von Datenquelle)

**Priorität:** 🟡 Mittel (User-Experience)

---

### 5. E-Mail-Benachrichtigungen

**Beschreibung:**
Transaktionale E-Mails für wichtige Events.

**Scope:**
- Willkommens-E-Mail nach Registrierung
- Bestätigung nach Submit
- Passwort-Reset
- Credit-Guthaben niedrig

**Abhängigkeiten:**
- E-Mail-Service (SendGrid, AWS SES)
- Template-System

**Risiken:**
- Deliverability (Spam-Vermeidung)
- Template-Design
- Schätzung: 1 Woche

**Priorität:** 🟡 Mittel

---

### 6. Design System / Theming

**Beschreibung:**
Konsistentes visuelles Design und White-Label-Fähigkeit.

**Scope:**
- Design-Tokens (Farben, Typografie, Spacing)
- Komponenten-Bibliothek
- Dark Mode (optional)
- White-Label für Enterprise-Kunden

**Abhängigkeiten:**
- Designer-Ressourcen
- Frontend-Refactoring

**Risiken:**
- Großer Refactoring-Aufwand
- Regressions im UI
- Schätzung: 2-3 Wochen

**Priorität:** 🟢 Niedrig (nach Product-Market-Fit)

---

### 7. Redis Rate Limiting

**Beschreibung:**
Skalierbare Rate-Limiting-Lösung für horizontale Skalierung.

**Scope:**
- Redis als Rate-Limit-Store
- Sliding Window Algorithmus
- Cluster-fähig

**Abhängigkeiten:**
- Redis-Infrastruktur
- Connection Pooling

**Risiken:**
- Redis-Verfügbarkeit
- Fallback bei Redis-Ausfall
- Schätzung: 3-4 Tage

**Priorität:** 🔴 Hoch (vor horizontaler Skalierung)

---

### 8. Duty/VAT Calculator

**Beschreibung:**
Vorschauberechnung von Zoll und Einfuhrumsatzsteuer.

**Scope:**
- Zollsatz-Datenbank
- Berechnung basierend auf HSCode + Wert + Herkunft
- Integration in Summary-Ansicht
- Haftungsausschluss (keine rechtliche Beratung)

**Abhängigkeiten:**
- HSCode-Lookup (#4)
- Zollsatz-Datenquelle (EU TARIC, Zoll.de)

**Risiken:**
- Rechtliche Haftung
- Datenaktualität
- Komplexe Berechnungsregeln
- Schätzung: 3-4 Wochen

**Priorität:** 🟢 Niedrig (nach HSCode-Lookup)

---

## 📊 Priorisierte Backlog-Übersicht

| # | Feature | Priorität | Aufwand | Abhängigkeiten |
|---|---------|-----------|---------|----------------|
| 1 | Payment (Stripe) | 🔴 Hoch | 2 Wochen | Stripe Account |
| 2 | IPK Hero-Flow | 🔴 Hoch | 1-2 Wochen | – |
| 3 | Redis Rate Limit | 🔴 Hoch | 3-4 Tage | Redis Infra |
| 4 | E-Mail-Benachrichtigungen | 🟡 Mittel | 1 Woche | E-Mail Service |
| 5 | IAA Hero-Flow | 🟡 Mittel | 2-3 Wochen | – |
| 6 | HSCode Lookup | 🟡 Mittel | 2-4 Wochen | Datenquelle |
| 7 | Design System | 🟢 Niedrig | 2-3 Wochen | Designer |
| 8 | Duty Calculator | 🟢 Niedrig | 3-4 Wochen | HSCode |

---

## 🗓️ Vorgeschlagener Sprint 2 Plan

**Ziel:** Monetarisierung + zweites Verfahren

**Woche 1-2:**
- Payment Integration (Stripe)
- Redis Rate Limiting

**Woche 3-4:**
- IPK Hero-Flow
- E-Mail-Benachrichtigungen (Basis)

**Ergebnis Sprint 2:**
- Self-Service Credit-Kauf
- Zweites produktives Verfahren (IPK)
- Skalierbare Infrastruktur

---

## 🚫 Explizit Out-of-Scope (Parking Lot)

Folgende Features wurden diskutiert aber bewusst zurückgestellt:

| Feature | Grund | Revisit |
|---------|-------|---------|
| Mobile App | Web-First, später | Q3 2026 |
| ATLAS-Integration | Regulatorische Komplexität | Nach Beta-Feedback |
| Multi-Language | Fokus auf DE-Markt | Nach Product-Market-Fit |
| Offline-Mode | PWA-Komplexität | Keine Priorisierung |
| API für Drittanbieter | Erst interne Nutzung | Nach 100 aktiven Nutzern |

---

## 📝 Änderungshistorie

| Datum | Änderung | Autor |
|-------|----------|-------|
| Sprint 1 Ende | Initial Roadmap erstellt | – |

---

*Letzte Aktualisierung: Sprint 1 Abschluss*

