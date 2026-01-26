"use client";

import { useState, useEffect } from "react";

import { billing, type BillingMe } from "../../lib/api/client";

export function BillingClient() {
  const [data, setData] = useState<BillingMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBilling = async () => {
      try {
        const response = await billing.me();
        setData(response.data);
      } catch {
        setError("Failed to load billing information.");
      } finally {
        setLoading(false);
      }
    };
    loadBilling();
  }, []);

  if (loading) {
    return <div className="loading">Loading billing information...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!data) {
    return <div className="error">No billing data available.</div>;
  }

  return (
    <div className="billing-container">
      <h1>Billing & Credits</h1>

      <section className="billing-card">
        <h2>Your Organization</h2>
        <p className="tenant-name">{data.tenant.name}</p>
      </section>

      <section className="billing-card">
        <h2>Current Plan</h2>
        {data.plan ? (
          <div className="plan-info">
            <span className="plan-badge">{data.plan.code}</span>
            <span className="plan-name">{data.plan.name}</span>
            {data.plan.price_cents !== null && data.plan.price_cents > 0 && (
              <span className="plan-price">
                {(data.plan.price_cents / 100).toFixed(2)} {data.plan.currency}/{data.plan.interval.toLowerCase()}
              </span>
            )}
          </div>
        ) : (
          <p className="no-plan">No plan assigned</p>
        )}
      </section>

      <section className="billing-card">
        <h2>Credits</h2>
        <div className="credits-display">
          <span className="credits-amount">{data.credits.balance}</span>
          <span className="credits-label">Available Credits</span>
        </div>
        <button type="button" className="btn-secondary" disabled>
          Purchase Credits (Coming Soon)
        </button>
      </section>

      <style jsx>{`
        .billing-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }
        h1 {
          margin-bottom: 1.5rem;
        }
        .billing-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        .billing-card h2 {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tenant-name {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }
        .plan-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .plan-badge {
          background: #2563eb;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .plan-name {
          font-size: 1.1rem;
        }
        .plan-price {
          color: #6b7280;
          font-size: 0.9rem;
        }
        .no-plan {
          color: #6b7280;
          margin: 0;
        }
        .credits-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 0;
        }
        .credits-amount {
          font-size: 3rem;
          font-weight: 700;
          color: #2563eb;
        }
        .credits-label {
          color: #6b7280;
          font-size: 0.9rem;
        }
        .btn-secondary {
          width: 100%;
          padding: 0.75rem;
          background: #e5e7eb;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          cursor: not-allowed;
          margin-top: 1rem;
        }
        .loading,
        .error {
          text-align: center;
          padding: 2rem;
        }
        .error {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

