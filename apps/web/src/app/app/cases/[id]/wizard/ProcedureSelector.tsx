"use client";

import { useState, useEffect } from "react";
import {
  procedures as proceduresApi,
  type ProcedureSummary,
  type ApiError,
} from "../../../../lib/api/client";

type ProcedureSelectorProps = {
  caseTitle: string;
  onSelect: (code: string) => void;
  onCancel: () => void;
};

export function ProcedureSelector({
  caseTitle,
  onSelect,
  onCancel,
}: ProcedureSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procedures, setProcedures] = useState<ProcedureSummary[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await proceduresApi.list();
        setProcedures(response.data);
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Fehler beim Laden der Verfahren.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleConfirm = async () => {
    if (!selectedCode) return;
    setBinding(true);
    setError(null);
    try {
      onSelect(selectedCode);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Fehler beim Auswählen.");
      setBinding(false);
    }
  };

  return (
    <div className="procedure-selector">
      <div className="selector-card">
        <h1>Verfahren auswählen</h1>
        <p className="subtitle">
          Wählen Sie ein Verfahren für <strong>&quot;{caseTitle}&quot;</strong>
        </p>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p className="loading">Laden...</p>
        ) : procedures.length === 0 ? (
          <p className="empty">Keine Verfahren verfügbar.</p>
        ) : (
          <div className="procedure-list">
            {procedures.map((proc) => (
              <button
                key={proc.code}
                type="button"
                className={`procedure-item ${
                  selectedCode === proc.code ? "selected" : ""
                }`}
                onClick={() => setSelectedCode(proc.code)}
              >
                <span className="procedure-name">{proc.name}</span>
                <span className="procedure-meta">
                  {proc.code} • {proc.version}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={binding}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={!selectedCode || binding}
          >
            {binding ? "Wird gebunden..." : "Verfahren starten"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .procedure-selector {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--color-bg, #0f0f12);
        }

        .selector-card {
          background: var(--color-surface, #1a1a21);
          border: 1px solid var(--color-border, #2a2a35);
          border-radius: 12px;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }

        h1 {
          font-size: 1.5rem;
          margin: 0 0 0.5rem 0;
          color: var(--color-text, #e4e4eb);
        }

        .subtitle {
          color: var(--color-text-muted, #8b8b9e);
          margin: 0 0 1.5rem 0;
          font-size: 0.9rem;
        }

        .error-message {
          background: rgba(248, 113, 113, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.3);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: var(--color-error, #f87171);
          margin-bottom: 1rem;
        }

        .loading,
        .empty {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted, #8b8b9e);
        }

        .procedure-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .procedure-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          padding: 1rem;
          background: var(--color-bg, #0f0f12);
          border: 2px solid var(--color-border, #2a2a35);
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          width: 100%;
        }

        .procedure-item:hover {
          border-color: var(--color-primary, #6366f1);
        }

        .procedure-item.selected {
          border-color: var(--color-primary, #6366f1);
          background: rgba(99, 102, 241, 0.1);
        }

        .procedure-name {
          font-weight: 500;
          color: var(--color-text, #e4e4eb);
        }

        .procedure-meta {
          font-size: 0.8rem;
          color: var(--color-text-muted, #8b8b9e);
        }

        .actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--color-border, #2a2a35);
          color: var(--color-text, #e4e4eb);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-border, #2a2a35);
        }

        .btn-primary {
          background: var(--color-primary, #6366f1);
          border: 1px solid var(--color-primary, #6366f1);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-hover, #818cf8);
          border-color: var(--color-primary-hover, #818cf8);
        }
      `}</style>
    </div>
  );
}

