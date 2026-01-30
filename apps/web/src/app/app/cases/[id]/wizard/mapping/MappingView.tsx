"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card } from "../../../../../design-system/primitives/Card";
import { Button } from "../../../../../design-system/primitives/Button";
import { Alert } from "../../../../../design-system/primitives/Alert";
import {
  getMappingConfig,
  type FieldMapping,
  type ProcedureMappingConfig,
} from "./MappingConfig";
import { COUNTRIES } from "../constants";

type MappingViewProps = {
  procedureCode: string;
  procedureVersion: string;
  fieldValues: Record<string, unknown>;
  onClose: () => void;
  onConfirm?: () => void;
};

// Helper: Format value for display
const formatDisplayValue = (
  value: unknown,
  fieldKey: string
): string => {
  if (value === null || value === undefined || value === "") return "–";

  // Boolean
  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }

  // Country code → name
  if (fieldKey.includes("country")) {
    const country = COUNTRIES.find((c) => c.code === value);
    return country ? country.name : String(value);
  }

  // Currency formatting for amounts
  if (fieldKey === "value_amount") {
    const num = Number(value);
    if (!isNaN(num)) {
      return num.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }

  return String(value);
};

// Helper: Get raw value for clipboard
const getRawValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  return String(value);
};

type MappingRowProps = {
  mapping: FieldMapping;
  value: unknown;
  onCopy: (value: string, fieldKey: string) => void;
  copiedField: string | null;
};

function MappingRow({ mapping, value, onCopy, copiedField }: MappingRowProps) {
  const displayValue = formatDisplayValue(value, mapping.fieldKey);
  const rawValue = getRawValue(value);
  const isCopied = copiedField === mapping.fieldKey;
  const hasValue = value !== null && value !== undefined && value !== "";
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="mapping-row">
      {/* Left column: Your input */}
      <div className="mapping-col mapping-col-left">
        <div className="mapping-label">{mapping.label}</div>
        <div className="mapping-value">
          {hasValue ? (
            <span className="value-text">{displayValue}</span>
          ) : (
            <span className="value-empty">Keine Angabe</span>
          )}
        </div>
        {hasValue && (
          <button
            type="button"
            className={`copy-btn ${isCopied ? "copied" : ""}`}
            onClick={() => onCopy(rawValue, mapping.fieldKey)}
            title="Wert in die Zwischenablage kopieren"
          >
            {isCopied ? "Kopiert!" : "Kopieren"}
          </button>
        )}
      </div>

      {/* Right column: Target in customs form */}
      <div className="mapping-col mapping-col-right">
        <div className="target-form">{mapping.targetForm}</div>
        <div className="target-field">{mapping.targetField}</div>
        {mapping.hint && (
          <button
            type="button"
            className="hint-toggle"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? "Weniger anzeigen" : "Warum fragt der Zoll das?"}
          </button>
        )}
        {showHint && mapping.hint && (
          <div className="hint-text">{mapping.hint}</div>
        )}
      </div>

      <style jsx>{`
        .mapping-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          padding: var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-background);
        }

        .mapping-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .mapping-col-left {
          padding-right: var(--space-md);
          border-right: 1px solid var(--color-border);
        }

        .mapping-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          font-weight: var(--font-medium);
        }

        .mapping-value {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          font-family: var(--font-mono, monospace);
        }

        .value-text {
          color: var(--color-text);
        }

        .value-empty {
          color: var(--color-text-muted);
          font-style: italic;
          font-weight: normal;
        }

        .copy-btn {
          align-self: flex-start;
          margin-top: var(--space-xs);
          padding: 4px 12px;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-sm);
          background: transparent;
          color: var(--color-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .copy-btn:hover {
          background: var(--color-primary-soft);
        }

        .copy-btn.copied {
          background: var(--color-success-soft);
          border-color: var(--color-success);
          color: var(--color-success);
        }

        .target-form {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .target-field {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: var(--color-text);
        }

        .hint-toggle {
          align-self: flex-start;
          margin-top: var(--space-xs);
          padding: 0;
          font-size: var(--text-sm);
          color: var(--color-primary);
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
        }

        .hint-toggle:hover {
          color: var(--color-primary-dark);
        }

        .hint-text {
          margin-top: var(--space-xs);
          padding: var(--space-sm);
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          background: var(--color-background-subtle);
          border-radius: var(--radius-sm);
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .mapping-row {
            grid-template-columns: 1fr;
            gap: var(--space-md);
          }

          .mapping-col-left {
            padding-right: 0;
            padding-bottom: var(--space-md);
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
        }
      `}</style>
    </div>
  );
}

