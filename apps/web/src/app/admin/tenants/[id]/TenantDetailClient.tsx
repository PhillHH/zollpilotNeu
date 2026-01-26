"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Section } from "../../../design-system/primitives/Section";
import { Card } from "../../../design-system/primitives/Card";
import { Button } from "../../../design-system/primitives/Button";
import { Badge } from "../../../design-system/primitives/Badge";
import { Alert } from "../../../design-system/primitives/Alert";
import {
  admin,
  type TenantSummary,
  type LedgerEntry,
  type Plan,
} from "../../../lib/api/client";

type TenantDetailClientProps = {
  tenantId: string;
};

/**
 * Tenant Detail Client – Mandantendetails mit Guthaben-Verwaltung
 */
export function TenantDetailClient({ tenantId }: TenantDetailClientProps) {
  const [tenant, setTenant] = useState<TenantSummary | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Grant form
  const [grantAmount, setGrantAmount] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [granting, setGranting] = useState(false);

  // Plan assignment
  const [selectedPlan, setSelectedPlan] = useState("");
  const [settingPlan, setSettingPlan] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tenantsRes, plansRes, ledgerRes] = await Promise.all([
        admin.tenants.list(),
        admin.plans.list(),
        admin.tenants.ledger(tenantId),
      ]);

      const t = tenantsRes.data.find((x) => x.id === tenantId);
      if (!t) {
        setError("Mandant nicht gefunden.");
        return;
      }

      setTenant(t);
      setPlans(plansRes.data.filter((p) => p.is_active));
      setLedger(ledgerRes.data);
      setSelectedPlan(t.plan_code || "");
    } catch {
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(grantAmount, 10);
    if (!amount || amount <= 0) return;

    setGranting(true);
    setError(null);
    try {
      await admin.tenants.grantCredits(tenantId, amount, grantNote || undefined);
      setGrantAmount("");
      setGrantNote("");
      setSuccess("Guthaben erfolgreich vergeben.");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Guthaben konnte nicht vergeben werden.");
    } finally {
      setGranting(false);
    }
  };

  const handleSetPlan = async () => {
    if (!selectedPlan) return;

    setSettingPlan(true);
    setError(null);
    try {
      await admin.tenants.setPlan(tenantId, selectedPlan);
      setSuccess("Tarif erfolgreich zugewiesen.");
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Tarif konnte nicht zugewiesen werden.");
    } finally {
      setSettingPlan(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Mandant wird geladen...</p>
        </div>
        <style jsx>{`
          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  if (!tenant) {
    return (
      <Section maxWidth="xl" padding="xl">
        <Alert variant="error">Mandant nicht gefunden.</Alert>
        <div className="back-link-container">
          <Link href="/admin/tenants">
            <Button variant="secondary">Zurück zur Übersicht</Button>
          </Link>
        </div>
        <style jsx>{`
          .back-link-container {
            margin-top: var(--space-lg);
          }
        `}</style>
      </Section>
    );
  }

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="detail-header">
        <Link href="/admin/tenants" className="back-link">
          ← Zurück zur Mandantenübersicht
        </Link>
        <h1 className="tenant-name">{tenant.name}</h1>
        <p className="tenant-id">ID: {tenant.id}</p>
      </header>

      {/* Alerts */}
      {success && (
        <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cards Grid */}
      <div className="cards-grid">
        {/* Plan Card */}
        <Card title="Tarif" padding="lg">
          <div className="current-value">
            <span className="value-label">Aktueller Tarif</span>
            {tenant.plan_code ? (
              <Badge variant="info" size="md">{tenant.plan_code}</Badge>
            ) : (
              <span className="no-value">Kein Tarif zugewiesen</span>
            )}
          </div>

          <div className="plan-form">
            <div className="form-field">
              <label htmlFor="plan" className="field-label">
                Tarif zuweisen
              </label>
              <select
                id="plan"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="field-select"
              >
                <option value="">Tarif auswählen...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} – {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleSetPlan}
              disabled={!selectedPlan || selectedPlan === tenant.plan_code}
              loading={settingPlan}
            >
              Tarif speichern
            </Button>
          </div>
        </Card>

        {/* Credits Card */}
        <Card title="Guthaben" padding="lg">
          <div className="credits-display">
            <span className="credits-value">{tenant.credits_balance}</span>
            <span className="credits-label">Credits verfügbar</span>
          </div>

          <form onSubmit={handleGrant} className="grant-form">
            <div className="form-field">
              <label htmlFor="amount" className="field-label">
                Betrag
              </label>
              <input
                id="amount"
                type="number"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="z.B. 10"
                min="1"
                required
                className="field-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="note" className="field-label">
                Hinweis (optional)
              </label>
              <input
                id="note"
                type="text"
                value={grantNote}
                onChange={(e) => setGrantNote(e.target.value)}
                placeholder="z.B. Willkommensbonus"
                className="field-input"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={granting}
              fullWidth
            >
              Guthaben vergeben
            </Button>
          </form>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card title="Guthaben-Historie" description="Letzte 50 Einträge" padding="none">
        {ledger.length === 0 ? (
          <div className="empty-state">
            <p>Noch keine Guthabenbewegungen vorhanden.</p>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Änderung</th>
                <th>Grund</th>
                <th>Hinweis</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id}>
                  <td className="date-cell">{formatDate(entry.created_at)}</td>
                  <td className={`delta-cell ${entry.delta > 0 ? "positive" : "negative"}`}>
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta}
                  </td>
                  <td className="reason-cell">
                    <Badge variant={entry.reason === "ADMIN_GRANT" ? "success" : "info"} size="sm">
                      {getReasonLabel(entry.reason)}
                    </Badge>
                  </td>
                  <td className="note-cell">
                    {(entry.metadata_json as { note?: string } | null)?.note || "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <style jsx>{`
        .detail-header {
          margin-bottom: var(--space-xl);
        }

        :global(.back-link) {
          display: inline-block;
          color: var(--color-primary);
          font-size: var(--text-sm);
          text-decoration: none;
          margin-bottom: var(--space-md);
        }

        :global(.back-link):hover {
          text-decoration: underline;
        }

        .tenant-name {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .tenant-id {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          margin: 0;
        }

        /* Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        /* Current Value Display */
        .current-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md);
          background: var(--color-bg);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
        }

        .value-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .no-value {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          font-style: italic;
        }

        /* Plan Form */
        .plan-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        /* Credits Display */
        .credits-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-lg);
          background: var(--color-primary-softer);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-lg);
        }

        .credits-value {
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .credits-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        /* Grant Form */
        .grant-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        /* Form Fields */
        .form-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .field-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .field-input,
        .field-select {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          background: var(--color-surface);
          color: var(--color-text);
          transition: border-color var(--transition-fast);
        }

        .field-input:focus,
        .field-select:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
          color: var(--color-text-muted);
        }

        /* Ledger Table */
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ledger-table th,
        .ledger-table td {
          padding: var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-border-light);
        }

        .ledger-table th {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-bg);
        }

        .date-cell {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .delta-cell {
          font-weight: var(--font-semibold);
          font-family: var(--font-mono);
        }

        .delta-cell.positive {
          color: var(--color-success);
        }

        .delta-cell.negative {
          color: var(--color-danger);
        }

        .note-cell {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .ledger-table th,
          .ledger-table td {
            padding: var(--space-sm);
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </Section>
  );
}

/** Map reason codes to German labels */
function getReasonLabel(reason: string): string {
  switch (reason) {
    case "ADMIN_GRANT":
      return "Admin-Vergabe";
    case "PLAN_GRANT":
      return "Tarif-Bonus";
    case "PDF_EXPORT":
      return "PDF-Export";
    case "REFUND":
      return "Erstattung";
    default:
      return reason;
  }
}
