"use client";

import Link from "next/link";
import type { BlogPostDetail } from "../../lib/api/client";
import { Section } from "../../design-system/primitives/Section";
import { Card } from "../../design-system/primitives/Card";

type BlogPostClientProps = {
  post: BlogPostDetail;
  children: React.ReactNode;
};

/**
 * Blog Post Detail – Einzelner Blogbeitrag
 */
export function BlogPostClient({ post, children }: BlogPostClientProps) {
  return (
    <Section maxWidth="md" padding="xl" className="blog-post">
      <article>
        {/* Back Link */}
        <Link href="/blog" className="back-link">
          ← Zurück zum Blog
        </Link>

        {/* Header */}
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            {post.published_at && (
              <time dateTime={post.published_at} className="post-date">
                {new Date(post.published_at).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
        </header>

        {/* Content */}
        <Card padding="lg" className="post-content">
          <div className="mdx-content">{children}</div>
        </Card>

        {/* Footer */}
        <footer className="post-footer">
          <Link href="/blog" className="back-link">
            ← Alle Artikel anzeigen
          </Link>
        </footer>
      </article>

      <style jsx>{`
        :global(.blog-post .back-link) {
          display: inline-block;
          color: var(--color-primary);
          text-decoration: none;
          font-size: var(--text-sm);
          margin-bottom: var(--space-lg);
          transition: color var(--transition-fast);
        }

        :global(.blog-post .back-link):hover {
          color: var(--color-primary-hover);
        }

        .post-header {
          margin-bottom: var(--space-xl);
        }

        .post-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
          line-height: var(--leading-tight);
        }

        .post-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-md);
        }

        .post-date {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        :global(.post-content) {
          margin-bottom: var(--space-xl);
        }

        .post-footer {
          padding-top: var(--space-xl);
          border-top: 1px solid var(--color-border);
        }

        @media (max-width: 640px) {
          .post-title {
            font-size: var(--heading-h2);
          }
        }
      `}</style>
    </Section>
  );
}
