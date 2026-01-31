# Credits & Pricing

> **Sprint 7 – U5**: Credit-basiertes Monetarisierungsmodell

---

## Übersicht

ZollPilot verwendet ein **Credit-basiertes System** für die Abrechnung von Ausfüllhilfen.

| Feature | Beschreibung |
|---------|-------------|
| 1 Credit | = 1 Ausfüllhilfe |
| Preis | 1,49 EUR pro Credit |
| Abbuchung | Beim "Bereit"-Klick (nicht beim PDF-Export) |
| Gültigkeit | Credits verfallen nicht |

---

## Preismodell

### Einzelpreise

| Produkt | Credits | Preis |
|---------|---------|-------|
| Ausfüllhilfe (Standard) | 1 | 1,49 EUR |
| Ausfüllhilfe (Premium/IZA) | 2 | 2,99 EUR |

### Pakete

| Paket | Credits | Preis | Ersparnis |
|-------|---------|-------|-----------|
| Einzelner Credit | 1 | 1,49 EUR | - |
| 5er Pack | 5 | 6,99 EUR | 6% |
| 10er Pack | 10 | 12,99 EUR | 13% |

---

## Datenmodell

### TenantCreditBalance

Speichert den aktuellen Kontostand pro Mandant.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `tenant_id` | String (PK) | Mandanten-ID |
| `balance` | Int | Aktueller Kontostand |
| `updated_at` | DateTime | Letzte Aktualisierung |

### CreditLedgerEntry

Vollständiges Transaktionslog aller Credit-Bewegungen.

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | UUID | Primärschlüssel |
| `tenant_id` | String | Mandanten-ID |
| `delta` | Int | Änderung (+/-) |
| `reason` | String | Grund der Buchung |
| `metadata_json` | JSON | Zusätzliche Daten |
| `created_by_user_id` | String? | Ausführender User |
| `created_at` | DateTime | Zeitstempel |

### Reason-Codes

| Code | Bedeutung | Delta |
|------|-----------|-------|
| `PURCHASE` | Kauf von Credits | + |
| `AUSFUELLHILFE` | Verwendung für Ausfüllhilfe | - |
| `ADMIN_GRANT` | Admin-Gutschrift | + |
| `INITIAL_GRANT` | Startguthaben | + |
| `REFUND` | Rückerstattung | + |

---

## API-Endpunkte

### GET /billing/me

Gibt Mandant, Plan und aktuellen Kontostand zurück.

**Response:**
```json
{
  "data": {
    "tenant": { "id": "...", "name": "..." },
    "plan": { "code": "...", "name": "..." },
    "credits": { "balance": 5 }
  }
}
```

### GET /billing/history

Gibt Transaktionshistorie zurück.

**Query-Parameter:**
- `limit` (optional, default: 50, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "delta": -1,
      "reason": "AUSFUELLHILFE",
      "case_title": "Sendung China",
      "created_at": "2026-01-31T12:00:00Z"
    }
  ]
}
```

### GET /billing/pricing

Gibt Preistabelle zurück.

**Response:**
```json
{
  "data": {
    "tiers": [
      {
        "name": "Einzelner Credit",
        "credits": 1,
        "price_cents": 149,
        "currency": "EUR",
        "description": "1 Ausfüllhilfe"
      }
    ],
    "credit_unit_price_cents": 149,
    "currency": "EUR"
  }
}
```

### POST /billing/credits/purchase

Kauft Credits (simuliert).

**Request:**
```json
{ "amount": 5 }
```

**Response:**
```json
{
  "data": {
    "balance": 10,
    "purchased": 5,
    "price_cents": 745,
    "currency": "EUR"
  }
}
```

### POST /billing/credits/spend

Bucht Credits für einen Fall ab (beim "Bereit"-Klick).

**Request:**
```json
{ "case_id": "uuid-of-case" }
```

**Response (Erfolg):**
```json
{
  "data": {
    "balance": 4,
    "spent": 1,
    "case_id": "..."
  }
}
```

**Response (Insufficient Credits):**
```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Nicht genügend Credits. Benötigt: 1, Vorhanden: 0.",
    "required": 1,
    "available": 0
  }
}
```
HTTP Status: 402 Payment Required

---

## Guards & Sicherheit

### Server-seitige Prüfungen

1. **Keine negativen Salden**
   - Balance wird vor Abbuchung geprüft
   - Bei race condition: Rollback + Fehlermeldung

2. **Idempotenz bei Spend**
   - Gleicher Fall wird nicht doppelt abgebucht
   - Wiederholte Requests geben `spent: 0` zurück

3. **Mandanten-Isolation**
   - Credits sind pro Tenant
   - User sieht nur eigenen Mandanten-Kontostand

4. **Case-Validierung**
   - Nur existierende Fälle des eigenen Mandanten
   - 404 bei fremden/nicht existenten Fällen

---

## Frontend-Integration

### Billing Page

```typescript
// Credits-Kauf
const result = await billing.purchaseCredits(5);
console.log(result.data.balance); // Neuer Kontostand

// Pricing-Infos laden
const pricing = await billing.pricing();
pricing.data.tiers.forEach(tier => {
  console.log(`${tier.name}: ${tier.price_cents / 100} EUR`);
});
```

### Wizard Integration

```typescript
// Vor "Bereit"-Klick prüfen
const billingInfo = await billing.me();
if (billingInfo.data.credits.balance < 1) {
  showPurchaseModal(); // Credit-Kauf anbieten
  return;
}

// Credits abbuchen
try {
  await billing.spendCredits(caseId);
  await cases.submit(caseId);
} catch (err) {
  if (err.code === "INSUFFICIENT_CREDITS") {
    showPurchaseModal();
  }
}
```

---

## Zukunft (nicht implementiert)

| Feature | Status |
|---------|--------|
| Stripe-Integration | Geplant |
| Abo-Modell | Geplant |
| Automatische Aufladung | Nicht geplant |
| Gutschein-Codes | Nicht geplant |

---

## Verwandte Dokumentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) – Systemübersicht
- [API_CONTRACTS.md](../API_CONTRACTS.md) – API-Formate
- [CONTENT_GUIDE.md](../CONTENT_GUIDE.md) – Preiskommunikation
