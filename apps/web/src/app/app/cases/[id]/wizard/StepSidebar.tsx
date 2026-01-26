"use client";

import { useMemo } from "react";
import type { ProcedureStep, ValidationError } from "../../../../lib/api/client";

type StepSidebarProps = {
  steps: ProcedureStep[];
  currentIndex: number;
  validationErrors: ValidationError[];
  onStepClick: (index: number) => void;
};

export function StepSidebar({
  steps,
  currentIndex,
  validationErrors,
  onStepClick,
}: StepSidebarProps) {
  // Count errors per step
  const errorsByStep = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const err of validationErrors) {
      counts[err.step_key] = (counts[err.step_key] ?? 0) + 1;
    }
    return counts;
  }, [validationErrors]);

  return (
    <aside className="step-sidebar">
      <h3 className="sidebar-title">Schritte</h3>
      <nav className="step-list">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;
          const errorCount = errorsByStep[step.step_key] ?? 0;

          return (
            <button
              key={step.step_key}
              type="button"
              className={`step-item ${isCurrent ? "current" : ""} ${
                isCompleted ? "completed" : ""
              } ${errorCount > 0 ? "has-errors" : ""}`}
              onClick={() => onStepClick(index)}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
              {errorCount > 0 && (
                <span className="error-badge" title={`${errorCount} Fehler`}>
                  {errorCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <style jsx>{`
        .step-sidebar {
          width: 250px;
          background: var(--color-surface, #1a1a21);
          border-right: 1px solid var(--color-border, #2a2a35);
          padding: 1.5rem;
          flex-shrink: 0;
        }

        .sidebar-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #8b8b9e);
          margin: 0 0 1rem 0;
        }

        .step-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          color: var(--color-text-muted, #8b8b9e);
          transition: all 0.2s;
          width: 100%;
        }

        .step-item:hover {
          background: rgba(99, 102, 241, 0.05);
          border-color: var(--color-border, #2a2a35);
        }

        .step-item.current {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--color-primary, #6366f1);
          color: var(--color-text, #e4e4eb);
        }

        .step-item.completed {
          color: var(--color-success, #4ade80);
        }

        .step-item.has-errors .step-number {
          background: var(--color-error, #f87171);
        }

        .step-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-border, #2a2a35);
          color: var(--color-text, #e4e4eb);
          font-size: 0.75rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .step-item.current .step-number {
          background: var(--color-primary, #6366f1);
        }

        .step-item.completed .step-number {
          background: var(--color-success, #4ade80);
          color: #0f0f12;
        }

        .step-title {
          flex: 1;
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .error-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: var(--color-error, #f87171);
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .step-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid var(--color-border, #2a2a35);
            padding: 1rem;
          }

          .step-list {
            flex-direction: row;
            overflow-x: auto;
            gap: 0.5rem;
            padding-bottom: 0.5rem;
          }

          .step-item {
            flex-direction: column;
            padding: 0.5rem;
            min-width: 80px;
            text-align: center;
          }

          .step-title {
            font-size: 0.7rem;
            white-space: normal;
            line-height: 1.2;
          }
        }
      `}</style>
    </aside>
  );
}

