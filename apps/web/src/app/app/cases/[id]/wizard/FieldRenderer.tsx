"use client";

import { useId } from "react";
import type { ProcedureField } from "../../../../lib/api/client";
import { COUNTRIES, CURRENCIES } from "./constants";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type FieldRendererProps = {
  field: ProcedureField;
  value: unknown;
  onChange: (value: unknown) => void;
  saveStatus: SaveStatus;
  error: string | null;
  disabled?: boolean;
};

export function FieldRenderer({
  field,
  value,
  onChange,
  saveStatus,
  error,
  disabled = false,
}: FieldRendererProps) {
  const id = useId();
  const config = field.config ?? {};
  const label = config.title ?? config.label ?? field.field_key;
  const placeholder = config.placeholder ?? "";
  const description = config.description;

  const renderInput = () => {
    switch (field.field_type) {
      case "TEXT":
        return (
          <input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={config.maxLength}
            className="field-input"
            disabled={disabled}
          />
        );

      case "NUMBER":
        return (
          <input
            id={id}
            type="number"
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                onChange(null);
              } else {
                const num = parseFloat(val);
                onChange(isNaN(num) ? null : num);
              }
            }}
            placeholder={placeholder}
            min={config.min}
            max={config.max}
            step={config.step ?? "any"}
            className="field-input"
            disabled={disabled}
          />
        );

      case "BOOLEAN":
        return (
          <label className="checkbox-wrapper">
            <input
              id={id}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="field-checkbox"
              disabled={disabled}
            />
            <span className="checkbox-label">{config.label ?? "Ja"}</span>
          </label>
        );

      case "SELECT":
        return (
          <select
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="field-select"
            disabled={disabled}
          >
            <option value="">{placeholder || "Bitte wählen..."}</option>
            {(config.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "COUNTRY":
        return (
          <select
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="field-select"
            disabled={disabled}
          >
            <option value="">{placeholder || "Land wählen..."}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        );

      case "CURRENCY":
        return (
          <select
            id={id}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="field-select"
            disabled={disabled}
          >
            <option value="">{placeholder || "Währung wählen..."}</option>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={id}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="field-input"
            disabled={disabled}
          />
        );
    }
  };

  const renderSaveStatus = () => {
    if (saveStatus === "idle") return null;

    return (
      <span className={`save-indicator save-indicator-${saveStatus}`}>
        {saveStatus === "saving" && "Speichern..."}
        {saveStatus === "saved" && "✓ Gespeichert"}
        {saveStatus === "error" && "⚠ Fehler"}
      </span>
    );
  };

  return (
    <div className={`field-wrapper ${error ? "has-error" : ""}`}>
      {field.field_type !== "BOOLEAN" && (
        <div className="field-header">
          <label htmlFor={id} className="field-label">
            {label}
            {field.required && <span className="required-mark">*</span>}
          </label>
          {renderSaveStatus()}
        </div>
      )}

      {description && field.field_type !== "BOOLEAN" && (
        <p className="field-description">{description}</p>
      )}

      {renderInput()}

      {field.field_type === "BOOLEAN" && (
        <>
          {description && <p className="field-description">{description}</p>}
          {renderSaveStatus()}
        </>
      )}

      {error && <p className="field-error">{error}</p>}

      <style jsx>{`
        .field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .field-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text, #e4e4eb);
        }

        .required-mark {
          color: var(--color-error, #f87171);
          margin-left: 4px;
        }

        .field-description {
          font-size: 0.8rem;
          color: var(--color-text-muted, #8b8b9e);
          margin: 0;
          line-height: 1.4;
        }

        .save-indicator {
          font-size: 0.75rem;
        }

        .save-indicator-saving {
          color: var(--color-text-muted, #8b8b9e);
        }

        .save-indicator-saved {
          color: var(--color-success, #4ade80);
        }

        .save-indicator-error {
          color: var(--color-error, #f87171);
        }

        .field-wrapper :global(.field-input),
        .field-wrapper :global(.field-select) {
          padding: 0.75rem 1rem;
          font-size: 1rem;
          background: var(--color-bg, #0f0f12);
          border: 1px solid var(--color-border, #2a2a35);
          border-radius: 8px;
          color: var(--color-text, #e4e4eb);
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field-wrapper :global(.field-input):focus,
        .field-wrapper :global(.field-select):focus {
          outline: none;
          border-color: var(--color-primary, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .field-wrapper.has-error :global(.field-input),
        .field-wrapper.has-error :global(.field-select) {
          border-color: var(--color-error, #f87171);
        }

        .field-wrapper :global(.field-select) {
          cursor: pointer;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .field-wrapper :global(.field-checkbox) {
          width: 20px;
          height: 20px;
          accent-color: var(--color-primary, #6366f1);
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.9rem;
          color: var(--color-text, #e4e4eb);
        }

        .field-error {
          font-size: 0.8rem;
          color: var(--color-error, #f87171);
          margin: 0;
        }

        /* Remove number input spinners */
        .field-wrapper :global(.field-input[type="number"]::-webkit-outer-spin-button),
        .field-wrapper :global(.field-input[type="number"]::-webkit-inner-spin-button) {
          -webkit-appearance: none;
          margin: 0;
        }
        .field-wrapper :global(.field-input[type="number"]) {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}

