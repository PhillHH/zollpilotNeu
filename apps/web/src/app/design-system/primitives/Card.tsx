"use client";

import React from "react";

type CardProps = {
  /** Inhalt der Karte */
  children: React.ReactNode;
  /** Titel der Karte (optional) */
  title?: string;
  /** Beschreibung unter dem Titel (optional) */
  description?: string;
  /** Zusätzlicher Header-Content (rechts vom Titel) */
  headerAction?: React.ReactNode;
  /** Padding-Größe */
  padding?: "none" | "sm" | "md" | "lg";
  /** Hover-Effekt aktivieren */
  hoverable?: boolean;
  /** Als Button klickbar */
  onClick?: () => void;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Inline Styles */
  style?: React.CSSProperties;
};

/**
 * Card – Karten-Container für gruppierte Inhalte
 * 
 * Verwendet für: Übersichtskarten, Formulargruppen, Info-Panels
 */
export function Card({
  children,
  title,
  description,
  headerAction,
  padding = "md",
  hoverable = false,
  onClick,
  className = "",
  style,
}: CardProps) {
  const Tag = onClick ? "button" : "div";
  const paddingClass = `card--padding-${padding}`;
  const hoverClass = hoverable || onClick ? "card--hoverable" : "";
  const clickableClass = onClick ? "card--clickable" : "";

  return (
    <Tag
      className={`card ${paddingClass} ${hoverClass} ${clickableClass} ${className}`}
      style={style}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      {(title || headerAction) && (
        <div className="card__header">
          <div className="card__header-text">
            {title && <h3 className="card__title">{title}</h3>}
            {description && <p className="card__description">{description}</p>}
          </div>
          {headerAction && <div className="card__header-action">{headerAction}</div>}
        </div>
      )}
      <div className="card__content">{children}</div>

      <style jsx>{`
        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-soft);
          transition: box-shadow var(--transition-base),
                      border-color var(--transition-base),
                      transform var(--transition-fast);
        }

        .card--clickable {
          width: 100%;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }

        .card--hoverable:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-border-focus);
        }

        .card--hoverable:active {
          transform: scale(0.995);
        }

        /* Padding Variants */
        .card--padding-none .card__content {
          padding: 0;
        }
        .card--padding-none .card__header {
          padding: var(--space-md);
          padding-bottom: 0;
        }
        .card--padding-sm .card__header,
        .card--padding-sm .card__content {
          padding: var(--space-sm);
        }
        .card--padding-md .card__header,
        .card--padding-md .card__content {
          padding: var(--space-md);
        }
        .card--padding-lg .card__header,
        .card--padding-lg .card__content {
          padding: var(--space-lg);
        }

        .card__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-md);
          border-bottom: 1px solid var(--color-border-light);
        }

        .card--padding-none .card__header,
        .card--padding-sm .card__header,
        .card--padding-md .card__header,
        .card--padding-lg .card__header {
          padding-bottom: var(--space-md);
          margin-bottom: 0;
        }

        .card__header-text {
          flex: 1;
          min-width: 0;
        }

        .card__title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0;
          line-height: var(--leading-tight);
        }

        .card__description {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: var(--space-xs) 0 0 0;
          line-height: var(--leading-normal);
        }

        .card__header-action {
          flex-shrink: 0;
        }

        .card__content {
          color: var(--color-text);
        }
      `}</style>
    </Tag>
  );
}

