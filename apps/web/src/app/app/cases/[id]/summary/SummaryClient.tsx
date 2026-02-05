"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Section } from "../../../../design-system/primitives/Section";
import { Card } from "../../../../design-system/primitives/Card";
import { Button } from "../../../../design-system/primitives/Button";
import { Badge } from "../../../../design-system/primitives/Badge";
import { Alert } from "../../../../design-system/primitives/Alert";
import { useToast } from "../../../../design-system/primitives/Toast";

import {
  cases as casesApi,
  billing as billingApi,
  type CaseDetail,
  type CaseSummaryOutput,
  type SnapshotSummary,
  type ApiError,
  type BillingMe,
} from "../../../../lib/api/client";

import {
  getErrorMessage,
  isConcurrentModificationError,
  createReloadAction,
} from "../../../../lib/errors";

type SummaryClientProps = {
  caseId: string;
};

/**
 * Summary Client – Zusammenfassung eines Falls
 */
export function SummaryClient({ caseId }: SummaryClientProps) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [summary, setSummary] = useState<CaseSummaryOutput | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingMe | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const caseResponse = await casesApi.get(caseId);
      setCaseData(caseResponse.data);

      const snapshotsResponse = await casesApi.listSnapshots(caseId);
      setSnapshots(snapshotsResponse.data);

      try {
        const billingResponse = await billingApi.me();
        setBillingInfo(billingResponse.data);
      } catch {
        setBillingInfo(null);
      }

      if (caseResponse.data.procedure) {
        try {
          const summaryResponse = await casesApi.getSummary(caseId);
          setSummary(summaryResponse.data);
        } catch {
          setSummary(null);
        }
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    setPdfError(null);

    try {
      const { blob, filename } = await casesApi.exportPdf(caseId);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        const billingResponse = await billingApi.me();
        setBillingInfo(billingResponse.data);
      } catch {
        // Ignore billing reload errors
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "INSUFFICIENT_CREDITS") {
        setPdfError("Nicht genügend Credits. Bitte laden Sie Credits auf.");
      } else if (apiErr.code === "CASE_NOT_SUBMITTED") {
        setPdfError("Fall muss zuerst abgeschlossen werden.");
      } else {
        setPdfError(apiErr.message || "PDF-Export fehlgeschlagen.");
      }
    } finally {
      setPdfLoading(false);
    }
  };

  const canDownloadPdf =
    ["PREPARED", "COMPLETED"].includes(caseData?.status ?? "") && (billingInfo?.credits.balance ?? 0) >= 1;
  const hasNoCredits = (billingInfo?.credits.balance ?? 0) < 1;

  // Reopen case for editing (PREPARED → IN_PROCESS)
  const [reopening, setReopening] = useState(false);
  const handleReopen = async () => {
    if (reopening) return; // Prevent double-click
    setReopening(true);
    setError(null);

    try {
      await casesApi.reopen(caseId);
      toast.success("Bearbeitung wieder geöffnet.");
      // Small delay for user to see feedback
      setTimeout(() => {
        router.push(`/app/cases/${caseId}/wizard`);
      }, 300);
    } catch (err) {
      const apiErr = err as ApiError;
      setReopening(false);

      if (isConcurrentModificationError(err)) {
        toast.error(getErrorMessage(apiErr.code), { action: createReloadAction() });
      } else {
        toast.error(getErrorMessage(apiErr.code));
      }
    }
  };

  // Mark case as completed (PREPARED → COMPLETED)
  const [completing, setCompleting] = useState(false);
  const handleComplete = async () => {
    if (completing) return; // Prevent double-click
    setCompleting(true);
    setError(null);

    try {
      await casesApi.complete(caseId);
      toast.success("Fall als erledigt markiert.");
      // Reload to show new status
      await loadData();
    } catch (err) {
      const apiErr = err as ApiError;

      if (isConcurrentModificationError(err)) {
        toast.error(getErrorMessage(apiErr.code), { action: createReloadAction() });
      } else {
        toast.error(getErrorMessage(apiErr.code));
      }
    } finally {
      setCompleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DRAFT":
        return <Badge status="draft" />;
      case "IN_PROCESS":
        return <Badge status="in_process" />;
      case "PREPARED":
        return <Badge status="prepared" />;
      case "COMPLETED":
        return <Badge status="completed" />;
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
            min-height: 400px;
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  if (error && !caseData) {
    return (
      <Section maxWidth="xl" padding="xl">
        <Alert variant="error">{error}</Alert>
        <div className="error-actions">
          <Button
            variant="secondary"
            onClick={() => router.push("/app/cases")}
          >
            Zurück zur Übersicht
          </Button>
        </div>
        <style jsx>{`
          .error-actions {
            margin-top: var(--space-lg);
            text-align: center;
          }
        `}</style>
      </Section>
    );
  }

  return (
    <Section maxWidth="xl" padding="xl">
      {/* Header */}
      <header className="summary-header">
        <Link href={`/app/cases/${caseId}`} className="back-link">
          ← Zurück zum Fall
        </Link>
        <div className="header-content">
          <h1 className="summary-title">{caseData?.title || "Zusammenfassung"}</h1>
          {getStatusBadge(caseData?.status || "")}
        </div>
      </header>

      {/* Info Banner */}
      {["PREPARED", "COMPLETED"].includes(caseData?.status ?? "") && (
        <Alert variant="info" title="Rechtlicher Hinweis">
          Diese Übersicht unterstützt Sie beim Ausfüllen des Zollformulars. Sie
          ersetzt keine offizielle Zollanmeldung.
        </Alert>
      )}

      {/* PREPARED Status: Next Steps CTA */}
      {caseData?.status === "PREPARED" && (
        <div className="assist-cta" style={{ marginBottom: "var(--space-xl)" }}>
          <Alert variant="success" title="Ihre Zollanmeldung ist vorbereitet">
            <div className="cta-content">
              <p>
                Nutzen Sie unsere <strong>interaktive Ausfüllhilfe</strong>, um die Daten
                Schritt für Schritt in das offizielle Zollformular zu übertragen.
              </p>
              <div className="cta-actions" style={{ marginTop: "var(--space-md)", display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/app/cases/${caseId}/assist`)}
                >
                  Ausfüllhilfe starten →
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReopen}
                  loading={reopening}
                >
                  Daten korrigieren
                </Button>
              </div>
              <div style={{ marginTop: "var(--space-md)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-md)" }}>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-sm)" }}>
                  Haben Sie die Zollanmeldung bereits beim Zoll eingereicht?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleComplete}
                  loading={completing}
                >
                  ✓ Als erledigt markieren
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* COMPLETED Status: Done Banner */}
      {caseData?.status === "COMPLETED" && (
        <div className="assist-cta" style={{ marginBottom: "var(--space-xl)" }}>
          <Alert variant="info" title="Zollanmeldung erledigt">
            <div className="cta-content">
              <p>
                Sie haben diesen Fall als erledigt markiert. Die Daten stehen weiterhin zur Ansicht und zum PDF-Export bereit.
              </p>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="summary-grid">
        {/* Summary Content */}
        <div className="summary-main">
          {summary ? (
            <>
              {summary.sections.map((section) => (
                <Card
                  key={section.title}
                  title={section.title}
                  padding="md"
                  className="section-card"
                >
                  <div className="section-items">
                    {section.items.map((item) => (
                      <div key={item.label} className="item-row">
                        <span className="item-label">{item.label}</span>
                        <span className="item-value">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}

              {/* PDF Download Card */}
              <Card title="Ausfüllhilfe exportieren" padding="md" className="export-card">
                {billingInfo && (
                  <div className="credits-info">
                    <span className="credits-label">Verfügbare Credits:</span>
                    <span
                      className={`credits-value ${hasNoCredits ? "credits-low" : ""}`}
                    >
                      {billingInfo.credits.balance}
                    </span>
                  </div>
                )}

                <Button
                  variant={canDownloadPdf ? "primary" : "secondary"}
                  onClick={handlePdfDownload}
                  disabled={!canDownloadPdf}
                  loading={pdfLoading}
                  fullWidth
                >
                  📄 Ausfüllhilfe herunterladen
                </Button>

                {pdfError && (
                  <Alert variant="error" className="pdf-error">
                    {pdfError}
                  </Alert>
                )}

                <p className="pdf-hint">
                  {!["PREPARED", "COMPLETED"].includes(caseData?.status ?? "")
                    ? "Vorbereitung muss zuerst abgeschlossen werden."
                    : hasNoCredits
                      ? (
                        <>
                          Keine Credits verfügbar.{" "}
                          <Link href="/app/billing">Credits aufladen →</Link>
                        </>
                      )
                      : "Export kostet 1 Credit."}
                </p>
              </Card>
            </>
          ) : caseData?.status === "DRAFT" || caseData?.status === "IN_PROCESS" ? (
            <Card padding="lg">
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3 className="empty-title">Vorbereitung nicht abgeschlossen</h3>
                <p className="empty-text">
                  Die Vorbereitung wurde noch nicht abgeschlossen. Füllen Sie den Wizard aus
                  und schließen Sie die Vorbereitung ab.
                </p>
                <Link href={`/app/cases/${caseId}/wizard`}>
                  <Button variant="primary">Weiter ausfüllen</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card padding="lg">
              <div className="empty-state">
                <p className="empty-text">Keine Zusammenfassung verfügbar.</p>
                <Link href={`/app/cases/${caseId}/wizard`}>
                  <Button variant="secondary">Daten bearbeiten</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="summary-sidebar">
          <Card title="Details" padding="md">
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value">
                  {getStatusBadge(caseData?.status || "")}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Version</span>
                <span className="meta-value">{caseData?.version}</span>
              </div>

              {caseData?.submitted_at && (
                <div className="meta-item">
                  <span className="meta-label">Bereit seit</span>
                  <span className="meta-value">{formatDate(caseData.submitted_at)}</span>
                </div>
              )}

              {summary && (
                <div className="meta-item">
                  <span className="meta-label">Verfahren</span>
                  <span className="meta-value">{summary.procedure.name}</span>
                </div>
              )}
            </div>
          </Card>

          {snapshots.length > 1 && (
            <Card title="Versionen" padding="md">
              <ul className="snapshot-list">
                {snapshots.map((s) => (
                  <li key={s.id} className="snapshot-item">
                    <span className="snapshot-version">Version {s.version}</span>
                    <span className="snapshot-date">{formatDate(s.created_at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <style jsx>{`
        .summary-header {
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

        .header-content {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .summary-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: var(--space-lg);
          align-items: start;
        }

        .summary-main {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .summary-sidebar {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        /* Section Items */
        .section-items {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-label {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .item-value {
          font-weight: var(--font-medium);
          color: var(--color-text);
          text-align: right;
          max-width: 60%;
        }

        /* Credits Info */
        .credits-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .credits-label {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .credits-value {
          font-weight: var(--font-semibold);
          color: var(--color-primary);
        }

        .credits-low {
          color: var(--color-danger);
        }

        :global(.pdf-error) {
          margin-top: var(--space-md);
        }

        .pdf-hint {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: var(--space-md) 0 0 0;
          text-align: center;
        }

        .pdf-hint :global(a) {
          color: var(--color-primary);
          text-decoration: none;
        }

        .pdf-hint :global(a):hover {
          text-decoration: underline;
        }

        /* Meta Grid */
        .meta-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .meta-value {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        /* Snapshot List */
        .snapshot-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .snapshot-item {
          display: flex;
          justify-content: space-between;
          padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--color-border-light);
        }

        .snapshot-item:last-child {
          border-bottom: none;
        }

        .snapshot-version {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .snapshot-date {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        /* Empty State */
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
          color: var(--color-text-muted);
          margin: 0 0 var(--space-lg) 0;
        }

        @media (max-width: 900px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .summary-sidebar {
            order: -1;
          }

          .item-row {
            flex-direction: column;
            gap: var(--space-xs);
          }

          .item-value {
            text-align: left;
            max-width: 100%;
          }
        }
      `}</style>
    </Section>
  );
}
