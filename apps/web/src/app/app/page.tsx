"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import { Button } from "../design-system/primitives/Button";
import { Badge } from "../design-system/primitives/Badge";
import { Alert } from "../design-system/primitives/Alert";
import {
  cases as casesApi,
  billing as billingApi,
  type CaseSummary,
  type BillingMe,
} from "../lib/api/client";

/**
 * App Dashboard – Übersicht für eingeloggte Benutzer
 */
export default function AppDashboard() {
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load recent cases
        const casesResponse = await casesApi.list("active");
        setRecentCases(casesResponse.data.slice(0, 5)); // Max 5 recent

        // Load billing info
        try {
          const billingResponse = await billingApi.me();
          setBillingInfo(billingResponse.data);
        } catch {
          // Billing may fail, don't block
        }
      } catch {
        setError("Daten konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return <Badge status="draft" />;
      case "SUBMITTED":
        return <Badge status="submitted" />;
      case "ARCHIVED":
        return <Badge status="archived" />;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Section maxWidth="xl" padding="xl">
        <div className="loading-state">
          <p>Laden...</p>
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
      {/* Page Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Übersicht</h1>
        <p className="dashboard-subtitle">
          Willkommen bei ZollPilot. Hier sehen Sie Ihre aktuellen Fälle und Ihren Kontostatus.
        </p>
      </header>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Cases Card */}
        <Card
          title="Aktive Fälle"
          description={recentCases.length > 0 ? `${recentCases.length} aktive Fälle` : "Noch keine Fälle"}
          headerAction={
            <Link href="/app/cases">
              <Button variant="ghost" size="sm">
                Alle anzeigen
              </Button>
            </Link>
          }
          padding="md"
          className="cases-card"
        >
          {recentCases.length === 0 ? (
            <div className="empty-state">
              <p className="empty-text">
                Sie haben noch keine aktiven Fälle angelegt.
              </p>
              <Link href="/app/cases">
                <Button variant="primary" size="sm">
                  Ersten Fall erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="cases-list">
              {recentCases.map((item) => (
                <li key={item.id} className="case-item">
                  <Link href={`/app/cases/${item.id}`} className="case-link">
                    <span className="case-title">{item.title}</span>
                    <span className="case-meta">
                      {getStatusBadge(item.status)}
                      <span className="case-date">{formatDate(item.updated_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Credits Card */}
        <Card
          title="Credits"
          description="Ihr aktuelles Guthaben"
          headerAction={
            <Link href="/app/billing">
              <Button variant="ghost" size="sm">
                Verwalten
              </Button>
            </Link>
          }
          padding="md"
          className="credits-card"
        >
          {billingInfo ? (
            <div className="credits-display">
              <span className="credits-value">{billingInfo.credits.balance}</span>
              <span className="credits-label">verfügbare Credits</span>
              {billingInfo.credits.balance === 0 && (
                <p className="credits-hint">
                  Credits werden für den PDF-Export benötigt.
                </p>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-text">Credits konnten nicht geladen werden.</p>
            </div>
          )}
        </Card>

        {/* Quick Actions Card */}
        <Card
          title="Schnellaktionen"
          description="Häufig verwendete Funktionen"
          padding="md"
          className="actions-card"
        >
          <div className="quick-actions">
            <Link href="/app/cases" className="action-link">
              <Button variant="primary" fullWidth>
                Neuen Fall erstellen
              </Button>
            </Link>
            <Link href="/faq" className="action-link">
              <Button variant="secondary" fullWidth>
                Hilfe & FAQ
              </Button>
            </Link>
          </div>
        </Card>

        {/* Info Card */}
        <Card
          title="So funktioniert&apos;s"
          padding="md"
          className="info-card"
        >
          <ol className="steps-list">
            <li>
              <strong>Fall anlegen:</strong> Erstellen Sie einen neuen Fall für Ihre Sendung.
            </li>
            <li>
              <strong>Daten eingeben:</strong> Füllen Sie den Wizard mit den Sendungsdaten aus.
            </li>
            <li>
              <strong>Einreichen:</strong> Prüfen und reichen Sie den Fall ein.
            </li>
            <li>
              <strong>PDF exportieren:</strong> Laden Sie das Dokument als PDF herunter.
            </li>
          </ol>
        </Card>
      </div>

      <style jsx>{`
        .dashboard-header {
          margin-bottom: var(--space-xl);
        }

        .dashboard-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .dashboard-subtitle {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
          margin: 0;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-lg);
        }

        :global(.cases-card) {
          grid-column: 1;
          grid-row: 1 / 3;
        }

        :global(.credits-card),
        :global(.actions-card) {
          grid-column: 2;
        }

        :global(.info-card) {
          grid-column: 1 / -1;
        }

        /* Cases List */
        .cases-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .case-item {
          border-bottom: 1px solid var(--color-border-light);
        }

        .case-item:last-child {
          border-bottom: none;
        }

        :global(.case-link) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) 0;
          text-decoration: none;
          color: inherit;
          transition: opacity var(--transition-fast);
        }

        :global(.case-link):hover {
          opacity: 0.8;
        }

        .case-title {
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .case-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .case-date {
          font-size: var(--text-sm);
          color: var(--color-text-light);
        }

        /* Credits Display */
        .credits-display {
          text-align: center;
          padding: var(--space-md);
        }

        .credits-value {
          display: block;
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }

        .credits-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .credits-hint {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: var(--space-md) 0 0 0;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        :global(.action-link) {
          text-decoration: none;
        }

        /* Steps List */
        .steps-list {
          margin: 0;
          padding: 0 0 0 var(--space-lg);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
        }

        .steps-list li {
          margin-bottom: var(--space-sm);
        }

        .steps-list :global(strong) {
          color: var(--color-text);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: var(--space-lg);
        }

        .empty-text {
          color: var(--color-text-muted);
          margin: 0 0 var(--space-md) 0;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          :global(.cases-card),
          :global(.credits-card),
          :global(.actions-card),
          :global(.info-card) {
            grid-column: 1;
            grid-row: auto;
          }
        }
      `}</style>
    </Section>
  );
}
