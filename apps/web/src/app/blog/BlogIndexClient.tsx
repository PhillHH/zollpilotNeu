"use client";

import Link from "next/link";
import type { BlogPostListItem } from "../lib/api/client";
import { Section } from "../design-system/primitives/Section";
import { Card } from "../design-system/primitives/Card";

type BlogIndexClientProps = {
  posts: BlogPostListItem[];
};

/**
 * Blog Index – Liste aller Blogbeiträge
 */
export function BlogIndexClient({ posts }: BlogIndexClientProps) {
  return (
    <Section maxWidth="lg" padding="xl" className="blog-index">
      {/* Header */}
      <header className="blog-header">
        <h1 className="blog-title">Blog</h1>
        <p className="blog-intro">
          Aktuelle Artikel und Anleitungen rund um Zoll, Import und Einfuhrumsatzsteuer.
        </p>
      </header>

      {/* Posts Grid */}
      <div className="posts-grid">
        {posts.length === 0 ? (
          <Card padding="lg" className="empty-state">
            <p className="empty-text">Noch keine Artikel vorhanden.</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="post-link"
            >
              <Card hoverable padding="lg" className="post-card">
                <article>
                  <h2 className="post-title">{post.title}</h2>
                  <p className="post-description">{post.excerpt}</p>
                  <div className="post-meta">
                    {post.published_at && (
                      <time
                        dateTime={post.published_at}
                        className="post-date"
                      >
                        {new Date(post.published_at).toLocaleDateString(
                          "de-DE",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </time>
                    )}
                  </div>
                </article>
              </Card>
            </Link>
          ))
        )}
      </div>

      <style jsx>{`
        .blog-header {
          text-align: center;
          margin-bottom: var(--space-2xl);
        }

        .blog-title {
          font-size: var(--heading-h1);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
        }

        .blog-intro {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
          max-width: 500px;
          margin: 0 auto;
        }

        .posts-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.post-link) {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        :global(.post-card) {
          transition: border-color var(--transition-fast),
                      box-shadow var(--transition-fast) !important;
        }

        :global(.post-card:hover) {
          border-color: var(--color-primary) !important;
        }

        .post-title {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-sm) 0;
          line-height: var(--leading-tight);
        }

        .post-description {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          line-height: var(--leading-relaxed);
          margin: 0 0 var(--space-md) 0;
        }

        .post-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-md);
        }

        .post-date {
          font-size: var(--text-sm);
          color: var(--color-text-light);
        }

        :global(.empty-state) {
          text-align: center;
        }

        .empty-text {
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 640px) {
          .blog-title {
            font-size: var(--heading-h2);
          }

          .post-title {
            font-size: var(--text-lg);
          }
        }
      `}</style>
    </Section>
  );
}
