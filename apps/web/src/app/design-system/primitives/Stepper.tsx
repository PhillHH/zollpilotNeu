"use client";

import React from "react";

type StepStatus = "pending" | "active" | "completed" | "error";

export type Step = {
  /** Eindeutige ID des Schritts */
  id: string;
  /** Anzeigename (Deutsch) */
  label: string;
  /** Beschreibung (optional) */
  description?: string;
  /** Status des Schritts */
  status: StepStatus;
};

type StepperProps = {
  /** Liste der Schritte */
  steps: Step[];
  /** Aktueller Schritt (ID) */
  currentStep?: string;
  /** Klick auf Schritt */
  onStepClick?: (stepId: string) => void;
  /** Ausrichtung */
  orientation?: "horizontal" | "vertical";
  /** Zusätzliche CSS-Klassen */
  className?: string;
};

/**
 * Stepper – Wizard Progress-Anzeige
 * 
 * Zeigt den Fortschritt durch mehrere Schritte an.
 * Unterstützt horizontale und vertikale Ausrichtung.
 */
export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = "horizontal",
  className = "",
}: StepperProps) {
  const orientationClass = `stepper--${orientation}`;

  return (
    <nav className={`stepper ${orientationClass} ${className}`} aria-label="Fortschritt">
      <ol className="stepper__list">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCurrent = step.id === currentStep;
          const statusClass = `step--${step.status}`;
          const currentClass = isCurrent ? "step--current" : "";
          const clickable = onStepClick && (step.status === "completed" || step.status === "active");

          return (
            <li
              key={step.id}
              className={`stepper__item ${statusClass} ${currentClass}`}
            >
              {clickable ? (
                <button
                  type="button"
                  className="step__button"
                  onClick={() => onStepClick(step.id)}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <StepContent step={step} index={index} />
                </button>
              ) : (
                <div className="step__content" aria-current={isCurrent ? "step" : undefined}>
                  <StepContent step={step} index={index} />
                </div>
              )}
              {!isLast && <div className="stepper__connector" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      <style jsx>{`
        .stepper {
          width: 100%;
        }

        .stepper__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        /* Horizontal Layout */
        .stepper--horizontal .stepper__list {
          display: flex;
          justify-content: space-between;
        }

        .stepper--horizontal .stepper__item {
          flex: 1;
          display: flex;
          align-items: center;
        }

        .stepper--horizontal .stepper__item:last-child {
          flex: 0;
        }

        .stepper--horizontal .stepper__connector {
          flex: 1;
          height: 2px;
          background: var(--color-border);
          margin: 0 var(--space-sm);
        }

        .stepper--horizontal .step--completed + .stepper__connector,
        .stepper--horizontal .step--completed .stepper__connector {
          background: var(--color-primary);
        }

        /* Vertical Layout */
        .stepper--vertical .stepper__list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .stepper--vertical .stepper__item {
          display: flex;
          flex-direction: column;
        }

        .stepper--vertical .stepper__connector {
          width: 2px;
          height: var(--space-lg);
          background: var(--color-border);
          margin-left: 15px;
        }

        .stepper--vertical .step--completed .stepper__connector {
          background: var(--color-primary);
        }

        /* Step Button/Content */
        :global(.step__button),
        :global(.step__content) {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          background: none;
          border: none;
          padding: var(--space-sm);
          cursor: default;
          text-align: left;
          font: inherit;
          color: inherit;
        }

        :global(.step__button) {
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        :global(.step__button:hover) {
          background: var(--color-primary-softer);
        }

        :global(.step__button:focus-visible) {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }

        /* Step States */
        .step--pending :global(.step__indicator) {
          background: var(--color-border-light);
          border-color: var(--color-border);
          color: var(--color-text-muted);
        }

        .step--active :global(.step__indicator) {
          background: var(--color-primary-soft);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .step--completed :global(.step__indicator) {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .step--error :global(.step__indicator) {
          background: var(--color-danger-soft);
          border-color: var(--color-danger);
          color: var(--color-danger);
        }

        .step--pending :global(.step__label) {
          color: var(--color-text-muted);
        }

        .step--active :global(.step__label) {
          color: var(--color-text);
          font-weight: var(--font-semibold);
        }

        .step--completed :global(.step__label) {
          color: var(--color-text);
        }

        .step--error :global(.step__label) {
          color: var(--color-danger);
        }
      `}</style>
    </nav>
  );
}

/** Interne Komponente für Step-Inhalt */
function StepContent({ step, index }: { step: Step; index: number }) {
  return (
    <>
      <span className="step__indicator">
        {step.status === "completed" ? (
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : step.status === "error" ? (
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)" }}>
            {index + 1}
          </span>
        )}
      </span>
      <span className="step__text">
        <span className="step__label">{step.label}</span>
        {step.description && (
          <span className="step__description">{step.description}</span>
        )}
      </span>

      <style jsx>{`
        .step__indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 2px solid;
          flex-shrink: 0;
          transition: background var(--transition-fast),
                      border-color var(--transition-fast),
                      color var(--transition-fast);
        }

        .step__text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .step__label {
          font-size: var(--text-sm);
          line-height: var(--leading-tight);
        }

        .step__description {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }
      `}</style>
    </>
  );
}

