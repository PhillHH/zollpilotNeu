"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Section } from "../../../design-system/primitives/Section";
import { Card } from "../../../design-system/primitives/Card";
import { Button } from "../../../design-system/primitives/Button";
import { Badge } from "../../../design-system/primitives/Badge";
import { adminContent, AdminFaqListItem, ApiError } from "../../../lib/api/client";

type StatusFilter = "all" | "DRAFT" | "PUBLISHED";

export function FaqListClient() {
  const router = useRouter();
  const [entries, setEntries] = useState<AdminFaqListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const category = categoryFilter === "all" ? undefined : categoryFilter;
      const response = await adminContent.faq.list(status, category);
      setEntries(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Fehler beim Laden der FAQ-Einträge.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminContent.faq.categories();
      setCategories(response.data);
    } catch {
      // Ignore error, categories are optional
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [statusFilter, categoryFilter]);

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`FAQ "${question}" wirklich löschen?`)) {
      return;
    }

    try {
      await adminContent.faq.delete(id);
      loadEntries();
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

  // Group entries by category
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<string, AdminFaqListItem[]>);

  return (
    <Section maxWidth="lg" padding="xl">
      {/* Header */}
      <header className="content-header">
        <div className="content-header-left">
          <h1 className="content-title">FAQ-Einträge</h1>
          <p className="content-subtitle">
            Verwalten Sie häufig gestellte Fragen.
          </p>
        </div>
        <div className="content-header-right">
          <Button
            variant="primary"
            onClick={() => router.push("/admin/content/faq/new")}
          >
            Neuer Eintrag
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="content-filters">
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <div className="filter-buttons">
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
        </div>

        {categories.length > 0 && (
          <div className="filter-group">
            <label className="filter-label">Kategorie:</label>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Alle Kategorien</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <Card padding="lg">
          <p className="loading-text">Lade FAQ-Einträge...</p>
        </Card>
      ) : error ? (
        <Card padding="lg">
          <p className="error-text">{error}</p>
          <Button variant="secondary" onClick={loadEntries}>
            Erneut versuchen
          </Button>
        </Card>
      ) : entries.length === 0 ? (
        <Card padding="lg">
          <p className="empty-text">Keine FAQ-Einträge gefunden.</p>
        </Card>
      ) : categoryFilter !== "all" ? (
        <div className="content-list">
          {entries.map((entry) => (
            <FaqEntryCard
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        Object.entries(groupedEntries).map(([category, categoryEntries]) => (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="content-list">
              {categoryEntries.map((entry) => (
                <FaqEntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        ))
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

        .content-filters {
          display: flex;
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .filter-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .filter-buttons {
          display: flex;
          gap: var(--space-xs);
        }

        .filter-button {
          padding: var(--space-xs) var(--space-sm);
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

        .filter-select {
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          font-size: var(--text-sm);
          cursor: pointer;
        }

        .category-section {
          margin-bottom: var(--space-xl);
        }

        .category-title {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--color-primary);
          margin: 0 0 var(--space-md) 0;
          padding-bottom: var(--space-sm);
          border-bottom: 2px solid var(--color-primary-soft);
        }

        .content-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
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

          .content-filters {
            flex-direction: column;
          }
        }
      `}</style>
    </Section>
  );
}

type FaqEntryCardProps = {
  entry: AdminFaqListItem;
  onDelete: (id: string, question: string) => void;
  formatDate: (dateStr: string) => string;
};

function FaqEntryCard({ entry, onDelete, formatDate }: FaqEntryCardProps) {
  return (
    <Card padding="md" className="content-item">
      <div className="content-item-main">
        <div className="content-item-info">
          <h3 className="content-item-title">{entry.question}</h3>
          <p className="content-item-meta">
            <span className="content-item-order">#{entry.order_index}</span>
            <span className="content-item-category">{entry.category}</span>
            <span className="content-item-date">
              Erstellt: {formatDate(entry.created_at)}
            </span>
          </p>
        </div>
        <div className="content-item-status">
          <Badge
            variant={entry.status === "PUBLISHED" ? "success" : "warning"}
          >
            {entry.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
          </Badge>
        </div>
      </div>
      <div className="content-item-actions">
        <Link
          href={`/admin/content/faq/${entry.id}`}
          className="action-link"
        >
          Bearbeiten
        </Link>
        <button
          className="action-delete"
          onClick={() => onDelete(entry.id, entry.question)}
        >
          Löschen
        </button>
      </div>

      <style jsx>{`
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
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .content-item-meta {
          display: flex;
          gap: var(--space-md);
          font-size: var(--text-sm);
          color: var(--color-text-light);
          margin: 0;
          flex-wrap: wrap;
        }

        .content-item-order {
          font-family: monospace;
          background: var(--color-background);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        .content-item-category {
          background: var(--color-primary-soft);
          color: var(--color-primary);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-weight: var(--font-medium);
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
      `}</style>
    </Card>
  );
}
