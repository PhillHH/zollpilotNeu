# Sprint UX-U5 – Billing & Preis-UX

> **Status:** Abgeschlossen

## Prompt

Billing-Übersicht und Preis-UX implementieren:
- `/app/billing` Route mit Credit-Guthaben
- Preislogik (IZA: 1 Credit = 1,49 €, IZA Premium: 2 Credits = 2,99 €)
- Preisvergleich (ZollPilot vs. Versanddienstleister)
- Credit-Historie
- CTAs (Credits kaufen Stub, Preise erklären)
- UX-Regeln: Transparenz, keine versteckten Kosten
- Mandanten-Isolation
- Tests und Dokumentation

## Ergebnis

Vollständige Billing-UX implementiert:

### Features
1. **Credit-Guthaben-Anzeige** mit prominentem Credit-Stand
2. **Preisübersicht** (toggle) mit IZA/IZA Premium Preisen
3. **Kostenvergleich** ZollPilot vs. Versanddienstleister
4. **Credit-Historie** mit Transaktionsliste
5. **CTAs** für Credits kaufen (Stub) und Preise anzeigen

### UX-Highlights
- Sachliche, transparente Preisdarstellung
- Keine Werbung, kein Verkaufsdruck
- Klarer Wertvergleich
- Disclaimer zur Produktabgrenzung

## Changed/Created Files

### Backend
- `apps/api/app/routes/billing.py` – Neuer `/billing/history` Endpoint

### Frontend
- `apps/web/src/app/app/billing/BillingClient.tsx` – Vollständige Neuimplementierung
- `apps/web/src/app/lib/api/client.ts` – `billing.history()` API hinzugefügt

### Tests
- `apps/web/tests/billing.test.tsx` – 13 Tests

### Documentation
- `docs/UX/BILLING.md` – UX-Dokumentation
- `docs/API_CONTRACTS.md` – `/billing/history` Endpoint
- `docs/sprints/sprint5/U5-billing.md` – Sprint-Log

## Tests

| Test | Beschreibung |
|------|--------------|
| Loading state | Zeigt Ladezustand |
| Credit balance | Credit-Stand korrekt angezeigt |
| Plan info | Tarif-Informationen angezeigt |
| No plan | Kein Tarif-Card ohne Plan |
| Error handling | Fehler korrekt angezeigt |
| Price comparison | Preisvergleich gerendert |
| Price toggle | Preisübersicht ein-/ausblenden |
| Credit history | Historie mit Einträgen |
| Empty history | Leerer State bei keiner Historie |
| Buy credits stub | CTA zeigt Alert |
| Credit hint | Erklärung zu Credits |
| Tenant isolation | Nur eigene Daten geladen |

**Gesamt: 13 Tests**

## API-Änderungen

### Neuer Endpoint: `GET /billing/history`

```json
{
  "data": [
    {
      "id": "uuid",
      "delta": 10,
      "reason": "ADMIN_GRANT",
      "case_title": null,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**Query-Parameter:**
- `limit`: Max Einträge (default: 50, max: 100)

## Reason-Mapping

| API | UI |
|-----|-----|
| `ADMIN_GRANT` | Gutschrift |
| `PDF_EXPORT` | Ausfüllhilfe exportiert |
| `INITIAL_GRANT` | Startguthaben |
| `PURCHASE` | Kauf |
| `REFUND` | Rückerstattung |

## Gaps / Notes

### Deliberate Cuts (MVP)
- ❌ Kein Payment-Gateway – Credits nur via Admin
- ❌ Kein Checkout – Button zeigt Info-Alert
- ❌ Keine Rechnungen – Nicht im Scope

### Future Work
- 💡 Stripe/PayPal Integration
- 💡 Automatische Credit-Vergabe bei Plan-Aktivierung
- 💡 Rechnungsübersicht
- 💡 Abo-Verwaltung

### Dependencies
- Keine neuen Prisma-Modelle erforderlich
- Nutzt existierende CreditLedgerEntry

## Wording Compliance

✅ Keine verbotenen Begriffe verwendet
✅ "Ausfüllhilfe" statt "Zollanmeldung"
✅ Disclaimer zur Produktabgrenzung

## Screenshots

```
┌─────────────────────────────────────────────────┐
│ Abrechnung                                      │
├─────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────┐        │
│ │  Ihr Guthaben   │  │ Aktueller Tarif │        │
│ │       10        │  │     Basis       │        │
│ │    Credits      │  │     BASIC       │        │
│ │ [Credits kaufen]│  │                 │        │
│ │ [Preise anzeig.]│  │                 │        │
│ └─────────────────┘  └─────────────────┘        │
├─────────────────────────────────────────────────┤
│ Kostenvergleich                                 │
│ ┌───────────────────────────────────────────┐   │
│ │ ZollPilot (Ausfüllhilfe)    ab 1,49 EUR  │   │
│ │ Versanddienstleister        6 - 15 EUR   │   │
│ └───────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│ Credit-Historie                                 │
│ Datum      │ Aktion          │ Bezug  │ Credits│
│ 15.01.2024 │ Gutschrift      │ -      │ +10    │
│ 16.01.2024 │ Ausfüllhilfe... │ Import │ -1     │
└─────────────────────────────────────────────────┘
```
