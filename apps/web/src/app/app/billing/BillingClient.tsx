"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Alert } from "../../design-system/primitives/Alert";
import { billing, BillingMe, CreditHistoryEntry, PricingTier, ApiError } from "../../lib/api/client";

type LoadingState = "loading" | "loaded" | "error";
type PurchaseState = "idle" | "purchasing" | "success" | "error";

/**
 * Formatiert den Reason-Code in lesbare deutsche Beschreibung
 */
function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    ADMIN_GRANT: "Gutschrift",
    PDF_EXPORT: "Ausfüllhilfe exportiert",
    AUSFUELLHILFE: "Ausfüllhilfe verwendet",
    INITIAL_GRANT: "Startguthaben",
    PURCHASE: "Kauf",
    REFUND: "Rückerstattung",
  };
  return reasonMap[reason] ?? reason;
}

/**
 * Formatiert Cent-Beträge in Euro-Währung
 */
function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * Formatiert das Datum in deutsches Format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * BillingClient - Abrechnungsübersicht
 *
 * Zeigt Credit-Guthaben, Preislogik, Preisvergleich und Historie.
 */
export function BillingClient() {
  const [billingInfo, setBillingInfo] = useState<BillingMe | null>(null);
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [loadState, setLoadState] = useState<LoadingState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [showPriceInfo, setShowPriceInfo] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle");
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [billingRes, historyRes, pricingRes] = await Promise.all([
        billing.me(),
        billing.history(20),
        billing.pricing(),
      ]);
      setBillingInfo(billingRes.data);
      setHistory(historyRes.data);
      setPricingTiers(pricingRes.data.tiers);
      setLoadState("loaded");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Daten"
      );
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = useCallback(async (tier: PricingTier) => {
    setPurchaseState("purchasing");
    setPurchaseError(null);
    setSelectedTier(tier);

    try {
      const result = await billing.purchaseCredits(tier.credits);
      // Update billing info with new balance
      if (billingInfo) {
        setBillingInfo({
          ...billingInfo,
          credits: { balance: result.data.balance },
        });
      }
      setPurchaseState("success");
      // Reload history after purchase
      const historyRes = await billing.history(20);
      setHistory(historyRes.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setPurchaseError(apiErr.message || "Kauf fehlgeschlagen");
      setPurchaseState("error");
    }
  }, [billingInfo]);

  const closePurchaseModal = useCallback(() => {
    setShowPurchaseModal(false);
    setPurchaseState("idle");
    setPurchaseError(null);
    setSelectedTier(null);
  }, []);

  if (loadState === "loading") {
    return (
      <Section>
        <div className="loading-container">
          <p>Lade Kosten und Credits...</p>
        </div>
        <style jsx>{`
          .loading-container {
            text-align: center;
            padding: var(--space-xl);
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  if (loadState === "error" || !billingInfo) {
    return (
      <Section>
        <Alert variant="error">
          {error ?? "Kosten und Credits konnten nicht geladen werden."}
        </Alert>
      </Section>
    );
  }

  return (
    <Section>
      <div className="billing-page">
        <h1 className="page-title">Kosten & Credits</h1>

        {/* Credit Balance Section */}
        <div className="section-grid">
          <Card>
            <div className="balance-card">
              <div className="balance-header">
                <h2>Ihr Guthaben</h2>
              </div>
              <div className="balance-value">
                <span className="balance-number">{billingInfo.credits.balance}</span>
                <span className="balance-unit">Credits</span>
              </div>
              <p className="balance-hint">
                Ein Credit entspricht einer Ausfüllhilfe.
              </p>
              <div className="balance-actions">
                <Button
                  variant="primary"
                  onClick={() => setShowPurchaseModal(true)}
                >
                  Credits kaufen
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowPriceInfo(!showPriceInfo)}
                >
                  {showPriceInfo ? "Preise ausblenden" : "Preise anzeigen"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Plan Info */}
          {billingInfo.plan && (
            <Card>
              <div className="plan-card">
                <h2>Aktueller Tarif</h2>
                <div className="plan-name">{billingInfo.plan.name}</div>
                <p className="plan-code">{billingInfo.plan.code}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Price Info Modal/Section */}
        {showPriceInfo && (
          <Card>
            <div className="price-info">
              <h2>Preisübersicht</h2>
              <div className="price-table">
                <div className="price-row">
                  <div className="price-label">IZA Ausfüllhilfe</div>
                  <div className="price-credits">1 Credit</div>
                  <div className="price-value">1,49 EUR</div>
                </div>
                <div className="price-row">
                  <div className="price-label">IZA Premium Ausfüllhilfe</div>
                  <div className="price-credits">2 Credits</div>
                  <div className="price-value">2,99 EUR</div>
                </div>
              </div>
              <p className="price-note">
                Credits sind unbegrenzt gültig und werden nur bei erfolgreichem Export verbraucht.
              </p>
            </div>
          </Card>
        )}

        {/* Price Comparison Section */}
        <Card>
          <div className="comparison-section">
            <h2>Kostenvergleich</h2>
            <p className="comparison-intro">
              Die Vorbereitung Ihrer Zollanmeldung mit ZollPilot ist deutlich günstiger als vergleichbare Dienste.
            </p>
            <div className="comparison-table">
              <div className="comparison-row comparison-header">
                <div className="comparison-service">Anbieter</div>
                <div className="comparison-price">Preis pro Sendung</div>
              </div>
              <div className="comparison-row comparison-highlight">
                <div className="comparison-service">
                  <strong>ZollPilot</strong>
                  <span className="comparison-note">Ausfüllhilfe</span>
                </div>
                <div className="comparison-price highlight-price">ab 1,49 EUR</div>
              </div>
              <div className="comparison-row">
                <div className="comparison-service">
                  Versanddienstleister
                  <span className="comparison-note">Zollabwicklung</span>
                </div>
                <div className="comparison-price">6 - 15 EUR</div>
              </div>
            </div>
            <p className="comparison-disclaimer">
              Hinweis: ZollPilot erstellt Ausfüllhilfen zur Vorbereitung Ihrer Zollanmeldung.
              Die eigentliche Anmeldung erfolgt durch Sie selbst beim Zoll.
            </p>
          </div>
        </Card>

        {/* Credit History Section */}
        <Card>
          <div className="history-section">
            <h2>Credit-Historie</h2>
            {history.length === 0 ? (
              <p className="history-empty">Noch keine Transaktionen vorhanden.</p>
            ) : (
              <div className="history-table">
                <div className="history-row history-header">
                  <div className="history-date">Datum</div>
                  <div className="history-reason">Aktion</div>
                  <div className="history-case">Bezug</div>
                  <div className="history-delta">Credits</div>
                </div>
                {history.map((entry) => (
                  <div key={entry.id} className="history-row">
                    <div className="history-date">{formatDate(entry.created_at)}</div>
                    <div className="history-reason">{formatReason(entry.reason)}</div>
                    <div className="history-case">{entry.case_title ?? "-"}</div>
                    <div className={`history-delta ${entry.delta > 0 ? "positive" : "negative"}`}>
                      {entry.delta > 0 ? "+" : ""}{entry.delta}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <style jsx>{`
        .billing-page {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .page-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        /* Balance Card */
        .balance-card {
          text-align: center;
        }

        .balance-header h2 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
        }

        .balance-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-sm);
        }

        .balance-number {
          font-size: 3rem;
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .balance-unit {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
        }

        .balance-hint {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-lg) 0;
        }

        .balance-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        /* Plan Card */
        .plan-card {
          text-align: center;
        }

        .plan-card h2 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
        }

        .plan-name {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--color-text);
          margin-bottom: var(--space-xs);
        }

        .plan-code {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Price Info */
        .price-info h2 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
        }

        .price-table {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .price-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: var(--space-lg);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .price-row:last-child {
          border-bottom: none;
        }

        .price-label {
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .price-credits {
          color: var(--color-text-muted);
        }

        .price-value {
          font-weight: var(--font-semibold);
          color: var(--color-primary);
        }

        .price-note {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Comparison Section */
        .comparison-section h2 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .comparison-intro {
          color: var(--color-text-muted);
          margin: 0 0 var(--space-lg) 0;
        }

        .comparison-table {
          display: flex;
          flex-direction: column;
          margin-bottom: var(--space-md);
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: var(--space-lg);
          padding: var(--space-md);
          border-bottom: 1px solid var(--color-border-light);
        }

        .comparison-row:last-child {
          border-bottom: none;
        }

        .comparison-header {
          background: var(--color-border-light);
          font-weight: var(--font-semibold);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
        }

        .comparison-highlight {
          background: var(--color-primary-softer);
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-md);
        }

        .comparison-service {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .comparison-note {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        .comparison-price {
          text-align: right;
          color: var(--color-text);
        }

        .highlight-price {
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .comparison-disclaimer {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
          padding: var(--space-sm);
          background: var(--color-border-light);
          border-radius: var(--radius-md);
        }

        /* History Section */
        .history-section h2 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
        }

        .history-empty {
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--space-lg);
        }

        .history-table {
          display: flex;
          flex-direction: column;
        }

        .history-row {
          display: grid;
          grid-template-columns: 140px 1fr 1fr 80px;
          gap: var(--space-md);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
          font-size: var(--text-sm);
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .history-header {
          font-weight: var(--font-semibold);
          color: var(--color-text-muted);
          border-bottom: 2px solid var(--color-border);
        }

        .history-date {
          color: var(--color-text-muted);
        }

        .history-reason {
          color: var(--color-text);
        }

        .history-case {
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-delta {
          text-align: right;
          font-weight: var(--font-semibold);
        }

        .history-delta.positive {
          color: var(--color-success);
        }

        .history-delta.negative {
          color: var(--color-danger);
        }

        @media (max-width: 640px) {
          .history-row {
            grid-template-columns: 100px 1fr 60px;
          }

          .history-case {
            display: none;
          }

          .comparison-row {
            grid-template-columns: 1fr;
            gap: var(--space-xs);
          }

          .comparison-price {
            text-align: left;
          }
        }

        /* Purchase Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
        }

        .modal-content {
          background: var(--color-background);
          border-radius: var(--radius-lg);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--color-border-light);
        }

        .modal-header h2 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: var(--text-xl);
          cursor: pointer;
          color: var(--color-text-muted);
          padding: var(--space-xs);
        }

        .modal-close:hover {
          color: var(--color-text);
        }

        .modal-body {
          padding: var(--space-lg);
        }

        .tier-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .tier-card {
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .tier-card:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-softer);
        }

        .tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .tier-name {
          font-weight: var(--font-semibold);
          color: var(--color-text);
        }

        .tier-price {
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .tier-description {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        .purchase-success {
          text-align: center;
          padding: var(--space-lg);
        }

        .success-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
        }

        .success-message {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-success);
          margin: 0 0 var(--space-sm) 0;
        }

        .success-details {
          color: var(--color-text-muted);
          margin: 0 0 var(--space-lg) 0;
        }
      `}</style>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={closePurchaseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Credits kaufen</h2>
              <button className="modal-close" onClick={closePurchaseModal} type="button">
                ×
              </button>
            </div>
            <div className="modal-body">
              {purchaseState === "success" && selectedTier ? (
                <div className="purchase-success">
                  <div className="success-icon">✓</div>
                  <p className="success-message">Kauf erfolgreich!</p>
                  <p className="success-details">
                    {selectedTier.credits} Credit{selectedTier.credits > 1 ? "s" : ""} wurden Ihrem Konto gutgeschrieben.
                  </p>
                  <Button variant="primary" onClick={closePurchaseModal}>
                    Schließen
                  </Button>
                </div>
              ) : purchaseState === "error" ? (
                <>
                  <Alert variant="error">{purchaseError}</Alert>
                  <div style={{ marginTop: "var(--space-md)" }}>
                    <Button variant="secondary" onClick={() => setPurchaseState("idle")}>
                      Erneut versuchen
                    </Button>
                  </div>
                </>
              ) : purchaseState === "purchasing" ? (
                <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
                  <p>Verarbeite Kauf...</p>
                </div>
              ) : (
                <>
                  <p style={{ marginBottom: "var(--space-lg)", color: "var(--color-text-muted)" }}>
                    Wählen Sie ein Paket:
                  </p>
                  <div className="tier-list">
                    {pricingTiers.map((tier) => (
                      <div
                        key={tier.name}
                        className="tier-card"
                        onClick={() => handlePurchase(tier)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && handlePurchase(tier)}
                      >
                        <div className="tier-header">
                          <span className="tier-name">{tier.name}</span>
                          <span className="tier-price">{formatPrice(tier.price_cents)}</span>
                        </div>
                        <p className="tier-description">{tier.description}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: "var(--space-lg)", fontSize: "var(--text-sm)", color: "var(--color-text-light)" }}>
                    Hinweis: Dies ist eine Demo. In der Produktionsversion würde hier die Zahlung über einen Zahlungsanbieter erfolgen.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
