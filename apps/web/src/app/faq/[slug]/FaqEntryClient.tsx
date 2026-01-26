"use client";

import Link from "next/link";
import type { ContentMeta } from "../../lib/content";
import { Section } from "../../design-system/primitives/Section";
import { Badge } from "../../design-system/primitives/Badge";
import { Card } from "../../design-system/primitives/Card";

type FaqEntryClientProps = {
  meta: ContentMeta;
  children: React.ReactNode;
};

/**
 * FAQ Entry Detail – Einzelner FAQ-Eintrag
 */
export function FaqEntryClient({ meta, children }: FaqEntryClientProps) {
  return (
    <Section maxWidth="md" padding="xl" className="faq-entry">
      <article>
        {/* Back Link */}
        <Link href="/faq" className="back-link">
          ← Zurück zu FAQ
        </Link>

        {/* Header */}
        <header className="entry-header">
          {meta.category && (
            <Badge variant="primary" size="sm" className="category-badge">
              {meta.category}
            </Badge>
          )}
          <h1 className="entry-title">{meta.title}</h1>
        </header>

        {/* Content */}
        <Card padding="lg" className="entry-content">
          <div className="mdx-content">{children}</div>
        </Card>

        {/* Footer */}
        <footer className="entry-footer">
          <Link href="/faq" className="back-link">
            ← Alle FAQ anzeigen
          </Link>
        </footer>
      </article>

      <style jsx>{`
        :global(.faq-entry .back-link) {
          display: inline-block;
          color: var(--color-primary);
          text-decoration: none;
          font-size: var(--text-sm);
          margin-bottom: var(--space-lg);
          transition: color var(--transition-fast);
        }

        :global(.faq-entry .back-link):hover {
          color: var(--color-primary-hover);
        }

        .entry-header {
          margin-bottom: var(--space-xl);
        }

        :global(.category-badge) {
          margin-bottom: var(--space-md);
        }

        .entry-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0;
          line-height: var(--leading-tight);
        }

        :global(.entry-content) {
          margin-bottom: var(--space-xl);
        }

        .entry-footer {
          padding-top: var(--space-xl);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 640px) {
          .entry-title {
            font-size: var(--heading-h2);
          }
        }
      `}</style>
    </Section>
  );
}
