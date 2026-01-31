"use client";

import { useState, useRef, useCallback } from "react";

import { Card } from "../../../../design-system/primitives/Card";
import { Button } from "../../../../design-system/primitives/Button";
import { Alert } from "../../../../design-system/primitives/Alert";
import { Badge } from "../../../../design-system/primitives/Badge";

import {
  prefill,
  type FieldSuggestion,
  type ItemSuggestion,
  type PrefillSuggestions,
  type ApiError,
} from "../../../../lib/api/client";

type InvoicePrefillProps = {
  onApplySuggestion: (fieldKey: string, value: unknown) => void;
  onClose: () => void;
  existingValues: Record<string, unknown>;
};

type SuggestionState = {
  [fieldKey: string]: boolean; // true = accepted
};

/**
 * Invoice Prefill Component
 *
 * Allows users to upload an invoice/receipt and receive field suggestions.
 * Key principles:
 * - NEVER auto-fill – user must confirm each field
 * - Clear confidence indicators
 * - Prominent disclaimer
 */
export function InvoicePrefill({
  onApplySuggestion,
  onClose,
  existingValues,
}: InvoicePrefillProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PrefillSuggestions | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<SuggestionState>({});

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);
    setSuggestions(null);
    setAcceptedFields({});

    try {
      const result = await prefill.upload(file);
      setSuggestions(result);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Fehler beim Verarbeiten der Datei.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const toggleAccept = useCallback((fieldKey: string) => {
    setAcceptedFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  }, []);

  const applySelectedSuggestions = useCallback(() => {
    if (!suggestions) return;

    for (const suggestion of suggestions.suggestions) {
      if (acceptedFields[suggestion.field_key]) {
        onApplySuggestion(suggestion.field_key, suggestion.value);
      }
    }

    onClose();
  }, [suggestions, acceptedFields, onApplySuggestion, onClose]);

  const getConfidenceLabel = (confidence: number): { text: string; variant: "success" | "warning" | "danger" } => {
    if (confidence >= 0.8) return { text: "Hoch", variant: "success" };
    if (confidence >= 0.5) return { text: "Mittel", variant: "warning" };
    return { text: "Niedrig", variant: "danger" };
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === "number") {
      return value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  };

  const hasExistingValue = (fieldKey: string): boolean => {
    const val = existingValues[fieldKey];
    return val !== undefined && val !== null && val !== "";
  };

  const acceptedCount = Object.values(acceptedFields).filter(Boolean).length;

  return (
    <div className="prefill-container">
      <header className="prefill-header">
        <h3>Vorschläge aus Rechnung</h3>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      </header>

      {/* Important Disclaimer */}
      <Alert variant="warning" title="Bitte prüfen">
        ZollPilot entscheidet nicht. Alle Vorschläge müssen von Ihnen geprüft und bestätigt werden.
        Die Extraktion ist heuristisch und kann fehlerhaft sein.
      </Alert>

      {/* Upload Area */}
      {!suggestions && (
        <div
          className="upload-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleInputChange}
            hidden
          />

          {isUploading ? (
            <div className="upload-loading">
              <span className="spinner" />
              <p>Wird verarbeitet...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📄</div>
              <p className="upload-title">Rechnung oder Bestellbestätigung hochladen</p>
              <p className="upload-hint">
                PDF, JPG oder PNG (max. 10 MB)<br />
                Klicken oder Datei hierher ziehen
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions && (
        <div className="suggestions-section">
          {/* Warnings */}
          {suggestions.warnings.length > 0 && (
            <div className="warnings">
              {suggestions.warnings.map((warning, idx) => (
                <Alert key={idx} variant="info">
                  {warning}
                </Alert>
              ))}
            </div>
          )}

          {/* No suggestions found */}
          {suggestions.suggestions.length === 0 && suggestions.items.length === 0 && (
            <div className="no-suggestions">
              <p>Keine Vorschläge gefunden.</p>
              <p className="hint">
                Das Dokument enthält möglicherweise keinen extrahierbaren Text
                oder das Format wird nicht unterstützt.
              </p>
              <Button variant="secondary" onClick={() => setSuggestions(null)}>
                Andere Datei hochladen
              </Button>
            </div>
          )}

          {/* Field Suggestions */}
          {suggestions.suggestions.length > 0 && (
            <Card padding="md" className="suggestions-card">
              <h4>Erkannte Felder</h4>
              <p className="hint">
                Wählen Sie die Felder aus, die Sie übernehmen möchten.
              </p>

              <div className="suggestions-list">
                {suggestions.suggestions.map((suggestion) => {
                  const { text: confLabel, variant } = getConfidenceLabel(suggestion.confidence);
                  const isAccepted = acceptedFields[suggestion.field_key] || false;
                  const hasExisting = hasExistingValue(suggestion.field_key);

                  return (
                    <label
                      key={suggestion.field_key}
                      className={`suggestion-item ${isAccepted ? "accepted" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isAccepted}
                        onChange={() => toggleAccept(suggestion.field_key)}
                      />
                      <div className="suggestion-content">
                        <div className="suggestion-header">
                          <span className="label">{suggestion.display_label}</span>
                          <Badge variant={variant}>
                            {confLabel}
                          </Badge>
                        </div>
                        <div className="suggestion-value">
                          {formatValue(suggestion.value)}
                        </div>
                        {hasExisting && (
                          <div className="existing-warning">
                            ⚠ Feld bereits ausgefüllt – wird überschrieben
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Item Suggestions (Positionen) */}
          {suggestions.items.length > 0 && (
            <Card padding="md" className="items-card">
              <h4>Erkannte Positionen</h4>
              <p className="hint">
                Diese Positionen wurden in der Rechnung gefunden.
                Die Übernahme erfolgt manuell.
              </p>

              <div className="items-list">
                {suggestions.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">
                      {item.price !== null
                        ? `${item.price.toLocaleString("de-DE", { minimumFractionDigits: 2 })} ${item.currency || ""}`
                        : "–"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="prefill-actions">
            <Button variant="secondary" onClick={() => setSuggestions(null)}>
              Andere Datei
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Abbrechen
            </Button>
            {suggestions.suggestions.length > 0 && (
              <Button
                variant="primary"
                onClick={applySelectedSuggestions}
                disabled={acceptedCount === 0}
              >
                {acceptedCount > 0
                  ? `${acceptedCount} Feld${acceptedCount > 1 ? "er" : ""} übernehmen`
                  : "Felder auswählen"}
              </Button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .prefill-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .prefill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .prefill-header h3 {
          margin: 0;
          font-size: var(--heading-h3);
        }

        .close-btn {
          background: none;
          border: none;
          font-size: var(--text-lg);
          cursor: pointer;
          color: var(--color-text-muted);
          padding: var(--space-xs);
        }

        .close-btn:hover {
          color: var(--color-text);
        }

        .upload-area {
          border: 2px dashed var(--color-border);
          border-radius: var(--radius-md);
          padding: var(--space-xl);
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .upload-area:hover,
        .upload-area:focus {
          border-color: var(--color-primary);
          background-color: var(--color-surface);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: var(--space-md);
        }

        .upload-title {
          font-weight: 600;
          margin: 0 0 var(--space-xs) 0;
        }

        .upload-hint {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          margin: 0;
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-sm);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .suggestions-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .warnings {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .no-suggestions {
          text-align: center;
          padding: var(--space-lg);
        }

        .no-suggestions p {
          margin: 0 0 var(--space-sm) 0;
        }

        .no-suggestions .hint {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          margin-bottom: var(--space-md);
        }

        :global(.suggestions-card),
        :global(.items-card) {
          margin-bottom: 0;
        }

        :global(.suggestions-card) h4,
        :global(.items-card) h4 {
          margin: 0 0 var(--space-xs) 0;
          font-size: var(--text-base);
        }

        .hint {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          margin: 0 0 var(--space-md) 0;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }

        .suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-sm);
          padding: var(--space-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .suggestion-item:hover {
          border-color: var(--color-primary);
        }

        .suggestion-item.accepted {
          border-color: var(--color-primary);
          background-color: rgba(var(--color-primary-rgb, 46, 125, 50), 0.05);
        }

        .suggestion-item input[type="checkbox"] {
          margin-top: 2px;
        }

        .suggestion-content {
          flex: 1;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-xs);
        }

        .suggestion-header .label {
          font-weight: 500;
          font-size: var(--text-sm);
        }

        .suggestion-value {
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          color: var(--color-text);
        }

        .existing-warning {
          font-size: var(--text-xs);
          color: var(--color-warning);
          margin-top: var(--space-xs);
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          padding: var(--space-xs) 0;
          border-bottom: 1px solid var(--color-border);
          font-size: var(--text-sm);
        }

        .item-row:last-child {
          border-bottom: none;
        }

        .item-name {
          flex: 1;
        }

        .item-price {
          font-family: var(--font-mono);
          color: var(--color-text-muted);
        }

        .prefill-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--color-border);
        }
      `}</style>
    </div>
  );
}
