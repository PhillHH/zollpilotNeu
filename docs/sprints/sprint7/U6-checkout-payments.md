# Sprint 7 – U6: Checkout & Payments

> **Status**: Abgeschlossen
> **Datum**: 2026-01-31

---

## Ziel

Implementierung eines **funktionierenden Kauf-Flows** für Credits & IZA-Pass:
- Stripe Checkout Integration (EU, einmalige Zahlungen)
- Zuverlässig, transparent, ohne Overengineering

---

## Scope

### A) Zahlungsanbieter

- [x] Stripe Checkout (vorbereitet)
- [x] Mock-Modus für Entwicklung
- [x] Produkt-Definitionen (Credits, IZA-Pass)

### B) Datenmodell (Prisma)

- [x] Model `Purchase` erstellt
  - provider (STRIPE)
  - provider_ref (Session ID)
  - amount_cents, currency
  - type (CREDITS | IZA_PASS)
  - status (PENDING | PAID | FAILED | REFUNDED)
  - credits_amount
  - metadata_json

### C) Backend (FastAPI)

- [x] `GET /billing/products` – Produktliste
- [x] `POST /billing/checkout/session` – Checkout starten
- [x] `POST /billing/webhook` – Stripe Events verarbeiten
- [x] `POST /billing/checkout/complete` – Mock-Checkout (Dev)
- [x] `GET /billing/purchases` – Kaufhistorie
- [x] `GET /billing/purchases/{id}` – Einzelkauf (Beleg)
- [x] Idempotenz bei Webhooks

### D) Frontend (Next.js)

- [x] Checkout-Modal mit Produktauswahl
- [x] Redirect zu Stripe Checkout
- [x] Success-Page mit Bestätigung
- [x] Cancel-Page mit Hinweis
- [x] Automatische Balance-Aktualisierung

### E) Tests

- [x] `test_list_products_returns_available_products`
- [x] `test_create_checkout_session_creates_purchase`
- [x] `test_create_checkout_session_rejects_invalid_product`
- [x] `test_complete_checkout_credits_account`
- [x] `test_complete_checkout_idempotent`
- [x] `test_complete_checkout_fails_for_nonexistent_session`
- [x] `test_list_purchases_returns_user_purchases`
- [x] `test_webhook_processes_checkout_completed`
- [x] `test_webhook_idempotent`
- [x] `test_webhook_handles_unknown_event`

### F) Dokumentation

- [x] `docs/BILLING/PAYMENTS.md` erstellt
- [x] `docs/API_CONTRACTS.md` aktualisiert
- [x] Sprint-Log erstellt

---

## Produkte

| Produkt-ID | Name | Credits | Preis |
|-----------|------|---------|-------|
| `credits_1` | 1 Credit | 1 | 1,49 EUR |
| `credits_5` | 5 Credits | 5 | 6,99 EUR |
| `credits_10` | 10 Credits | 10 | 12,99 EUR |
| `iza_pass` | IZA Pass | 2 | 2,99 EUR |

---

## API-Änderungen

### Neue Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| GET | `/billing/products` | Produktliste |
| POST | `/billing/checkout/session` | Checkout starten |
| POST | `/billing/webhook` | Stripe Webhook |
| POST | `/billing/checkout/complete` | Mock-Checkout (Dev) |
| GET | `/billing/purchases` | Kaufhistorie |
| GET | `/billing/purchases/{id}` | Einzelkauf (Beleg) |

### Neue Modelle

| Modell | Beschreibung |
|--------|-------------|
| `Purchase` | Kauftransaktion mit Status |
| `PaymentProvider` | STRIPE |
| `PurchaseType` | CREDITS, IZA_PASS |
| `PurchaseStatus` | PENDING, PAID, FAILED, REFUNDED |

---

## Geänderte Dateien

### Backend

| Datei | Änderung |
|-------|----------|
| `prisma/schema.prisma` | +Purchase Model, +Enums |
| `apps/api/app/routes/checkout.py` | Neu: Checkout-Endpunkte |
| `apps/api/app/main.py` | +checkout_router |
| `apps/api/tests/test_checkout.py` | 10 neue Tests |

### Frontend

| Datei | Änderung |
|-------|----------|
| `apps/web/src/app/lib/api/client.ts` | +Checkout-Types, +API-Funktionen |
| `apps/web/src/app/app/billing/BillingClient.tsx` | Checkout-Flow, Status-Banner |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/BILLING/PAYMENTS.md` | Neu erstellt |
| `docs/API_CONTRACTS.md` | +Checkout-Endpunkte |
| `docs/sprints/sprint7/U6-checkout-payments.md` | Dieser Sprint-Log |

---

## Checkout-Flow

```
User klickt "Credits kaufen"
         ↓
Frontend zeigt Produktauswahl
         ↓
User wählt Produkt
         ↓
POST /billing/checkout/session
         ↓
Backend erstellt Purchase (PENDING)
         ↓
Frontend leitet zu Stripe weiter
         ↓
User zahlt bei Stripe
         ↓
Stripe sendet Webhook
         ↓
Backend: Purchase → PAID, Credits +
         ↓
User sieht Erfolgsmeldung
```

---

## Sicherheit

| Maßnahme | Implementierung |
|----------|----------------|
| Webhook-Signatur | Stripe-Signatur-Prüfung (Prod) |
| Keine Preise im Frontend | Server definiert Preise |
| Idempotenz | Doppelte Webhooks erkannt |
| Tenant-Isolation | Purchases per Tenant gefiltert |

---

## Dev-Modus

Ohne `STRIPE_SECRET_KEY`:
- Mock-Sessions werden erstellt
- `POST /billing/checkout/complete` ist aktiv
- Checkout-URL leitet direkt zur Success-Page

---

## Nicht implementiert (bewusst)

| Feature | Grund |
|---------|-------|
| Rechnungen | v1 nur Belege |
| Abonnements | Nicht im Scope |
| Refunds via API | Manuell in Stripe Dashboard |
| Apple Pay / Google Pay | v2 |

---

## Referenzen

- [PAYMENTS.md](../../BILLING/PAYMENTS.md) – Vollständige Dokumentation
- [CREDITS.md](../../BILLING/CREDITS.md) – Credit-System
- [API_CONTRACTS.md](../../API_CONTRACTS.md) – API-Formate
