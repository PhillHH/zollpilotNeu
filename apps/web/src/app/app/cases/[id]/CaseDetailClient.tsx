"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import {
  cases as casesApi,
  fields as fieldsApi,
  type CaseDetail
} from "../../../lib/api/client";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type CaseDetailClientProps = {
  caseId: string;
};

export function CaseDetailClient({ caseId }: CaseDetailClientProps) {
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  // Notes field
  const [notesValue, setNotesValue] = useState("");
  const [notesSaveStatus, setNotesSaveStatus] = useState<SaveStatus>("idle");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadCase = useCallback(async () => {
    try {
      const response = await casesApi.get(caseId);
      setCaseData(response.data);
      setTitleValue(response.data.title);

      const notesField = response.data.fields.find((f) => f.key === "notes");
      if (notesField && typeof notesField.value === "string") {
        setNotesValue(notesField.value);
      }
    } catch {
      setError("Failed to load case.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleTitleSave = async () => {
    if (!caseData || titleValue === caseData.title) {
      setIsEditingTitle(false);
      return;
    }

    setTitleSaving(true);
    try {
      const response = await casesApi.patch(caseId, { title: titleValue });
      setCaseData((prev) =>
        prev ? { ...prev, title: response.data.title } : null
      );
      setIsEditingTitle(false);
    } catch {
      setError("Failed to save title.");
    } finally {
      setTitleSaving(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleValue(caseData?.title ?? "");
      setIsEditingTitle(false);
    }
  };

  const handleArchive = async () => {
    if (!caseData || caseData.status === "ARCHIVED") return;

    try {
      await casesApi.archive(caseId);
      router.push("/app/cases");
    } catch {
      setError("Failed to archive case.");
    }
  };

  const saveNotes = useCallback(
    async (value: string) => {
      setNotesSaveStatus("saving");
      try {
        await fieldsApi.upsert(caseId, "notes", value);
        setNotesSaveStatus("saved");
        setTimeout(() => setNotesSaveStatus("idle"), 2000);
      } catch {
        setNotesSaveStatus("error");
      }
    },
    [caseId]
  );

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotesValue(value);
    setNotesSaveStatus("idle");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveNotes(value);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error && !caseData) {
    return <div className="error">{error}</div>;
  }

  if (!caseData) {
    return <div className="error">Case not found.</div>;
  }

  const isArchived = caseData.status === "ARCHIVED";

  return (
    <div className="case-detail">
      <div className="case-detail-header">
        <button
          type="button"
          onClick={() => router.push("/app/cases")}
          className="back-btn"
        >
          ← Back to Cases
        </button>
      </div>

      {error ? <p className="error-msg">{error}</p> : null}

      <div className="case-card">
        <div className="title-row">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              disabled={titleSaving}
              autoFocus
              className="title-input"
            />
          ) : (
            <h1
              onClick={() => !isArchived && setIsEditingTitle(true)}
              className={`title ${!isArchived ? "editable" : ""}`}
            >
              {caseData.title}
              {!isArchived && <span className="edit-hint">✎</span>}
            </h1>
          )}
        </div>

        <div className="meta-row">
          <span className={`status status-${caseData.status.toLowerCase()}`}>
            {caseData.status}
          </span>
          <span className="date">Created: {formatDate(caseData.created_at)}</span>
          <span className="date">Updated: {formatDate(caseData.updated_at)}</span>
        </div>

        {!isArchived && (
          <div className="action-buttons">
            <button
              type="button"
              onClick={() => router.push(`/app/cases/${caseId}/wizard`)}
              className="wizard-btn"
            >
              Wizard öffnen
            </button>
            <button
              type="button"
              onClick={handleArchive}
              className="archive-btn"
            >
              Archive Case
            </button>
          </div>
        )}
      </div>

      <div className="notes-section">
        <div className="notes-header">
          <h2>Notes</h2>
          <span className={`save-status save-status-${notesSaveStatus}`}>
            {notesSaveStatus === "saving" && "Saving..."}
            {notesSaveStatus === "saved" && "✓ Saved"}
            {notesSaveStatus === "error" && "⚠ Error saving"}
          </span>
        </div>
        <textarea
          value={notesValue}
          onChange={handleNotesChange}
          placeholder="Add notes here..."
          disabled={isArchived}
          className="notes-textarea"
          rows={8}
        />
      </div>

      <style jsx>{`
        .case-detail {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .case-detail-header {
          margin-bottom: 1.5rem;
        }
        .back-btn {
          background: transparent;
          border: none;
          color: #2563eb;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0;
        }
        .back-btn:hover {
          text-decoration: underline;
        }
        .error-msg {
          color: #dc2626;
          background: #fef2f2;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        .loading,
        .error {
          text-align: center;
          padding: 2rem;
        }
        .case-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .title-row {
          margin-bottom: 1rem;
        }
        .title {
          font-size: 1.5rem;
          margin: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        .title.editable {
          cursor: pointer;
        }
        .title.editable:hover {
          color: #2563eb;
        }
        .edit-hint {
          font-size: 0.9rem;
          opacity: 0.5;
        }
        .title-input {
          font-size: 1.5rem;
          font-weight: bold;
          border: 2px solid #2563eb;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          width: 100%;
          max-width: 400px;
        }
        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
          font-size: 0.85rem;
        }
        .status {
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          text-transform: uppercase;
          font-weight: 500;
        }
        .status-draft {
          background: #fef3c7;
          color: #92400e;
        }
        .status-submitted {
          background: #d1fae5;
          color: #065f46;
        }
        .status-archived {
          background: #e5e7eb;
          color: #374151;
        }
        .date {
          color: #6b7280;
        }
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }
        .wizard-btn {
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .wizard-btn:hover {
          background: #1d4ed8;
        }
        .archive-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .archive-btn:hover {
          background: #b91c1c;
        }
        .notes-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1.5rem;
        }
        .notes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .notes-header h2 {
          margin: 0;
          font-size: 1.1rem;
        }
        .save-status {
          font-size: 0.8rem;
        }
        .save-status-saving {
          color: #6b7280;
        }
        .save-status-saved {
          color: #059669;
        }
        .save-status-error {
          color: #dc2626;
        }
        .notes-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.75rem;
          font-size: 0.95rem;
          resize: vertical;
          font-family: inherit;
        }
        .notes-textarea:focus {
          outline: none;
          border-color: #2563eb;
        }
        .notes-textarea:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

