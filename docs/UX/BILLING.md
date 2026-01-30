# Billing & Preis-UX

> **Sprint UX-U5** – Wert sichtbar machen

## Ziel

Den **Preis und den Wert von ZollPilot** im Produkt transparent darstellen,
ohne Zahlungsdruck und ohne technische Payment-Integration.

Der Nutzer soll verstehen:
- Was eine Ausfüllhilfe kostet
- Wie viele Credits er hat
- Warum ZollPilot günstiger ist als Alternativen

## Route

`/app/billing`

## Komponenten

### 1. Credit-Guthaben

**Anzeige:**
- Großer, prominenter Credit-Stand
- Erklärungstext: "Ein Credit entspricht einer Ausfüllhilfe."

**Warum:**
- Transparenz über verfügbares Guthaben
- Klare Verbindung zwischen Credits und Leistung

### 2. Preislogik

**Toggle-Bereich "Preise anzeigen":**

| Produkt | Credits | Preis |
|---------|---------|-------|
| IZA Ausfüllhilfe | 1 Credit | 1,49 EUR |
| IZA Premium Ausfüllhilfe | 2 Credits | 2,99 EUR |

**Hinweis:** "Credits sind unbegrenzt gültig und werden nur bei erfolgreichem Export verbraucht."

### 3. Preisvergleich (UX-Highlight)

Statischer Vergleich zur Wertdarstellung:

| Anbieter | Preis pro Sendung |
|----------|-------------------|
| **ZollPilot** (Ausfüllhilfe) | **ab 1,49 EUR** |
| Versanddienstleister (Zollabwicklung) | 6 - 15 EUR |

**Disclaimer:**
> ZollPilot erstellt Ausfüllhilfen zur Vorbereitung Ihrer Zollanmeldung.
> Die eigentliche Anmeldung erfolgt durch Sie selbst beim Zoll.

### 4. Credit-Historie

**Tabelle:**
| Datum | Aktion | Bezug | Credits |
|-------|--------|-------|---------|
| 15.01.2024 | Gutschrift | - | +10 |
| 16.01.2024 | Ausfüllhilfe exportiert | Import aus China | -1 |

**Reason-Mapping (API → UI):**
| API-Code | UI-Anzeige |
|----------|------------|
| `ADMIN_GRANT` | Gutschrift |
| `PDF_EXPORT` | Ausfüllhilfe exportiert |
| `INITIAL_GRANT` | Startguthaben |
| `PURCHASE` | Kauf |
| `REFUND` | Rückerstattung |

### 5. CTAs

**"Credits kaufen"** (Stub):
- Button zeigt Alert: "Credits kaufen wird bald verfügbar sein."
- Kein echter Kaufvorgang implementiert

**"Preise anzeigen/ausblenden":**
- Toggle für Preisdetails

## UX-Regeln

1. **Preis immer im Kontext erklären**
   - Credits ↔ Ausfüllhilfe Verbindung klar machen

2. **Keine versteckten Kosten**
   - Alle Preise transparent sichtbar

3. **Keine Behördensprache**
   - Einfache, verständliche Begriffe

4. **Transparente, ruhige Darstellung**
   - Kein Verkaufsdruck
   - Sachliche Tonalität

## Wording

**Erlaubt:**
- "Ausfüllhilfe"
- "Credits"
- "Guthaben"
- "Vorbereitung"

**Verboten:**
- "Zollanmeldung durchführen"
- "amtlich"
- "offiziell"
- Siehe WORDING_GUIDE.md

## Abgrenzung

### Was Billing UX macht:
- Credit-Stand anzeigen
- Preise transparent darstellen
- Kostenvergleich zeigen
- Transaktionshistorie anzeigen

### Was Billing UX NICHT macht:
- Payment-Gateway Integration
- Echte Kaufabwicklung
- Rechnungserstellung
- Automatische Credit-Vergabe

## Mandanten-Isolation

- Alle Daten sind tenant-scoped
- Credit-Balance gehört zum Mandanten
- Historie zeigt nur eigene Transaktionen
- Session-basierte Authentifizierung

## API-Endpunkte

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /billing/me` | Tenant, Plan, Credits |
| `GET /billing/history` | Transaktionshistorie |

Siehe `docs/API_CONTRACTS.md` für Details.

## Komponenten-Übersicht

```
/app/billing
├── page.tsx            # Server Component (Wrapper)
└── BillingClient.tsx   # Client Component
    ├── Credit-Guthaben Card
    ├── Plan-Info Card (optional)
    ├── Preisübersicht (toggle)
    ├── Kostenvergleich Section
    └── Credit-Historie Table
```

## Design-System

Verwendet ZollPilot Design System v1:
- `Section` – Container
- `Card` – Inhaltskarten
- `Button` – CTAs (primary, ghost)
- `Alert` – Fehlermeldungen

CSS Custom Properties aus `tokens.css`.
