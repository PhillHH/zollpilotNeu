"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import { admin, type TenantSummary } from "../../lib/api/client";

/**
 * Tenants Client – Mandantenübersicht
 */
export function TenantsClient() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTenants = async () => {
      try {
        const response = await admin.tenants.list();
        setTenants(response.data);
      } catch {
        setError("Mandanten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };
    loadTenants();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Mandanten werden geladen...</p>
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
      <header className="tenants-header">
        <div className="header-text">
          <h1 className="page-title">Mandanten</h1>
          <p className="page-subtitle">
            Übersicht aller registrierten Organisationen
          </p>
        </div>
      </header>

      {/* Error */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tenants Table */}
      {tenants.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3 className="empty-title">Keine Mandanten vorhanden</h3>
            <p className="empty-text">
              Sobald sich Benutzer registrieren, erscheinen deren Organisationen hier.
            </p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <table className="tenants-table">
            <thead>
              <tr>
                <th>Mandant</th>
                <th>Nutzer</th>
                <th>Erstellt am</th>
                <th>Tarif</th>
                <th>Guthaben</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="tenant-name">{tenant.name}</td>
                  <td className="user-count-cell">
                    <span className="user-count-value">{tenant.user_count}</span>
                  </td>
                  <td className="date-cell">{formatDate(tenant.created_at)}</td>
                  <td>
                    {tenant.plan_code ? (
                      <Badge variant="info">{tenant.plan_code}</Badge>
                    ) : (
                      <span className="no-plan">Kein Tarif</span>
                    )}
                  </td>
                  <td className="credits-cell">
                    <span className={`credits-value ${tenant.credits_balance === 0 ? "credits-zero" : ""}`}>
                      {tenant.credits_balance}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/tenants/${tenant.id}`}>
                      <Button variant="ghost" size="sm">
                        Verwalten
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <style jsx>{`
        .tenants-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
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

        /* Table Styles */
        .tenants-table {
          width: 100%;
          border-collapse: collapse;
        }

        .tenants-table th,
        .tenants-table td {
          padding: var(--space-md);
          text-align: left;
          border-bottom: 1px solid var(--color-border-light);
        }

        .tenants-table th {
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted);
          background: var(--color-bg);
        }

        .tenants-table tbody tr:hover {
          background: var(--color-border-light);
        }

        .tenant-name {
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .no-plan {
          color: var(--color-text-light);
          font-style: italic;
          font-size: var(--text-sm);
        }

        .user-count-cell {
          text-align: center;
        }

        .user-count-value {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          padding: var(--space-xs) var(--space-sm);
          background: var(--color-border-light);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .credits-cell {
          font-weight: var(--font-semibold);
        }

        .credits-value {
          color: var(--color-primary);
        }

        .credits-zero {
          color: var(--color-text-muted);
        }

        .date-cell {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-2xl);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
        }

        .empty-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .empty-text {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 768px) {
          .tenants-table th,
          .tenants-table td {
            padding: var(--space-sm);
            font-size: var(--text-sm);
          }
        }
      `}</style>
    </Section>
  );
}
