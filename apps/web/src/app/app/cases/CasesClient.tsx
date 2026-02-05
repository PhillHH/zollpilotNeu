"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";
import { Button } from "../../design-system/primitives/Button";
import { Badge } from "../../design-system/primitives/Badge";
import { Alert } from "../../design-system/primitives/Alert";
import {
  cases as casesApi,
  procedures as proceduresApi,
  type CaseSummary,
  type CaseDetail,
  type ProcedureDefinition,
} from "../../lib/api/client";

type StatusFilter = "active" | "archived";

type CasesClientProps = {
  initialCases: CaseSummary[];
};

type EnhancedCase = CaseSummary & {
  procedureName?: string;
  procedureCode?: string;
  totalSteps?: number;
  completedSteps?: number;
  isLoadingDetails?: boolean;
};

/**
 * Cases Liste – Übersicht aller Fälle
 *
 * Features:
 * - Fallkarten mit Titel, Verfahren, Fortschritt, Status
 * - Inline-Titel-Bearbeitung
 * - Fortschrittsanzeige (Schritt X von Y)
 * - Status-spezifische CTAs
 */
export function CasesClient({ initialCases }: CasesClientProps) {
  const [casesList, setCasesList] = useState<EnhancedCase[]>(
    initialCases.map((c) => ({ ...c }))
  );
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Editing state
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Procedure cache
  const [procedureCache, setProcedureCache] = useState<Record<string, ProcedureDefinition>>({});

  const refresh = async (statusFilter: StatusFilter) => {
    setLoading(true);
    try {
      const response = await casesApi.list(statusFilter);
      setCasesList(response.data.map((c) => ({ ...c })));
      setError(null);
    } catch {
      setError("Fälle konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  // Load case details and procedure info for progress calculation
  const loadCaseDetails = useCallback(async (caseId: string) => {
    try {
      const caseResponse = await casesApi.get(caseId);
      const caseDetail = caseResponse.data;

      let procedureDef: ProcedureDefinition | null = null;
      if (caseDetail.procedure?.code) {
        // Check cache first
        if (procedureCache[caseDetail.procedure.code]) {
          procedureDef = procedureCache[caseDetail.procedure.code];
        } else {
          try {
            const procResponse = await proceduresApi.get(caseDetail.procedure.code);
            procedureDef = procResponse.data;
            setProcedureCache((prev) => ({
              ...prev,
              [caseDetail.procedure!.code]: procedureDef!,
            }));
          } catch {
            // Procedure load failed, continue without it
          }
        }
      }

      // Calculate progress
      const progressInfo = calculateProgress(caseDetail, procedureDef);

      // Update case in list
      setCasesList((prev) =>
        prev.map((c) =>
          c.id === caseId
            ? {
                ...c,
                procedureName: caseDetail.procedure?.name,
                procedureCode: caseDetail.procedure?.code,
                ...progressInfo,
                isLoadingDetails: false,
              }
            : c
        )
      );
    } catch {
      // Failed to load details, mark as done loading
      setCasesList((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, isLoadingDetails: false } : c
        )
      );
    }
  }, [procedureCache]);

  // Calculate step completion
  const calculateProgress = (
    caseDetail: CaseDetail,
    procedure: ProcedureDefinition | null
  ): { totalSteps: number; completedSteps: number } => {
    if (!procedure) {
      return { totalSteps: 0, completedSteps: 0 };
    }

    const filledFields = new Set(
      caseDetail.fields
        .filter((f) => f.value !== null && f.value !== "" && f.value !== undefined)
        .map((f) => f.key)
    );

    let completedSteps = 0;
    for (const step of procedure.steps) {
      const requiredFields = step.fields.filter((f) => f.required);
      const allRequiredFilled = requiredFields.every((f) =>
        filledFields.has(f.field_key)
      );
      if (allRequiredFilled && requiredFields.length > 0) {
        completedSteps++;
      } else if (requiredFields.length === 0) {
        // Step has no required fields, count as complete if any field is filled
        const anyFilled = step.fields.some((f) => filledFields.has(f.field_key));
        if (anyFilled) completedSteps++;
      }
    }

    return {
      totalSteps: procedure.steps.length,
      completedSteps,
    };
  };

  // Load details for visible cases (DRAFT and IN_PROCESS)
  useEffect(() => {
    casesList.forEach((c) => {
      if (
        c.procedureName === undefined &&
        !c.isLoadingDetails &&
        ["DRAFT", "IN_PROCESS"].includes(c.status.toUpperCase())
      ) {
        setCasesList((prev) =>
          prev.map((item) =>
            item.id === c.id ? { ...item, isLoadingDetails: true } : item
          )
        );
        loadCaseDetails(c.id);
      }
    });
  }, [casesList, loadCaseDetails]);

  useEffect(() => {
    refresh(filter);
  }, [filter]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingCaseId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCaseId]);

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

  // Start editing title
  const handleStartEdit = (e: React.MouseEvent, caseItem: EnhancedCase) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCaseId(caseItem.id);
    setEditingTitle(caseItem.title || "");
  };

  // Save title
  const handleSaveTitle = async (caseId: string) => {
    const trimmedTitle = editingTitle.trim();

    // Validation: max 100 characters
    if (trimmedTitle.length > 100) {
      setError("Der Titel darf maximal 100 Zeichen lang sein.");
      return;
    }

    setSavingTitle(true);
    try {
      await casesApi.patch(caseId, { title: trimmedTitle || undefined });
      setCasesList((prev) =>
        prev.map((c) =>
          c.id === caseId ? { ...c, title: trimmedTitle } : c
        )
      );
      setEditingCaseId(null);
      setEditingTitle("");
    } catch {
      setError("Titel konnte nicht gespeichert werden.");
    } finally {
      setSavingTitle(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCaseId(null);
    setEditingTitle("");
  };

  // Handle key events in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent, caseId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle(caseId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
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

  const getCaseTitle = (caseItem: EnhancedCase) => {
    return caseItem.title || "Unbenannter Fall";
  };

  const getCaseCta = (caseItem: EnhancedCase) => {
    const status = caseItem.status.toUpperCase();
    switch (status) {
      case "DRAFT":
      case "IN_PROCESS":
        return { label: "Weiter ausfüllen", href: `/app/cases/${caseItem.id}/wizard` };
      case "PREPARED":
        return { label: "Zusammenfassung ansehen", href: `/app/cases/${caseItem.id}/summary` };
      case "COMPLETED":
        return { label: "Details ansehen", href: `/app/cases/${caseItem.id}/summary` };
      case "ARCHIVED":
        return { label: "Fall ansehen", href: `/app/cases/${caseItem.id}` };
      default:
        return { label: "Öffnen", href: `/app/cases/${caseItem.id}` };
    }
  };

  const hasOnlyCompletedCases = casesList.length > 0 &&
    casesList.every((c) => !["DRAFT", "IN_PROCESS"].includes(c.status.toUpperCase()));

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
                ? "Sie haben noch keine aktiven Fälle. Erstellen Sie Ihren ersten Fall, um mit der Vorbereitung Ihrer Zollanmeldung zu beginnen."
                : "Keine archivierten Fälle vorhanden."}
            </p>
            {filter === "active" && (
              <Button
                variant="primary"
                onClick={handleCreate}
                loading={creating}
              >
                Ersten Fall anlegen
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Hint for completed cases */}
          {hasOnlyCompletedCases && filter === "active" && (
            <div className="completed-hint">
              <Alert variant="info">
                Alle Ihre Fälle sind abgeschlossen. Möchten Sie einen neuen Fall starten?
              </Alert>
            </div>
          )}

          <div className="cases-list">
            {casesList.map((item) => {
              const cta = getCaseCta(item);
              const isEditing = editingCaseId === item.id;

              return (
                <Card key={item.id} padding="md" className="case-card" hoverable>
                  <div className="case-content">
                    {/* Left: Case Info */}
                    <div className="case-info">
                      {/* Title Row */}
                      <div className="case-title-row">
                        {isEditing ? (
                          <div className="title-edit" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={editInputRef}
                              type="text"
                              className="title-input"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                              onBlur={() => handleSaveTitle(item.id)}
                              maxLength={100}
                              placeholder="Fallname eingeben..."
                              disabled={savingTitle}
                            />
                            <span className="title-hint">
                              {savingTitle ? "Speichern..." : "Enter zum Speichern, Esc zum Abbrechen"}
                            </span>
                          </div>
                        ) : (
                          <h3 className="case-title">
                            <span className="title-text">{getCaseTitle(item)}</span>
                            {["DRAFT", "IN_PROCESS"].includes(item.status.toUpperCase()) && (
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={(e) => handleStartEdit(e, item)}
                                title="Titel bearbeiten"
                              >
                                ✏️
                              </button>
                            )}
                          </h3>
                        )}
                      </div>

                      {/* Procedure & Progress */}
                      <div className="case-meta">
                        {item.procedureName && (
                          <span className="case-procedure">
                            {item.procedureCode} – {item.procedureName}
                          </span>
                        )}
                        {item.totalSteps !== undefined && item.totalSteps > 0 && (
                          <span className="case-progress">
                            <span className="progress-bar">
                              <span
                                className="progress-fill"
                                style={{
                                  width: `${(item.completedSteps! / item.totalSteps) * 100}%`,
                                }}
                              />
                            </span>
                            <span className="progress-text">
                              {item.completedSteps} von {item.totalSteps} Schritten
                            </span>
                          </span>
                        )}
                        {item.isLoadingDetails && (
                          <span className="loading-details">Lädt...</span>
                        )}
                      </div>

                      {/* Date */}
                      <p className="case-date">
                        Letzte Änderung: {formatRelativeTime(item.updated_at)}
                      </p>
                    </div>

                    {/* Right: Status & CTA */}
                    <div className="case-actions">
                      <div className="case-status">
                        {getStatusBadge(item.status)}
                      </div>
                      <Link href={cta.href} className="case-cta-link">
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
        </>
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

        /* Completed Hint */
        .completed-hint {
          margin-bottom: var(--space-lg);
        }

        /* Cases List */
        .cases-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.case-card) {
          transition: border-color var(--transition-fast),
                      box-shadow var(--transition-fast) !important;
        }

        :global(.case-card:hover) {
          border-color: var(--color-primary) !important;
        }

        .case-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-lg);
        }

        .case-info {
          flex: 1;
          min-width: 0;
        }

        .case-title-row {
          margin-bottom: var(--space-sm);
        }

        .case-title {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0;
        }

        .title-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .edit-btn {
          background: none;
          border: none;
          padding: var(--space-xs);
          cursor: pointer;
          opacity: 0;
          transition: opacity var(--transition-fast);
          font-size: var(--text-sm);
        }

        .case-title:hover .edit-btn {
          opacity: 0.6;
        }

        .edit-btn:hover {
          opacity: 1 !important;
        }

        /* Title Edit */
        .title-edit {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .title-input {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          padding: var(--space-xs) var(--space-sm);
          border: 2px solid var(--color-primary);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-text);
          width: 100%;
          max-width: 400px;
        }

        .title-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px var(--color-primary-soft);
        }

        .title-hint {
          font-size: var(--text-xs);
          color: var(--color-text-light);
        }

        /* Case Meta */
        .case-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-sm);
        }

        .case-procedure {
          font-size: var(--text-sm);
          color: var(--color-primary);
          font-weight: var(--font-medium);
        }

        .case-progress {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .progress-bar {
          width: 80px;
          height: 6px;
          background: var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          display: block;
          height: 100%;
          background: var(--color-primary);
          border-radius: var(--radius-full);
          transition: width var(--transition-base);
        }

        .progress-text {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          white-space: nowrap;
        }

        .loading-details {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          font-style: italic;
        }

        .case-date {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        /* Case Actions */
        .case-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        :global(.case-cta-link) {
          text-decoration: none;
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
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        @media (max-width: 768px) {
          .cases-header {
            flex-direction: column;
            align-items: stretch;
          }

          .case-content {
            flex-direction: column;
            gap: var(--space-md);
          }

          .case-actions {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }

          .case-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-xs);
          }
        }
      `}</style>
    </Section>
  );
}
