"use client";

import React from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  /** Alert-Inhalt */
  children: React.ReactNode;
  /** Variante/Typ des Alerts */
  variant?: AlertVariant;
  /** Titel (optional) */
  title?: string;
  /** Schließbar */
  dismissible?: boolean;
  /** Callback beim Schließen */
  onDismiss?: () => void;
  /** Zusätzliche CSS-Klassen */
  className?: string;
};

/**
 * Alert – Hinweis- und Fehlermeldungen
 * 
 * Varianten:
 * - info: Allgemeine Information (blau)
 * - success: Erfolgsmeldung (grün)
 * - warning: Warnung (gelb)
 * - error: Fehlermeldung (rot)
 */
export function Alert({
  children,
  variant = "info",
  title,
  dismissible = false,
  onDismiss,
  className = "",
}: AlertProps) {
  const variantClass = `alert--${variant}`;

  // Deutsche Standardtitel
  const defaultTitles: Record<AlertVariant, string> = {
    info: "Hinweis",
    success: "Erfolgreich",
    warning: "Achtung",
    error: "Fehler",
  };

  const displayTitle = title ?? defaultTitles[variant];

  // Icons für jede Variante
  const icons: Record<AlertVariant, React.ReactNode> = {
    info: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="alert__icon">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="alert__icon">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="alert__icon">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="alert__icon">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={`alert ${variantClass} ${className}`} role="alert">
      <div className="alert__icon-wrapper">{icons[variant]}</div>
      <div className="alert__content">
        {displayTitle && <h4 className="alert__title">{displayTitle}</h4>}
        <div className="alert__message">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Schließen"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      <style jsx>{`
        .alert {
          display: flex;
          align-items: flex-start;
          gap: var(--space-md);
          padding: var(--space-md);
          border-radius: var(--radius-md);
          border: 1px solid;
        }

        /* Variant Colors */
        .alert--info {
          background: var(--color-info-soft);
          border-color: var(--color-info);
          color: var(--color-info);
        }

        .alert--success {
          background: var(--color-success-soft);
          border-color: var(--color-success);
          color: var(--color-success);
        }

        .alert--warning {
          background: var(--color-warning-soft);
          border-color: var(--color-warning);
          color: var(--color-warning);
        }

        .alert--error {
          background: var(--color-danger-soft);
          border-color: var(--color-danger);
          color: var(--color-danger);
        }

        .alert__icon-wrapper {
          flex-shrink: 0;
        }

        :global(.alert__icon) {
          width: 20px;
          height: 20px;
        }

        .alert__content {
          flex: 1;
          min-width: 0;
        }

        .alert__title {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          margin: 0 0 var(--space-xs) 0;
          color: inherit;
        }

        .alert__message {
          font-size: var(--text-sm);
          color: var(--color-text);
          line-height: var(--leading-normal);
        }

        .alert__dismiss {
          flex-shrink: 0;
          padding: var(--space-xs);
          background: transparent;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }

        .alert__dismiss:hover {
          opacity: 1;
        }

        .alert__dismiss svg {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </div>
  );
}

