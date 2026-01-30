"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import { Button } from "../design-system/primitives/Button";
import { Badge } from "../design-system/primitives/Badge";
import { Alert } from "../design-system/primitives/Alert";
import {
  cases as casesApi,
  billing as billingApi,
  procedures as proceduresApi,
  type CaseSummary,
  type CaseDetail,
  type BillingMe,
} from "../lib/api/client";

/**
 * App Dashboard – Übersicht für eingeloggte Benutzer
 *
 * Struktur:
 * 1. Above the Fold: Dashboard-Cards (Aktive Fälle, Credits, Letzter Fortschritt)
 * 2. Aktive-Fälle-Sektion: Letzte 3 Fälle mit CTAs
 * 3. Leere Zustände: Klare Handlungsanweisungen
 */
export default function AppDashboard() {
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingMe | null>(null);
  const [lastDraftDetail, setLastDraftDetail] = useState<CaseDetail | null>(null);
  const [procedureSteps, setProcedureSteps] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load active cases
        const casesResponse = await casesApi.list("active");
        const activeCases = casesResponse.data;
        setRecentCases(activeCases);

        // Find the most recent draft case for "Letzter Fortschritt" card
        const lastDraft = activeCases.find(c => c.status.toUpperCase() === "DRAFT");
        if (lastDraft) {
          try {
            const detailResponse = await casesApi.get(lastDraft.id);
            setLastDraftDetail(detailResponse.data);

            // Load procedure info to get step count
            if (detailResponse.data.procedure?.code) {
              try {
                const procResponse = await proceduresApi.get(detailResponse.data.procedure.code);
                setProcedureSteps(procResponse.data.steps.length);
              } catch {
                // Procedure load failed, continue without step info
              }
            }
          } catch {
            // Case detail load failed, continue without it
          }
        }

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

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Gerade eben";
    if (diffMins < 60) return `Vor ${diffMins} Min.`;
    if (diffHours < 24) return `Vor ${diffHours} Std.`;
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    return formatDate(dateStr);
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

  // Derived data
  const draftCount = recentCases.filter((c: CaseSummary) => c.status.toUpperCase() === "DRAFT").length;
  const submittedCount = recentCases.filter((c: CaseSummary) => c.status.toUpperCase() === "SUBMITTED").length;
  const displayCases = recentCases.slice(0, 3); // Max 3 for the section
  const hasNoCases = recentCases.length === 0;
  const hasNoCredits = billingInfo?.credits.balance === 0;

  // Helper to get case title with fallback
  const getCaseTitle = (caseItem: CaseSummary) => {
    return caseItem.title || "Unbenannter Fall";
  };

  // Helper to get primary CTA for a case
  const getCaseCta = (caseItem: CaseSummary) => {
    const status = caseItem.status.toUpperCase();
    if (status === "DRAFT") {
      return { label: "Weiter ausfüllen", href: `/app/cases/${caseItem.id}/wizard` };
    }
    return { label: "Zusammenfassung ansehen", href: `/app/cases/${caseItem.id}/summary` };
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
          Ihr Dashboard für die Vorbereitung von Zollanmeldungen.
        </p>
      </header>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Dashboard Cards (Above the Fold) */}
      <div className="dashboard-cards">
        {/* Aktive Fälle Card */}
        <Card padding="md" className="stat-card">
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Aktive Fälle</span>
            </div>
            <div className="stat-numbers">
              <div className="stat-main">
                <span className="stat-value">{recentCases.length}</span>
                <span className="stat-unit">Fälle</span>
              </div>
              <div className="stat-breakdown">
                <span className="stat-detail">{draftCount} Entwürfe</span>
                <span className="stat-detail">{submittedCount} Abgeschlossen</span>
              </div>
            </div>
            <Link href="/app/cases" className="stat-cta">
              <Button variant="secondary" size="sm" fullWidth>
                Fälle anzeigen
              </Button>
            </Link>
          </div>
        </Card>

        {/* Credits Card */}
        <Card padding="md" className="stat-card credits-card-container">
          <div className="stat-content">
            <div className="stat-header">
              <span className="stat-icon">💳</span>
              <span className="stat-label">Credits</span>
            </div>
            {billingInfo ? (
              <>
                <div className="credits-display">
                  <span className={`credits-value ${hasNoCredits ? "credits-value--warning" : ""}`}>
                    {billingInfo.credits.balance}
                  </span>
                  <span className="credits-unit">verfügbar</span>
                </div>
                {hasNoCredits && (
                  <p className="credits-hint">
                    Credits werden für den PDF-Export benötigt.
                  </p>
                )}
                <Link href="/app/billing" className="stat-cta">
                  <Button variant="secondary" size="sm" fullWidth>
                    Credits verwalten
                  </Button>
                </Link>
              </>
            ) : (
              <div className="stat-error">
                <p>Credits konnten nicht geladen werden.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Letzter Fortschritt Card */}
        {lastDraftDetail ? (
          <Card padding="md" className="stat-card progress-card">
            <div className="stat-content">
              <div className="stat-header">
                <span className="stat-icon">✏️</span>
                <span className="stat-label">Letzter Fortschritt</span>
              </div>
              <div className="progress-info">
                <h3 className="progress-title">
                  {getCaseTitle(lastDraftDetail)}
                </h3>
                {lastDraftDetail.procedure ? (
                  <p className="progress-step">
                    {lastDraftDetail.procedure.name}
                    {procedureSteps && ` · ${procedureSteps} Schritte`}
                  </p>
                ) : (
                  <p className="progress-step">Verfahren wählen</p>
                )}
                <p className="progress-date">
                  Zuletzt bearbeitet: {formatRelativeTime(lastDraftDetail.updated_at)}
                </p>
              </div>
              <Link href={`/app/cases/${lastDraftDetail.id}/wizard`} className="stat-cta">
                <Button variant="primary" size="sm" fullWidth>
                  Fall fortsetzen
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Neuen Fall erstellen Card (wenn kein Entwurf existiert) */
          <Card padding="md" className="stat-card new-case-card">
            <div className="stat-content">
              <div className="stat-header">
                <span className="stat-icon">➕</span>
                <span className="stat-label">Neuer Fall</span>
              </div>
              <div className="new-case-info">
                <p className="new-case-text">
                  Starten Sie mit der Vorbereitung Ihrer Zollanmeldung.
                </p>
              </div>
              <Link href="/app/cases" className="stat-cta">
                <Button variant="primary" size="sm" fullWidth>
                  Neuen Fall erstellen
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Aktive-Fälle-Sektion */}
      <section className="cases-section">
        <div className="section-header">
          <h2 className="section-title">Ihre Fälle</h2>
          {recentCases.length > 3 && (
            <Link href="/app/cases">
              <Button variant="ghost" size="sm">
                Alle anzeigen ({recentCases.length})
              </Button>
            </Link>
          )}
        </div>

        {hasNoCases ? (
          /* Empty State: Keine Fälle */
          <Card padding="lg" className="empty-state-card">
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3 className="empty-title">Noch keine Fälle vorhanden</h3>
              <p className="empty-text">
                Erstellen Sie Ihren ersten Fall, um mit der Vorbereitung Ihrer Zollanmeldung zu beginnen.
              </p>
              <Link href="/app/cases">
                <Button variant="primary">
                  Neuen Fall erstellen
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="cases-list">
            {displayCases.map((caseItem) => {
              const cta = getCaseCta(caseItem);
              return (
                <Card key={caseItem.id} padding="md" className="case-card" hoverable>
                  <div className="case-content">
                    <div className="case-info">
                      <div className="case-header">
                        <h3 className="case-title">{getCaseTitle(caseItem)}</h3>
                        {getStatusBadge(caseItem.status)}
                      </div>
                      <p className="case-date">
                        Letzte Änderung: {formatRelativeTime(caseItem.updated_at)}
                      </p>
                    </div>
                    <div className="case-action">
                      <Link href={cta.href}>
                        <Button variant="primary" size="sm">
                          {cta.label}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Hinweis bei fehlenden Credits */}
      {hasNoCredits && !hasNoCases && recentCases.some((c: CaseSummary) => c.status.toUpperCase() === "SUBMITTED") && (
        <Alert variant="info">
          <strong>Keine Credits vorhanden.</strong> Um PDFs zu exportieren, benötigen Sie Credits.{" "}
          <Link href="/app/billing" className="alert-link">
            Zur Abrechnung
          </Link>
        </Alert>
      )}

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

        /* Dashboard Cards Grid */
        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-lg);
          margin-bottom: var(--space-2xl);
        }

        :global(.stat-card) {
          min-height: 200px;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
        }

        .stat-icon {
          font-size: var(--text-xl);
        }

        .stat-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-numbers {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .stat-main {
          display: flex;
          align-items: baseline;
          gap: var(--space-xs);
        }

        .stat-value {
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          color: var(--color-text);
          line-height: 1;
        }

        .stat-unit {
          font-size: var(--text-md);
          color: var(--color-text-muted);
        }

        .stat-breakdown {
          display: flex;
          gap: var(--space-md);
        }

        .stat-detail {
          font-size: var(--text-sm);
          color: var(--color-text-light);
        }

        :global(.stat-cta) {
          text-decoration: none;
          margin-top: auto;
        }

        .stat-error {
          flex: 1;
          display: flex;
          align-items: center;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        /* Credits Card */
        .credits-display {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-xs);
        }

        .credits-value {
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
          line-height: 1;
        }

        .credits-value--warning {
          color: var(--color-warning);
        }

        .credits-unit {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .credits-hint {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0;
        }

        /* Progress Card */
        .progress-info {
          flex: 1;
        }

        .progress-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
          line-height: var(--leading-tight);
        }

        .progress-step {
          font-size: var(--text-sm);
          color: var(--color-primary);
          margin: 0 0 var(--space-xs) 0;
        }

        .progress-date {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0;
        }

        /* New Case Card */
        .new-case-info {
          flex: 1;
        }

        .new-case-text {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
          line-height: var(--leading-relaxed);
        }

        /* Cases Section */
        .cases-section {
          margin-bottom: var(--space-xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        .section-title {
          font-size: var(--heading-h3);
          color: var(--color-text);
          margin: 0;
        }

        .cases-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.case-card) {
          transition: transform var(--transition-fast);
        }

        .case-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
        }

        .case-info {
          flex: 1;
          min-width: 0;
        }

        .case-header {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-xs);
        }

        .case-title {
          font-size: var(--text-md);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .case-date {
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
        }

        .case-action {
          flex-shrink: 0;
        }

        /* Empty State */
        :global(.empty-state-card) {
          border-style: dashed;
        }

        .empty-state {
          text-align: center;
          padding: var(--space-xl);
        }

        .empty-icon {
          font-size: var(--text-4xl);
          display: block;
          margin-bottom: var(--space-md);
        }

        .empty-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .empty-text {
          font-size: var(--text-md);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-lg) 0;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Alert Link */
        :global(.alert-link) {
          color: inherit;
          font-weight: var(--font-semibold);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .dashboard-cards {
            grid-template-columns: repeat(2, 1fr);
          }

          :global(.stat-card:last-child) {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .dashboard-cards {
            grid-template-columns: 1fr;
          }

          :global(.stat-card:last-child) {
            grid-column: auto;
          }

          .case-content {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-md);
          }

          .case-action {
            width: 100%;
          }

          .case-action :global(button) {
            width: 100%;
          }

          .stat-breakdown {
            flex-direction: column;
            gap: var(--space-xs);
          }
        }
      `}</style>
    </Section>
  );
}
