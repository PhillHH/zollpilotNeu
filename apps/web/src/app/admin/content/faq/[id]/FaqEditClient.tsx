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
  AdminFaqEntry,
  FaqCreatePayload,
  FaqUpdatePayload,
  AdminBlogPostListItem,
  ApiError,
} from "../../../../lib/api/client";
import { HtmlEditor } from "../../../../components/HtmlEditor";

type FaqEditClientProps = {
  entryId: string;
};

export function FaqEditClient({ entryId }: FaqEditClientProps) {
  const router = useRouter();
  const isNew = entryId === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Allgemein");
  const [orderIndex, setOrderIndex] = useState(0);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [relatedBlogPostId, setRelatedBlogPostId] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [blogPosts, setBlogPosts] = useState<AdminBlogPostListItem[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  useEffect(() => {
    loadCategories();
    loadBlogPosts();
    if (!isNew) {
      loadEntry();
    }
  }, [entryId, isNew]);

  const loadEntry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminContent.faq.get(entryId);
      const entry = response.data;
      setQuestion(entry.question);
      setAnswer(entry.answer);
      setCategory(entry.category);
      setOrderIndex(entry.order_index);
      setStatus(entry.status);
      setRelatedBlogPostId(entry.related_blog_post_id || "");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Fehler beim Laden des Eintrags.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminContent.faq.categories();
      setCategories(response.data);
    } catch {
      // Ignore error, use default
    }
  };

  const loadBlogPosts = async () => {
    try {
      const response = await adminContent.blog.list("PUBLISHED");
      setBlogPosts(response.data);
    } catch {
      // Ignore error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const finalCategory = showNewCategory && newCategory ? newCategory : category;

    try {
      if (isNew) {
        const payload: FaqCreatePayload = {
          question,
          answer,
          category: finalCategory,
          order_index: orderIndex,
          status,
          related_blog_post_id: relatedBlogPostId || undefined,
        };
        const response = await adminContent.faq.create(payload);
        setSuccess("FAQ-Eintrag erfolgreich erstellt.");
        router.push(`/admin/content/faq/${response.data.id}`);
      } else {
        const payload: FaqUpdatePayload = {
          question,
          answer,
          category: finalCategory,
          order_index: orderIndex,
          status,
          related_blog_post_id: relatedBlogPostId || undefined,
        };
        await adminContent.faq.update(entryId, payload);
        setSuccess("FAQ-Eintrag erfolgreich gespeichert.");
        // Refresh categories if new one was added
        if (showNewCategory && newCategory) {
          loadCategories();
          setShowNewCategory(false);
          setNewCategory("");
          setCategory(finalCategory);
        }
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
    setTimeout(() => {
      document.getElementById("faq-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  const handleUnpublish = async () => {
    setStatus("DRAFT");
    setTimeout(() => {
      document.getElementById("faq-form")?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }, 0);
  };

  if (loading) {
    return (
      <Section maxWidth="lg" padding="xl">
        <Card padding="lg">
          <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
            Lade FAQ-Eintrag...
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
          <Link href="/admin/content/faq" className="back-link">
            ← Zurück zur Liste
          </Link>
          <h1 className="edit-title">
            {isNew ? "Neuer FAQ-Eintrag" : "FAQ-Eintrag bearbeiten"}
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

      <form id="faq-form" onSubmit={handleSubmit}>
        <Card padding="lg" className="edit-card">
          <div className="form-section">
            <h2 className="section-title">Inhalt</h2>

            <div className="form-group">
              <label htmlFor="question" className="form-label">
                Frage *
              </label>
              <input
                id="question"
                type="text"
                className="form-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                maxLength={500}
                placeholder="z.B. Was ist ZollPilot?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="answer" className="form-label">
                Antwort *
              </label>
              <HtmlEditor
                value={answer}
                onChange={setAnswer}
                height={300}
                placeholder="Schreibe hier die Antwort..."
              />
              <p className="form-hint">WYSIWYG-Editor mit Bild- und Video-Unterstützung</p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="edit-card">
          <div className="form-section">
            <h2 className="section-title">Einordnung</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Kategorie
                </label>
                {!showNewCategory ? (
                  <div className="category-select-wrapper">
                    <select
                      id="category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.length === 0 && (
                        <option value="Allgemein">Allgemein</option>
                      )}
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="new-category-button"
                      onClick={() => setShowNewCategory(true)}
                    >
                      + Neue
                    </button>
                  </div>
                ) : (
                  <div className="category-select-wrapper">
                    <input
                      id="newCategory"
                      type="text"
                      className="form-input"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Neue Kategorie"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      className="new-category-button"
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategory("");
                      }}
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="orderIndex" className="form-label">
                  Reihenfolge
                </label>
                <input
                  id="orderIndex"
                  type="number"
                  className="form-input order-input"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                  min={0}
                />
                <p className="form-hint">Niedrigere Werte erscheinen zuerst</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="relatedBlogPost" className="form-label">
                Verwandter Blog-Artikel (optional)
              </label>
              <select
                id="relatedBlogPost"
                className="form-select"
                value={relatedBlogPostId}
                onChange={(e) => setRelatedBlogPostId(e.target.value)}
              >
                <option value="">Keiner</option>
                {blogPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <p className="form-hint">Zeigt &quot;Mehr erfahren&quot; Link</p>
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

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--space-lg);
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
        .form-textarea,
        .form-select {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-family: inherit;
          width: 100%;
          transition: border-color var(--transition-fast);
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
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

        .order-input {
          width: 100px;
        }

        .category-select-wrapper {
          display: flex;
          gap: var(--space-sm);
        }

        .new-category-button {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          font-size: var(--text-sm);
          cursor: pointer;
          white-space: nowrap;
        }

        .new-category-button:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
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
          .form-row {
            grid-template-columns: 1fr;
          }

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
