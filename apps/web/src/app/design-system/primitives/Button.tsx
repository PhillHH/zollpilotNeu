"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  /** Button-Inhalt */
  children: React.ReactNode;
  /** Variante des Buttons */
  variant?: ButtonVariant;
  /** Größe des Buttons */
  size?: ButtonSize;
  /** Volle Breite */
  fullWidth?: boolean;
  /** Deaktiviert */
  disabled?: boolean;
  /** Lädt (zeigt Ladezustand) */
  loading?: boolean;
  /** Button-Typ */
  type?: "button" | "submit" | "reset";
  /** Click-Handler */
  onClick?: () => void;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Tooltip-Text */
  title?: string;
};

/**
 * Button – Interaktiver Button mit verschiedenen Varianten
 * 
 * Varianten:
 * - primary: Hauptaktion (grün)
 * - secondary: Sekundäre Aktion (border)
 * - ghost: Tertiäre Aktion (transparent)
 * - danger: Destruktive Aktion (rot)
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  type = "button",
  onClick,
  className = "",
  title,
}: ButtonProps) {
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? "btn--full-width" : "";
  const loadingClass = loading ? "btn--loading" : "";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${fullWidthClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
    >
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="btn__spinner-icon">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
          </svg>
        </span>
      )}
      <span className="btn__content">{children}</span>

      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          font-family: var(--font-sans);
          font-weight: var(--font-medium);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast),
                      border-color var(--transition-fast),
                      color var(--transition-fast),
                      box-shadow var(--transition-fast),
                      transform var(--transition-fast);
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px var(--color-primary-soft);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:not(:disabled):active {
          transform: scale(0.98);
        }

        /* Size Variants */
        .btn--sm {
          font-size: var(--text-sm);
          padding: var(--space-xs) var(--space-sm);
          min-height: 32px;
        }

        .btn--md {
          font-size: var(--text-base);
          padding: var(--space-sm) var(--space-md);
          min-height: 40px;
        }

        .btn--lg {
          font-size: var(--text-lg);
          padding: var(--space-md) var(--space-lg);
          min-height: 48px;
        }

        /* Variant: Primary */
        .btn--primary {
          background: var(--color-primary);
          color: var(--color-text-on-primary);
          border-color: var(--color-primary);
        }

        .btn--primary:not(:disabled):hover {
          background: var(--color-primary-hover);
          border-color: var(--color-primary-hover);
        }

        /* Variant: Secondary */
        .btn--secondary {
          background: transparent;
          color: var(--color-text);
          border-color: var(--color-border);
        }

        .btn--secondary:not(:disabled):hover {
          background: var(--color-primary-softer);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        /* Variant: Ghost */
        .btn--ghost {
          background: transparent;
          color: var(--color-text-muted);
          border-color: transparent;
        }

        .btn--ghost:not(:disabled):hover {
          background: var(--color-border-light);
          color: var(--color-text);
        }

        /* Variant: Danger */
        .btn--danger {
          background: var(--color-danger);
          color: white;
          border-color: var(--color-danger);
        }

        .btn--danger:not(:disabled):hover {
          background: #dc2626;
          border-color: #dc2626;
        }

        .btn--danger:focus-visible {
          box-shadow: 0 0 0 3px var(--color-danger-soft);
        }

        /* Full Width */
        .btn--full-width {
          width: 100%;
        }

        /* Loading State */
        .btn--loading .btn__content {
          opacity: 0;
        }

        .btn__spinner {
          position: absolute;
        }

        .btn__spinner-icon {
          width: 1.25em;
          height: 1.25em;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .btn__content {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
      `}</style>
    </button>
  );
}

