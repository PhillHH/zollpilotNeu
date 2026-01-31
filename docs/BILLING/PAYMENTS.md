# Payments (Stripe Checkout)

> **Sprint 7 – U6**: Checkout & Payments (Light, v1)

---

## Übersicht

ZollPilot integriert Stripe Checkout für die sichere Abwicklung von Kreditkäufen und IZA-Pass-Buchungen.

| Feature | Beschreibung |
|---------|-------------|
| Zahlungsanbieter | Stripe Checkout (EU) |
| Zahlungsarten | Einmalige Zahlungen (keine Abos in v1) |
| Währung | EUR |
| Produkte | Credit-Packs, IZA-Pass |

---

## Produkte

### Credit-Packs

| Produkt-ID | Name | Credits | Preis |
|-----------|------|---------|-------|
| `credits_1` | 1 Credit | 1 | 1,49 EUR |
| `credits_5` | 5 Credits | 5 | 6,99 EUR |
| `credits_10` | 10 Credits | 10 | 12,99 EUR |

### Passes

| Produkt-ID | Name | Credits | Preis |
|-----------|------|---------|-------|
| `iza_pass` | IZA Pass | 2 | 2,99 EUR |

---

## Datenmodell

### Purchase

Speichert Kauftransaktionen.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | UUID | Primärschlüssel |
| `tenant_id` | String | Mandanten-ID |
| `user_id` | String | User-ID |
| `provider` | Enum | STRIPE |
| `provider_ref` | String | Stripe Session/Payment Intent ID |
| `type` | Enum | CREDITS, IZA_PASS |
| `amount_cents` | Int | Preis in Cent |
| `currency` | String | EUR |
| `credits_amount` | Int? | Anzahl Credits |
| `status` | Enum | PENDING, PAID, FAILED, REFUNDED |
| `metadata_json` | JSON | Zusätzliche Daten |
| `created_at` | DateTime | Erstellungszeitpunkt |
| `paid_at` | DateTime? | Zahlungszeitpunkt |

### Status-Codes

| Status | Bedeutung |
|--------|-----------|
| `PENDING` | Checkout gestartet, Zahlung ausstehend |
| `PAID` | Zahlung bestätigt |
| `FAILED` | Zahlung fehlgeschlagen oder abgelaufen |
| `REFUNDED` | Zahlung erstattet |

---

## API-Endpunkte

### GET /billing/products

Gibt verfügbare Produkte zurück.

**Response:**
```json
{
  "data": [
    {
      "id": "credits_5",
      "name": "5 Credits",
      "description": "5 Ausfüllhilfen für ZollPilot",
      "price_cents": 699,
      "credits": 5,
      "type": "CREDITS"
    }
  ]
}
```

### POST /billing/checkout/session

Erstellt eine Stripe Checkout-Session.

**Request:**
```json
{ "product_id": "credits_5" }
```

**Response:**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/...",
    "session_id": "cs_...",
    "product_id": "credits_5",
    "amount_cents": 699,
    "currency": "EUR"
  }
}
```

**Flow:**
1. Frontend ruft Endpunkt auf
2. Backend erstellt Stripe Session + Purchase (PENDING)
3. Backend gibt Checkout-URL zurück
4. Frontend leitet User zu Stripe weiter

### POST /billing/webhook

Empfängt Stripe Webhook-Events.

**Unterstützte Events:**
- `checkout.session.completed` → Credits gutschreiben
- `checkout.session.expired` → Status auf FAILED setzen

**Idempotenz:** Doppelte Events werden erkannt und ignoriert.

**Signatur-Prüfung:** In Produktion wird die Stripe-Signatur verifiziert.

### POST /billing/checkout/complete

Schließt einen Mock-Checkout ab (nur Dev-Modus).

**Query-Parameter:**
- `session_id`: Die Checkout-Session-ID

**Response:**
```json
{
  "data": {
    "status": "completed",
    "purchase_id": "...",
    "credits_added": 5
  }
}
```

### GET /billing/purchases

Gibt Kaufhistorie zurück.

**Query-Parameter:**
- `limit` (optional, default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "type": "CREDITS",
      "status": "PAID",
      "amount_cents": 699,
      "currency": "EUR",
      "credits_amount": 5,
      "product_name": "5 Credits",
      "created_at": "2026-01-31T12:00:00Z",
      "paid_at": "2026-01-31T12:05:00Z"
    }
  ]
}
```

