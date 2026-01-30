"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Section } from "../../../../design-system/primitives/Section";
import { Card } from "../../../../design-system/primitives/Card";
import { Button } from "../../../../design-system/primitives/Button";
import { Alert } from "../../../../design-system/primitives/Alert";
import {
  adminContent,
  AdminBlogPost,
  BlogPostCreatePayload,
  BlogPostUpdatePayload,
  ApiError,
} from "../../../../lib/api/client";

type BlogEditClientProps = {
  postId: string;
};

export function BlogEditClient({ postId }: BlogEditClientProps) {
  const router = useRouter();
  const isNew = postId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    if (!isNew) {
      loadPost();
    }
  }, [postId, isNew]);

  const loadPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminContent.blog.get(postId);
      const post = response.data;
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setStatus(post.status);
      setMetaTitle(post.meta_title || "");
      setMetaDescription(post.meta_description || "");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Fehler beim Laden des Artikels.");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isNew && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isNew) {
        const payload: BlogPostCreatePayload = {
          title,
          slug,
          excerpt,
          content,
          status,
          meta_title: metaTitle || undefined,
          meta_description: metaDescription || undefined,
        };
        const response = await adminContent.blog.create(payload);
        setSuccess("Artikel erfolgreich erstellt.");
        router.push(`/admin/content/blog/${response.data.id}`);
      } else {
        const payload: BlogPostUpdatePayload = {
          title,
          slug,
          excerpt,
          content,
          status,
          meta_title: metaTitle || undefined,
          meta_description: metaDescription || undefined,
        };
        await adminContent.blog.update(postId, payload);
        setSuccess("Artikel erfolgreich gespeichert.");
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setStatus("PUBLISHED");
    // Trigger form submit after state update
    setTimeout(() => {
      document.getElementById("blog-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  const handleUnpublish = async () => {
    setStatus("DRAFT");
    setTimeout(() => {
      document.getElementById("blog-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  if (loading) {
    return (
      <Section maxWidth="lg" padding="xl">
        <Card padding="lg">
          <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            Lade Artikel...
          </p>
        </Card>
      </Section>
    );
  }

  return (
    <Section maxWidth="lg" padding="xl">
      {/* Header */}
      <header className="edit-header">
        <div className="edit-header-left">
          <Link href="/admin/content/blog" className="back-link">
            ← Zurück zur Liste
          </Link>
          <h1 className="edit-title">
            {isNew ? "Neuer Artikel" : "Artikel bearbeiten"}
          </h1>
        </div>
      </header>

      {error && (
        <Alert variant="error" className="edit-alert">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="edit-alert">
          {success}
        </Alert>
      )}

      <form id="blog-form" onSubmit={handleSubmit}>
        <Card padding="lg" className="edit-card">
          <div className="form-section">
            <h2 className="section-title">Inhalt</h2>

            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Titel *
              </label>
              <input
                id="title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug" className="form-label">
                Slug *
              </label>
              <div className="slug-input-wrapper">
                <span className="slug-prefix">/blog/</span>
                <input
                  id="slug"
                  type="text"
                  className="form-input slug-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="[a-z0-9-]+"
                  maxLength={100}
                />
              </div>
              <p className="form-hint">Nur Kleinbuchstaben, Zahlen und Bindestriche</p>
            </div>

            <div className="form-group">
              <label htmlFor="excerpt" className="form-label">
                Kurzbeschreibung *
              </label>
              <textarea
                id="excerpt"
                className="form-textarea"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                required
                maxLength={500}
                rows={3}
              />
              <p className="form-hint">{excerpt.length}/500 Zeichen</p>
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">
                Inhalt (MDX) *
              </label>
              <textarea
                id="content"
                className="form-textarea content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={20}
              />
              <p className="form-hint">Markdown mit MDX-Unterstützung</p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="edit-card">
          <div className="form-section">
            <h2 className="section-title">SEO</h2>

            <div className="form-group">
              <label htmlFor="metaTitle" className="form-label">
                Meta-Titel
              </label>
              <input
                id="metaTitle"
                type="text"
                className="form-input"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={70}
                placeholder={title}
              />
              <p className="form-hint">Überschreibt den Titel in Suchmaschinen ({metaTitle.length}/70)</p>
            </div>

            <div className="form-group">
              <label htmlFor="metaDescription" className="form-label">
                Meta-Beschreibung
              </label>
              <textarea
                id="metaDescription"
                className="form-textarea"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder={excerpt}
              />
              <p className="form-hint">Beschreibung für Suchmaschinen ({metaDescription.length}/160)</p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="edit-card">
          <div className="form-section">
            <h2 className="section-title">Veröffentlichung</h2>

            <div className="status-section">
              <p className="status-label">
                Aktueller Status:{" "}
                <strong className={status === "PUBLISHED" ? "status-published" : "status-draft"}>
                  {status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
                </strong>
              </p>

              <div className="action-buttons">
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={saving}
                >
                  {saving ? "Speichert..." : "Speichern"}
                </Button>

                {status === "DRAFT" ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handlePublish}
                    disabled={saving}
                  >
                    Veröffentlichen
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleUnpublish}
                    disabled={saving}
                  >
                    Zurückziehen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </form>

      <style jsx>{`
        .edit-header {
          margin-bottom: var(--space-xl);
        }

        .back-link {
          font-size: var(--text-sm);
          color: var(--color-primary);
          text-decoration: none;
          display: inline-block;
          margin-bottom: var(--space-sm);
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .edit-title {
          font-size: var(--heading-h2);
          color: var(--color-text);
          margin: 0;
        }

        :global(.edit-alert) {
          margin-bottom: var(--space-lg);
        }

        :global(.edit-card) {
          margin-bottom: var(--space-lg);
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .section-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0;
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .form-label {
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          color: var(--color-text);
        }

        .form-input,
        .form-textarea {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-family: inherit;
          width: 100%;
          transition: border-color var(--transition-fast);
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .content-textarea {
          font-family: monospace;
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
        }

        .form-hint {
          font-size: var(--text-xs);
          color: var(--color-text-light);
          margin: 0;
        }

        .slug-input-wrapper {
          display: flex;
          align-items: center;
        }

        .slug-prefix {
          padding: var(--space-sm) var(--space-md);
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-right: none;
          border-radius: var(--radius-md) 0 0 var(--radius-md);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .slug-input {
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }

        .status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-lg);
          flex-wrap: wrap;
        }

        .status-label {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        .status-published {
          color: var(--color-success);
        }

        .status-draft {
          color: var(--color-warning);
        }

        .action-buttons {
          display: flex;
          gap: var(--space-md);
        }

        @media (max-width: 640px) {
          .status-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .action-buttons {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>
    </Section>
  );
}
