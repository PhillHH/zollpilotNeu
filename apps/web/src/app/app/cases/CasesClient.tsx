"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import { cases as casesApi, type CaseSummary } from "../../lib/api/client";

type StatusFilter = "active" | "archived";

type CasesClientProps = {
  initialCases: CaseSummary[];
};

/**
 * Cases Liste – Übersicht aller Fälle
 */
export function CasesClient({ initialCases }: CasesClientProps) {
  const [casesList, setCasesList] = useState<CaseSummary[]>(initialCases);
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const refresh = async (statusFilter: StatusFilter) => {
    setLoading(true);
    try {
      const response = await casesApi.list(statusFilter);
      setCasesList(response.data);
      setError(null);
    } catch {
      setError("Fälle konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(filter);
  }, [filter]);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      await casesApi.create();
      await refresh(filter);
    } catch {
      setError("Fall konnte nicht erstellt werden.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "DRAFT":
        return <Badge status="draft">{""}</Badge>;
      case "SUBMITTED":
        return <Badge status="submitted">{""}</Badge>;
      case "ARCHIVED":
        return <Badge status="archived">{""}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Section maxWidth="lg" padding="xl">
      {/* Page Header */}
      <header className="cases-header">
        <div className="header-text">
          <h1 className="cases-title">Fälle</h1>
          <p className="cases-subtitle">
            Verwalten Sie Ihre Zollanmeldungen
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreate}
          loading={creating}
        >
          Neuen Fall erstellen
        </Button>
      </header>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`filter-tab ${filter === "active" ? "filter-tab--active" : ""}`}
        >
          Aktive Fälle
        </button>
        <button
          type="button"
          onClick={() => setFilter("archived")}
          className={`filter-tab ${filter === "archived" ? "filter-tab--active" : ""}`}
        >
          Archiviert
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cases List */}
      {loading ? (
        <Card padding="lg">
          <p className="loading-text">Laden...</p>
        </Card>
      ) : casesList.length === 0 ? (
        <Card padding="lg">
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3 className="empty-title">Keine Fälle gefunden</h3>
            <p className="empty-text">
              {filter === "active"
                ? "Sie haben noch keine aktiven Fälle. Erstellen Sie Ihren ersten Fall."
                : "Keine archivierten Fälle vorhanden."}
            </p>
            {filter === "active" && (
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={creating}
              >
                Ersten Fall erstellen
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="cases-list">
          {casesList.map((item) => (
            <Link key={item.id} href={`/app/cases/${item.id}`} className="case-link">
              <Card hoverable padding="md" className="case-card">
                <div className="case-content">
                  <div className="case-info">
                    <h3 className="case-title">{item.title}</h3>
                    <p className="case-date">
                      Zuletzt aktualisiert: {formatDate(item.updated_at)}
                    </p>
                  </div>
                  <div className="case-status">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        .cases-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
          gap: var(--space-md);
        }

        .cases-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .cases-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Filter Tabs */
        .filter-tabs {
          display: flex;
          gap: var(--space-xs);
          margin-bottom: var(--space-lg);
          border-bottom: 1px solid var(--color-border);
          padding-bottom: var(--space-xs);
        }

        .filter-tab {
          padding: var(--space-sm) var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: color var(--transition-fast),
                      border-color var(--transition-fast);
        }

        .filter-tab:hover {
          color: var(--color-text);
        }

        .filter-tab--active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        /* Cases List */
        .cases-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.case-link) {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        :global(.case-card) {
          transition: border-color var(--transition-fast),
                      transform var(--transition-fast) !important;
        }

        :global(.case-card:hover) {
          border-color: var(--color-primary) !important;
        }

        .case-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }

        .case-title {
          font-size: var(--text-lg);
          font-weight: var(--font-medium);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .case-date {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Loading & Empty States */
        .loading-text {
          text-align: center;
          color: var(--color-text-muted);
          margin: 0;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-xl);
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
          margin: 0 0 var(--space-lg) 0;
        }

        @media (max-width: 640px) {
          .cases-header {
            flex-direction: column;
            align-items: stretch;
          }

          .case-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .case-status {
            margin-top: var(--space-sm);
          }
        }
      `}</style>
    </Section>
  );
}