### GET /billing/purchases/{id}

Gibt einzelnen Kauf (Beleg) zurück.

**Response:**
```json
{
  "data": {
    "id": "...",
    "type": "CREDITS",
    "status": "PAID",
    "amount_cents": 699,
    "currency": "EUR",
    "credits_amount": 5,
    "product_name": "5 Credits",
    "created_at": "2026-01-31T12:00:00Z",
    "paid_at": "2026-01-31T12:05:00Z"
  }
}
```

---

## Checkout-Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│   Stripe    │
│  (Button)   │     │  (Session)  │     │  (Checkout) │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    │
                    ┌─────────────┐              │
                    │  Purchase   │◀─────────────┘
                    │  (PENDING)  │         Webhook
                    └─────────────┘
                           │
                           ▼ (checkout.session.completed)
                    ┌─────────────┐
                    │  Purchase   │
                    │   (PAID)    │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Credits    │
                    │  (+balance) │
                    └─────────────┘
```

### Erfolgreicher Kauf

1. User klickt "Credits kaufen"
2. Frontend zeigt Produktauswahl
3. User wählt Produkt
4. Frontend ruft `POST /billing/checkout/session` auf
5. Backend erstellt Purchase (PENDING) + Stripe Session
6. Frontend leitet zu Stripe Checkout weiter
7. User zahlt bei Stripe
8. Stripe sendet Webhook (checkout.session.completed)
9. Backend markiert Purchase als PAID
10. Backend schreibt Credits gut
11. User wird zu `/app/billing?checkout=success` geleitet
12. Frontend zeigt Erfolgsmeldung

### Abgebrochener Kauf

1. User bricht Checkout ab
2. User wird zu `/app/billing?checkout=cancel` geleitet
3. Frontend zeigt Hinweis
4. Purchase bleibt PENDING (wird später FAILED via Webhook)

---

## Sicherheit

### Webhook-Signatur

In Produktion wird jeder Webhook mit der Stripe-Signatur verifiziert:

```python
if STRIPE_WEBHOOK_SECRET and stripe_signature:
    stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
```

### Keine Preislogik im Frontend

- Preise werden nur im Backend definiert
- Frontend zeigt nur an, was die API liefert
- Server entscheidet final über Gültigkeit

### Idempotenz

- Webhooks können mehrfach eintreffen
- Bereits verarbeitete Sessions werden erkannt
- Credits werden nur einmal gutgeschrieben

---

## Umgebungsvariablen

| Variable | Beschreibung | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe Secret Key | (leer = Dev-Modus) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | (leer = keine Prüfung) |
| `FRONTEND_URL` | Frontend-URL für Redirects | `http://localhost:3000` |

---

## Dev-Modus

Ohne `STRIPE_SECRET_KEY` läuft das System im Dev-Modus:

- Mock-Checkout-Sessions werden erstellt
- Keine echten Stripe-Calls
- `POST /billing/checkout/complete` ist aktiv
- Checkout-URL leitet direkt zur Success-Page

---

## Nicht implementiert (v1)

| Feature | Grund |
|---------|-------|
| Abonnements | Nicht im Scope |
| Rechnungen | Nur Belege |
| Refunds via API | Manuell in Stripe Dashboard |
| Apple Pay / Google Pay | Erst in v2 |

---

## Verwandte Dokumentation

- [CREDITS.md](./CREDITS.md) – Credit-System
- [ARCHITECTURE.md](../ARCHITECTURE.md) – Systemübersicht
- [API_CONTRACTS.md](../API_CONTRACTS.md) – API-Formate