export function MappingView({
  procedureCode,
  procedureVersion,
  fieldValues,
  onClose,
  onConfirm,
}: MappingViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get mapping configuration
  const mappingConfig = useMemo(
    () => getMappingConfig(procedureCode, procedureVersion),
    [procedureCode, procedureVersion]
  );

  // Handle copy to clipboard
  const handleCopy = useCallback((value: string, fieldKey: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // Group mappings by targetForm for better organization
  const groupedMappings = useMemo(() => {
    if (!mappingConfig) return [];

    const groups: { form: string; mappings: FieldMapping[] }[] = [];

    for (const mapping of mappingConfig.mappings) {
      const existingGroup = groups.find((g) => g.form === mapping.targetForm);
      if (existingGroup) {
        existingGroup.mappings.push(mapping);
      } else {
        groups.push({ form: mapping.targetForm, mappings: [mapping] });
      }
    }

    return groups;
  }, [mappingConfig]);

  // Count fields with values
  const filledCount = useMemo(() => {
    if (!mappingConfig) return 0;
    return mappingConfig.mappings.filter((m) => {
      const v = fieldValues[m.fieldKey];
      return v !== null && v !== undefined && v !== "";
    }).length;
  }, [mappingConfig, fieldValues]);

  if (!mappingConfig) {
    return (
      <div className="mapping-view-container">
        <Alert variant="warning">
          Für dieses Verfahren ist noch keine Mapping-Konfiguration verfügbar.
        </Alert>
        <div className="mapping-actions">
          <Button variant="secondary" onClick={onClose}>
            Schließen
          </Button>
        </div>

        <style jsx>{`
          .mapping-view-container {
            padding: var(--space-lg);
          }
          .mapping-actions {
            margin-top: var(--space-lg);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mapping-view-container">
      {/* Header */}
      <div className="mapping-header">
        <h2 className="mapping-title">Wo trage ich das beim Zoll ein?</h2>
        <p className="mapping-subtitle">
          Diesen Wert kopierst du in das entsprechende Feld im Zollformular.
        </p>
      </div>

      {/* Info Alert */}
      <Alert variant="info" title="Hinweis">
        ZollPilot bereitet Ihre Daten vor. Die eigentliche Zollanmeldung nehmen
        Sie anschließend selbst im Online-Zollportal vor. Diese Übersicht zeigt
        Ihnen, wo Sie welche Angaben eintragen.
      </Alert>

      {/* Stats */}
      <div className="mapping-stats">
        <span className="stats-label">Ausgefüllte Felder:</span>
        <span className="stats-value">
          {filledCount} von {mappingConfig.mappings.length}
        </span>
      </div>

      {/* Column Headers */}
      <div className="column-headers">
        <div className="column-header">Deine Angaben</div>
        <div className="column-header">Zollformular – Eintrag</div>
      </div>

      {/* Grouped Mappings */}
      <div className="mapping-groups">
        {groupedMappings.map((group) => (
          <Card key={group.form} padding="md" className="mapping-group-card">
            <h3 className="group-title">{group.form}</h3>
            <div className="mapping-list">
              {group.mappings.map((mapping) => (
                <MappingRow
                  key={mapping.fieldKey}
                  mapping={mapping}
                  value={fieldValues[mapping.fieldKey]}
                  onCopy={handleCopy}
                  copiedField={copiedField}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="mapping-footer">
        <Button variant="secondary" onClick={onClose}>
          Zurück zum Formular
        </Button>
        {onConfirm && (
          <Button variant="primary" onClick={onConfirm}>
            Verstanden, bereit
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mapping-disclaimer">
        ZollPilot übermittelt keine Daten an Zollbehörden und führt keine
        Zollanmeldungen durch.
      </div>

      <style jsx>{`
        .mapping-view-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .mapping-header {
          text-align: center;
          padding-bottom: var(--space-md);
          border-bottom: 1px solid var(--color-border);
        }

        .mapping-title {
          font-size: var(--heading-h2);
          color: var(--color-text);
          margin: 0 0 var(--space-xs) 0;
        }

        .mapping-subtitle {
          font-size: var(--text-base);
          color: var(--color-text-muted);
          margin: 0;
        }

        .mapping-stats {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: var(--color-background-subtle);
          border-radius: var(--radius-md);
        }

        .stats-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
        }

        .stats-value {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text);
        }

        .column-headers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-lg);
          padding: 0 var(--space-md);
        }

        .column-header {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mapping-groups {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        :global(.mapping-group-card) {
          background: var(--color-background-subtle);
        }

        .group-title {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: var(--color-text);
          margin: 0 0 var(--space-md) 0;
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .mapping-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .mapping-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--space-lg);
          border-top: 1px solid var(--color-border);
        }

        .mapping-disclaimer {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--space-md);
          background: var(--color-background-subtle);
          border-radius: var(--radius-sm);
        }

        @media (max-width: 768px) {
          .column-headers {
            display: none;
          }

          .mapping-footer {
            flex-direction: column;
            gap: var(--space-md);
          }

          .mapping-footer :global(button) {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
