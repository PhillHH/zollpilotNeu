"use client";

import React from "react";

type SectionProps = {
  /** Inhalt der Section */
  children: React.ReactNode;
  /** Maximale Breite: 'sm' | 'md' | 'lg' | 'xl' | 'full' */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  /** Vertikales Padding */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Zentriert den Inhalt horizontal */
  centered?: boolean;
  /** Zusätzliche CSS-Klassen */
  className?: string;
};

/**
 * Section – Container mit konsistentem Spacing und max-width
 * 
 * Verwendet für Content-Bereiche, um konsistente Breiten und
 * Abstände zu gewährleisten.
 */
export function Section({
  children,
  maxWidth = "lg",
  padding = "lg",
  centered = true,
  className = "",
}: SectionProps) {
  const widthClass = `section--${maxWidth}`;
  const paddingClass = `section--padding-${padding}`;
  const centeredClass = centered ? "section--centered" : "";

  return (
    <section className={`section ${widthClass} ${paddingClass} ${centeredClass} ${className}`}>
      {children}

      <style jsx>{`
        .section {
          width: 100%;
          padding-left: var(--space-md);
          padding-right: var(--space-md);
        }

        .section--centered {
          margin-left: auto;
          margin-right: auto;
        }

        /* Max Width Variants */
        .section--sm {
          max-width: var(--max-width-sm);
        }
        .section--md {
          max-width: var(--max-width-md);
        }
        .section--lg {
          max-width: var(--max-width-lg);
        }
        .section--xl {
          max-width: var(--max-width-xl);
        }
        .section--full {
          max-width: 100%;
        }

        /* Padding Variants */
        .section--padding-none {
          padding-top: 0;
          padding-bottom: 0;
        }
        .section--padding-sm {
          padding-top: var(--space-md);
          padding-bottom: var(--space-md);
        }
        .section--padding-md {
          padding-top: var(--space-lg);
          padding-bottom: var(--space-lg);
        }
        .section--padding-lg {
          padding-top: var(--space-xl);
          padding-bottom: var(--space-xl);
        }
        .section--padding-xl {
          padding-top: var(--space-3xl);
          padding-bottom: var(--space-3xl);
        }

        @media (min-width: 768px) {
          .section {
            padding-left: var(--space-lg);
            padding-right: var(--space-lg);
          }
        }
      `}</style>
    </section>
  );
}

