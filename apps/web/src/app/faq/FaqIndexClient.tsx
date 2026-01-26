"use client";

import Link from "next/link";
import type { ContentListItem } from "../lib/content";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";

type FaqIndexClientProps = {
  faqByCategory: Record<string, ContentListItem[]>;
};

/**
 * FAQ Index – Häufig gestellte Fragen, nach Kategorien gruppiert
 */
export function FaqIndexClient({ faqByCategory }: FaqIndexClientProps) {
  const categories = Object.keys(faqByCategory);

  return (
    <Section maxWidth="lg" padding="xl" className="faq-index">
      {/* Header */}
      <header className="faq-header">
        <h1 className="faq-title">Häufig gestellte Fragen</h1>
        <p className="faq-intro">
          Hier finden Sie Antworten auf die wichtigsten Fragen rund um Zoll,
          Import und ZollPilot.
        </p>
      </header>

      {/* Categories */}
      {categories.length === 0 ? (
        <Card padding="lg" className="empty-state">
          <p className="empty-text">Noch keine FAQ-Einträge vorhanden.</p>
        </Card>
      ) : (
        <div className="faq-categories">
          {categories.map((category) => (
            <section key={category} className="faq-category">
              <h2 className="category-title">{category}</h2>
              <div className="faq-list">
                {faqByCategory[category].map((entry) => (
                  <Link
                    key={entry.meta.slug}
                    href={`/faq/${entry.meta.slug}`}
                    className="faq-link"
                  >
                    <Card hoverable padding="md" className="faq-card">
                      <div className="faq-item">
                        <h3 className="faq-question">{entry.meta.title}</h3>
                        <p className="faq-preview">{entry.meta.description}</p>
                        <span className="faq-more">Antwort lesen →</span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <style jsx>{`
        .faq-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .faq-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .faq-intro {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
          max-width: 500px;
          margin: 0 auto;
        }

        .faq-categories {
          display: flex;
          flex-direction: column;
          gap: var(--space-2xl);
        }

        .category-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-primary);
          margin: 0 0 var(--space-md) 0;
          padding-bottom: var(--space-sm);
          border-bottom: 2px solid var(--color-primary-soft);
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.faq-link) {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        :global(.faq-card) {
          transition: border-color var(--transition-fast),
                      transform var(--transition-fast) !important;
        }

        :global(.faq-card:hover) {
          border-color: var(--color-primary) !important;
          transform: translateX(4px);
        }

        .faq-question {
          font-size: var(--text-lg);
          font-weight: var(--font-medium);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
          line-height: var(--leading-tight);
        }

        .faq-preview {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 var(--space-sm) 0;
          line-height: var(--leading-relaxed);
        }

        .faq-more {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-primary);
        }

        :global(.empty-state) {
          text-align: center;
        }

        .empty-text {
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 640px) {
          .faq-title {
            font-size: var(--heading-h2);
          }
        }
      `}</style>
    </Section>
  );
}
