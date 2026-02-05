"use client";

import { useState } from "react";
import Link from "next/link";
import type { FaqCategory, FaqEntryItem } from "../lib/api/client";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";
import { SafeHtmlContent } from "../components/SafeHtmlContent";

type FaqIndexClientProps = {
  categories: FaqCategory[];
};

type FaqAccordionItemProps = {
  entry: FaqEntryItem;
};

/**
 * Single FAQ accordion item
 */
function FaqAccordionItem({ entry }: FaqAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="faq-accordion-item">
      <button
        className={`faq-question-button ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="faq-question-text">{entry.question}</span>
        <span className="faq-toggle-icon">{isOpen ? "−" : "+"}</span>
      </button>

      {isOpen && (
        <div className="faq-answer">
          <SafeHtmlContent html={entry.answer} className="faq-answer-content" />
          {entry.related_blog_slug && (
            <Link
              href={`/blog/${entry.related_blog_slug}`}
              className="faq-related-link"
            >
              Mehr erfahren →
            </Link>
          )}
        </div>
      )}

      <style jsx>{`
        .faq-accordion-item {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-surface);
        }

        .faq-question-button {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background-color var(--transition-fast);
        }

        .faq-question-button:hover {
          background: var(--color-background);
        }

        .faq-question-button.open {
          background: var(--color-background);
          border-bottom: 1px solid var(--color-border);
        }

        .faq-question-text {
          font-size: var(--text-lg);
          font-weight: var(--font-medium);
          color: var(--color-text);
          line-height: var(--leading-tight);
          padding-right: var(--space-md);
        }

        .faq-toggle-icon {
          font-size: var(--text-xl);
          font-weight: var(--font-light);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .faq-answer {
          padding: var(--space-lg);
          background: var(--color-background);
        }

        .faq-answer-content {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          white-space: pre-wrap;
        }

        .faq-related-link {
          display: inline-block;
          margin-top: var(--space-md);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-primary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .faq-related-link:hover {
          color: var(--color-primary-hover);
        }
      `}</style>
    </div>
  );
}

/**
 * FAQ Index – Häufig gestellte Fragen, nach Kategorien gruppiert
 * Answers are shown inline in accordion style (no individual pages).
 */
export function FaqIndexClient({ categories }: FaqIndexClientProps) {
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
            <section key={category.category} className="faq-category">
              <h2 className="category-title">{category.category}</h2>
              <div className="faq-list">
                {category.entries.map((entry) => (
                  <FaqAccordionItem key={entry.id} entry={entry} />
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
          gap: var(--space-sm);
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
