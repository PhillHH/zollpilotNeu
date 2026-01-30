"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Section } from "../../../design-system/primitives/Section";
import { Card } from "../../../design-system/primitives/Card";
import { Button } from "../../../design-system/primitives/Button";
import { Badge } from "../../../design-system/primitives/Badge";
import { adminContent, AdminBlogPostListItem, ApiError } from "../../../lib/api/client";

type StatusFilter = "all" | "DRAFT" | "PUBLISHED";

export function BlogListClient() {
  const router = useRouter();
  const [posts, setPosts] = useState<AdminBlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const response = await adminContent.blog.list(status);
      setPosts(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Fehler beim Laden der Blog-Artikel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [statusFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Artikel "${title}" wirklich löschen?`)) {
      return;
    }

    try {
      await adminContent.blog.delete(id);
      loadPosts();
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || "Fehler beim Löschen.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Section maxWidth="lg" padding="xl">
      {/* Header */}
      <header className="content-header">
        <div className="content-header-left">
          <h1 className="content-title">Blog-Artikel</h1>
          <p className="content-subtitle">
            Verwalten Sie Ihre Blog-Inhalte.
          </p>
        </div>
        <div className="content-header-right">
          <Button
            variant="primary"
            onClick={() => router.push("/admin/content/blog/new")}
          >
            Neuer Artikel
          </Button>
        </div>
      </header>

      {/* Filter */}
      <div className="content-filter">
        <button
          className={`filter-button ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          Alle
        </button>
        <button
          className={`filter-button ${statusFilter === "DRAFT" ? "active" : ""}`}
          onClick={() => setStatusFilter("DRAFT")}
        >
          Entwürfe
        </button>
        <button
          className={`filter-button ${statusFilter === "PUBLISHED" ? "active" : ""}`}
          onClick={() => setStatusFilter("PUBLISHED")}
        >
          Veröffentlicht
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Card padding="lg">
          <p className="loading-text">Lade Artikel...</p>
        </Card>
      ) : error ? (
        <Card padding="lg">
          <p className="error-text">{error}</p>
          <Button variant="secondary" onClick={loadPosts}>
            Erneut versuchen
          </Button>
        </Card>
      ) : posts.length === 0 ? (
        <Card padding="lg">
          <p className="empty-text">Keine Artikel gefunden.</p>
        </Card>
      ) : (
        <div className="content-list">
          {posts.map((post) => (
            <Card key={post.id} padding="md" className="content-item">
              <div className="content-item-main">
                <div className="content-item-info">
                  <h3 className="content-item-title">{post.title}</h3>
                  <p className="content-item-meta">
                    <span className="content-item-slug">/{post.slug}</span>
                    <span className="content-item-date">
                      Erstellt: {formatDate(post.created_at)}
                    </span>
                    {post.published_at && (
                      <span className="content-item-date">
                        Veröffentlicht: {formatDate(post.published_at)}
                      </span>
                    )}
                  </p>
                  <p className="content-item-excerpt">{post.excerpt}</p>
                </div>
                <div className="content-item-status">
                  <Badge
                    variant={post.status === "PUBLISHED" ? "success" : "warning"}
                  >
                    {post.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
                  </Badge>
                </div>
              </div>
              <div className="content-item-actions">
                <Link
                  href={`/admin/content/blog/${post.id}`}
                  className="action-link"
                >
                  Bearbeiten
                </Link>
                {post.status === "PUBLISHED" && (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="action-link"
                  >
                    Ansehen
                  </Link>
                )}
                <button
                  className="action-delete"
                  onClick={() => handleDelete(post.id, post.title)}
                >
                  Löschen
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <style jsx>{`
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-xl);
          gap: var(--space-lg);
          flex-wrap: wrap;
        }

        .content-header-left {
          flex: 1;
        }

        .content-title {
          font-size: var(--heading-h2);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .content-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        .content-filter {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
        }

        .filter-button {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-button:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .filter-button.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .content-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        :global(.content-item) {
          transition: border-color var(--transition-fast);
        }

        :global(.content-item:hover) {
          border-color: var(--color-primary-soft);
        }

        .content-item-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }

        .content-item-info {
          flex: 1;
        }

        .content-item-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .content-item-meta {
          display: flex;
          gap: var(--space-md);
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0 0 var(--space-sm) 0;
          flex-wrap: wrap;
        }

        .content-item-slug {
          font-family: monospace;
          background: var(--color-background);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        .content-item-excerpt {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
          line-height: var(--leading-relaxed);
        }

        .content-item-actions {
          display: flex;
          gap: var(--space-md);
          padding-top: var(--space-sm);
          border-top: 1px solid var(--color-border);
        }

        .action-link {
          font-size: var(--text-sm);
          color: var(--color-primary);
          text-decoration: none;
        }

        .action-link:hover {
          text-decoration: underline;
        }

        .action-delete {
          font-size: var(--text-sm);
          color: var(--color-error);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .action-delete:hover {
          text-decoration: underline;
        }

        .loading-text,
        .error-text,
        .empty-text {
          text-align: center;
          color: var(--color-text-muted);
          margin: 0;
        }

        .error-text {
          color: var(--color-error);
          margin-bottom: var(--space-md);
        }

        @media (max-width: 640px) {
          .content-header {
            flex-direction: column;
          }

          .content-item-main {
            flex-direction: column;
          }

          .content-item-meta {
            flex-direction: column;
            gap: var(--space-xs);
          }
        }
      `}</style>
    </Section>
  );
}
