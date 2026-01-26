"use client";

import { useState, useEffect } from "react";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import { admin, type Plan } from "../../lib/api/client";

/**
 * Plans Client – Tarifverwaltung
 */
export function PlansClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newInterval, setNewInterval] = useState("NONE");
  const [newPrice, setNewPrice] = useState("");
  const [creating, setCreating] = useState(false);

  const loadPlans = async () => {
    try {
      const response = await admin.plans.list();
      setPlans(response.data);
      setError(null);
    } catch {
      setError("Tarife konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await admin.plans.create({
        code: newCode.toUpperCase(),
        name: newName,
        interval: newInterval,
        price_cents: newPrice ? parseInt(newPrice, 10) : undefined,
      });
      setShowCreate(false);
      setNewCode("");
      setNewName("");
      setNewInterval("NONE");
      setNewPrice("");
      setSuccess("Tarif erfolgreich erstellt.");
      await loadPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Tarif konnte nicht erstellt werden.");
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (id: string) => {
    setError(null);
    try {
      await admin.plans.activate(id);
      setSuccess("Tarif aktiviert.");
      await loadPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Tarif konnte nicht aktiviert werden.");
    }
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    try {
      await admin.plans.deactivate(id);
      setSuccess("Tarif deaktiviert.");
      await loadPlans();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Tarif konnte nicht deaktiviert werden.");
    }
  };

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case "MONTHLY":
        return "Monatlich";
      case "YEARLY":
        return "Jährlich";
      case "ONE_TIME":
        return "Einmalig";
      default:
        return "Keine";
    }
  };

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Tarife werden geladen...</p>
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

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="plans-header">
        <div className="header-text">
          <h1 className="page-title">Tarife</h1>
          <p className="page-subtitle">
            Verwalten Sie Abonnement-Tarife und Preise
          </p>
        </div>
        <Button
          variant={showCreate ? "secondary" : "primary"}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? "Abbrechen" : "Neuen Tarif erstellen"}
        </Button>
      </header>

      {/* Success/Error Alerts */}
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

      {/* Create Form */}
      {showCreate && (
        <Card title="Neuen Tarif erstellen" padding="lg" className="create-card">
          <form onSubmit={handleCreate} className="create-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="code" className="field-label">
                  Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="z.B. BASIC"
                  required
                  pattern="[A-Za-z0-9_]{2,32}"
                  className="field-input"
                />
                <p className="field-hint">Eindeutiger Bezeichner (nur Buchstaben/Zahlen)</p>
              </div>

              <div className="form-field">
                <label htmlFor="name" className="field-label">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Basis-Tarif"
                  required
                  className="field-input"
                />
                <p className="field-hint">Anzeigename für Benutzer</p>
              </div>

              <div className="form-field">
                <label htmlFor="interval" className="field-label">
                  Intervall
                </label>
                <select
                  id="interval"
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value)}
                  className="field-select"
                >
                  <option value="NONE">Keine Abrechnung</option>
                  <option value="MONTHLY">Monatlich</option>
                  <option value="YEARLY">Jährlich</option>
                  <option value="ONE_TIME">Einmalig</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="price" className="field-label">
                  Preis (Cent)
                </label>
                <input
                  id="price"
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="z.B. 999"
                  min="0"
                  className="field-input"
                />
                <p className="field-hint">Preis in Cent (999 = 9,99 €)</p>
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                loading={creating}
              >
                Tarif erstellen
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Plans Table */}
      <Card padding="none">
        <table className="plans-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Intervall</th>
              <th>Preis</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  Keine Tarife vorhanden
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <code className="plan-code">{plan.code}</code>
                  </td>
                  <td className="plan-name">{plan.name}</td>
                  <td className="plan-interval">{getIntervalLabel(plan.interval)}</td>
                  <td className="plan-price">
                    {plan.price_cents !== null
                      ? `${(plan.price_cents / 100).toFixed(2)} ${plan.currency}`
                      : "–"}
                  </td>
                  <td>
                    <Badge
                      variant={plan.is_active ? "success" : "info"}
                    >
                      {plan.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </td>
                  <td>
                    {plan.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(plan.id)}
                      >
                        Deaktivieren
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActivate(plan.id)}
                      >
                        Aktivieren
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <style jsx>{`
        .plans-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
          gap: var(--space-md);
        }

        .page-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .page-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Create Form */
        :global(.create-card) {
          margin-bottom: var(--space-lg);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
        }

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

        .field-hint {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0;
        }

        .form-actions {
          margin-top: var(--space-lg);
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border-light);
        }

        /* Table */
        .plans-table {
          width: 100%;
          border-collapse: collapse;
        }

        .plans-table th,
        .plans-table td {
          padding: var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-border-light);
        }

        .plans-table th {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-bg);
        }

        .plans-table tbody tr:hover {
          background: var(--color-border-light);
        }

        .plan-code {
          background: var(--color-border-light);
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-sm);
          font-size: var(--text-sm);
          font-family: var(--font-mono);
        }

        .plan-name {
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .plan-interval,
        .plan-price {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .empty-row {
          text-align: center;
          color: var(--color-text-muted);
          padding: var(--space-2xl) !important;
        }

        @media (max-width: 768px) {
          .plans-header {
            flex-direction: column;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .plans-table th,
          .plans-table td {
            padding: var(--space-sm);
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </Section>
  );
}
