"use client";

import React from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";
type BadgeStatus = "draft" | "submitted" | "archived";

type BadgeProps = {
  /** Badge-Inhalt (optional wenn status verwendet wird) */
  children?: React.ReactNode;
  /** Farbvariante */
  variant?: BadgeVariant;
  /** Vordefinierter Status (überschreibt variant und setzt Text) */
  status?: BadgeStatus;
  /** Größe */
  size?: "sm" | "md";
  /** Zusätzliche CSS-Klassen */
  className?: string;
};

/**
 * Badge – Status-Anzeige für Labels und Tags
 * 
 * Status-Mapping (Deutsch):
 * - draft → "Entwurf"
 * - submitted → "Eingereicht"
 * - archived → "Archiviert"
 */
export function Badge({
  children,
  variant = "default",
  status,
  size = "md",
  className = "",
}: BadgeProps) {
  // Status überschreibt Variant und setzt deutschen Text
  let effectiveVariant = variant;
  let displayText = children;

  if (status) {
    switch (status) {
      case "draft":
        effectiveVariant = "default";
        displayText = "Entwurf";
        break;
      case "submitted":
        effectiveVariant = "success";
        displayText = "Eingereicht";
        break;
      case "archived":
        effectiveVariant = "info";
        displayText = "Archiviert";
        break;
    }
  }

  const variantClass = `badge--${effectiveVariant}`;
  const sizeClass = `badge--${size}`;

  return (
    <span className={`badge ${variantClass} ${sizeClass} ${className}`}>
      {displayText}

      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-sans);
          font-weight: var(--font-medium);
          border-radius: var(--radius-full);
          white-space: nowrap;
        }

        /* Size Variants */
        .badge--sm {
          font-size: var(--text-xs);
          padding: 2px var(--space-sm);
        }

        .badge--md {
          font-size: var(--text-sm);
          padding: var(--space-xs) var(--space-md);
        }

        /* Color Variants */
        .badge--default {
          background: var(--color-status-draft-bg);
          color: var(--color-status-draft);
        }

        .badge--primary {
          background: var(--color-primary-soft);
          color: var(--color-primary);
        }

        .badge--success {
          background: var(--color-success-soft);
          color: var(--color-success);
        }

        .badge--warning {
          background: var(--color-warning-soft);
          color: var(--color-warning);
        }

        .badge--danger {
          background: var(--color-danger-soft);
          color: var(--color-danger);
        }

        .badge--info {
          background: var(--color-status-archived-bg);
          color: var(--color-status-archived);
        }
      `}</style>
    </span>
  );
}

