"use client";

import React from "react";

type PageShellProps = {
  /** Slot für den Header-Bereich */
  header?: React.ReactNode;
  /** Slot für den Footer-Bereich */
  footer?: React.ReactNode;
  /** Hauptinhalt der Seite */
  children: React.ReactNode;
  /** Zusätzliche CSS-Klassen */
  className?: string;
};

/**
 * PageShell – Grundgerüst für Seiten
 * 
 * Bietet eine konsistente Seitenstruktur mit Header/Footer Slots.
 * Verwendet Design-Tokens für Hintergrund und Spacing.
 */
export function PageShell({ header, footer, children, className = "" }: PageShellProps) {
  return (
    <div className={`page-shell ${className}`}>
      {header && <header className="page-shell__header">{header}</header>}
      <main className="page-shell__main">{children}</main>
      {footer && <footer className="page-shell__footer">{footer}</footer>}

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-bg);
        }

        .page-shell__header {
          position: sticky;
          top: 0;
          z-index: var(--z-sticky);
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .page-shell__main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .page-shell__footer {
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: var(--space-lg) var(--space-md);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
}

