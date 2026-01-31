# Sprint 7 – U5: Credits & Pricing

> **Status**: Abgeschlossen
> **Datum**: 2026-01-31

---

## Ziel

Implementierung eines **Credit-basierten Monetarisierungsmodells**:
- 1 Credit = 1 Ausfüllhilfe = 1,49 EUR
- Credits erst beim **"Bereit"-Klick** abbuchen
- Serverseitige Guards: Keine negativen Salden, Idempotenz

---

## Scope

### A) Backend (FastAPI)

- [x] `POST /billing/credits/purchase` – Credits kaufen
- [x] `POST /billing/credits/spend` – Credits für Fall abbuchen
- [x] `GET /billing/pricing` – Preistabelle abrufen
- [x] Idempotenz bei Spend (gleicher Fall = keine Doppelbuchung)
- [x] 402 Payment Required bei Insufficient Credits

### B) Frontend (React)

- [x] BillingClient erweitert um Kauf-Modal
- [x] Pricing-Tiers aus API laden
- [x] Purchase-Flow mit Erfolgs-/Fehleranzeige
- [x] Neuer Reason-Code "AUSFUELLHILFE" in Historie

### C) Tests

- [x] `test_purchase_credits_increases_balance`
- [x] `test_purchase_credits_accumulates`
- [x] `test_purchase_credits_validates_amount`
- [x] `test_spend_credits_deducts_balance`
- [x] `test_spend_credits_fails_with_insufficient_balance`
- [x] `test_spend_credits_idempotent`
- [x] `test_spend_credits_fails_for_nonexistent_case`
- [x] `test_pricing_returns_tiers`

### D) Dokumentation

- [x] `docs/BILLING/CREDITS.md` erstellt
- [x] Sprint-Log erstellt

---

## Preismodell

| Produkt | Credits | Preis |
|---------|---------|-------|
| Standard Ausfüllhilfe | 1 | 1,49 EUR |
| 5er Pack | 5 | 6,99 EUR |
| 10er Pack | 10 | 12,99 EUR |

---

## API-Änderungen

### Neue Endpunkte

| Methode | Pfad | Beschreibung |
|---------|------|--------------|
| POST | `/billing/credits/purchase` | Credits kaufen |
| POST | `/billing/credits/spend` | Credits für Fall abbuchen |
| GET | `/billing/pricing` | Preistabelle |

### Neue Reason-Codes

| Code | Bedeutung |
|------|-----------|
| `PURCHASE` | Kauf von Credits |
| `AUSFUELLHILFE` | Verwendung für Ausfüllhilfe |

### HTTP Status Codes

| Status | Bedeutung |
|--------|-----------|
| 200 | Erfolg |
| 402 | Nicht genügend Credits |
| 404 | Fall nicht gefunden |
| 422 | Validierungsfehler |

---

## Geänderte Dateien

### Backend

| Datei | Änderung |
|-------|----------|
| `apps/api/app/routes/billing.py` | +3 Endpunkte, Pricing-Konstanten |
| `apps/api/tests/test_billing.py` | +8 Tests, Fake-Modelle erweitert |

### Frontend

| Datei | Änderung |
|-------|----------|
| `apps/web/src/app/lib/api/client.ts` | +Types, +API-Funktionen |
| `apps/web/src/app/app/billing/BillingClient.tsx` | Kauf-Modal, Pricing-Integration |

### Dokumentation

| Datei | Änderung |
|-------|----------|
| `docs/BILLING/CREDITS.md` | Neu erstellt |
| `docs/sprints/sprint7/U5-credits-pricing.md` | Dieser Sprint-Log |

---

## Technische Details

### Idempotenz-Implementierung

```python
# Prüfe ob bereits für diesen Fall abgebucht
all_spends = await prisma.creditledgerentry.find_many(
    where={"tenant_id": tenant_id, "reason": "AUSFUELLHILFE"}
)

for spend in all_spends:
    if spend.metadata_json.get("case_id") == case_id:
        # Bereits abgebucht - gebe aktuellen Stand zurück
        return CreditSpendResponse(spent=0, ...)
```

### Negative Balance Prevention

```python
# Dekrementiere Balance
new_balance = await prisma.tenantcreditbalance.update(
    where={"tenant_id": tenant_id},
    data={"balance": {"decrement": 1}},
)

# Safety Check
if new_balance.balance < 0:
    # Rollback
    await prisma.tenantcreditbalance.update(
        data={"balance": {"increment": 1}},
    )
    raise HTTPException(status_code=402, ...)
```

---

## Nicht implementiert (bewusst)

| Feature | Grund |
|---------|-------|
| Stripe-Integration | Zukünftiger Sprint |
| Abo-Modell | Nicht im Scope |
| Wizard-Blocker UI | Nur API-seitig implementiert |
| Premium-Preise (2,99€) | Nur Datenmodell, nicht angewendet |

---

## Referenzen

- [CREDITS.md](../../BILLING/CREDITS.md) – Vollständige Dokumentation
- [ARCHITECTURE.md](../../ARCHITECTURE.md) – Systemübersicht
