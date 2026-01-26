"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Section } from "../../../../design-system/primitives/Section";
import { Card } from "../../../../design-system/primitives/Card";
import { Button } from "../../../../design-system/primitives/Button";
import { Alert } from "../../../../design-system/primitives/Alert";
import {
    cases as casesApi,
    procedures as proceduresApi,
    type CaseDetail,
    type ProcedureDefinition,
} from "../../../../lib/api/client";

type AssistClientProps = {
    caseId: string;
};

// Helper to format values for display/copy
const formatValue = (value: unknown, fieldType: string): string => {
    if (value === null || value === undefined || value === "") return "–";
    if (fieldType === "BOOLEAN") return value ? "Ja" : "Nein";
    if (fieldType === "CURRENCY") return String(value).toUpperCase();
    return String(value);
};

export function AssistClient({ caseId }: AssistClientProps) {
    const router = useRouter();

    // Data State
    const [loading, setLoading] = useState(true);
    const [caseData, setCaseData] = useState<CaseDetail | null>(null);
    const [procedure, setProcedure] = useState<ProcedureDefinition | null>(null);
    const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

    // UI State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>({});

    // Load Data
    useEffect(() => {
        const load = async () => {
            try {
                const c = await casesApi.get(caseId);
                setCaseData(c.data);

                const values: Record<string, unknown> = {};
                for (const f of c.data.fields) {
                    values[f.key] = f.value;
                }
                setFieldValues(values);

                if (c.data.procedure?.code) {
                    const p = await proceduresApi.get(c.data.procedure.code);
                    setProcedure(p.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [caseId]);

    // Derived State
    const steps = procedure?.steps ?? [];
    const currentStep = steps[currentStepIndex];
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    // Handlers
    const handleCopy = (value: string, fieldKey: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);

        // Auto-check on copy
        setCheckedFields((prev) => ({ ...prev, [fieldKey]: true }));
    };

    const handleNext = () => {
        if (!isLastStep) setCurrentStepIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        if (!isFirstStep) setCurrentStepIndex(prev => prev - 1);
    };

    if (loading || !caseData) {
        if (loading) return <Section maxWidth="lg" padding="xl"><p>Laden...</p></Section>;
    }

    if (!caseData || !procedure) return <Section maxWidth="lg" padding="xl"><p>Fehler beim Laden.</p></Section>;

    return (
        <Section maxWidth="lg" padding="lg" className="assist-mode">
            {/* Header */}
            <header className="assist-header">
                <Button variant="ghost" onClick={() => router.push(`/app/cases/${caseId}/summary`)}>
                    ← Zurück zur Übersicht
                </Button>
                <h1 className="title">Zollanmeldung ausfüllen</h1>
                <div className="progress">
                    Schritt {currentStepIndex + 1} von {steps.length}: {currentStep?.title}
                </div>
            </header>

            {/* Instruction */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
                <Alert variant="info" title="Anleitung">
                    Öffnen Sie das <strong>offizielle Zollformular</strong> in einem zweiten Fenster.
                    Übertragen Sie die Werte Abschnitt für Abschnitt.
                </Alert>
            </div>

            {/* Content */}
            <Card padding="lg" className="assist-card">
                <h2 className="step-title">{currentStep?.title}</h2>

                <div className="fields-list">
                    {currentStep?.fields.map((field) => {
                        const value = fieldValues[field.field_key];
                        const displayValue = formatValue(value, field.field_type);
                        const isChecked = checkedFields[field.field_key];
                        const isCopied = copiedField === field.field_key;

                        // Get label from config or key
                        const label = field.config?.label || field.config?.title || field.field_key;

                        return (
                            <div key={field.field_key} className={`field-row ${isChecked ? 'checked' : ''}`}>
                                <div className="field-info">
                                    <div className="field-label">{label}</div>
                                    <div className="field-value-display">{displayValue}</div>
                                </div>

                                <div className="field-actions">
                                    <button
                                        className="copy-btn"
                                        onClick={() => handleCopy(String(value ?? ""), field.field_key)}
                                        title="Wert kopieren"
                                    >
                                        {isCopied ? "Kopiert!" : "Kopieren"}
                                    </button>

                                    <label className="check-label">
                                        <input
                                            type="checkbox"
                                            checked={!!isChecked}
                                            onChange={(e) => setCheckedFields(prev => ({ ...prev, [field.field_key]: e.target.checked }))}
                                        />
                                        <span>Erledigt</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Navigation */}
            <div className="assist-nav">
                <Button variant="secondary" onClick={handlePrev} disabled={isFirstStep}>
                    Zurück
                </Button>

                {isLastStep ? (
                    <Button variant="primary" onClick={() => router.push(`/app/cases/${caseId}/summary`)}>
                        Fertig
                    </Button>
                ) : (
                    <Button variant="primary" onClick={handleNext}>
                        Nächster Abschnitt →
                    </Button>
                )}
            </div>

            <style jsx>{`
        .assist-header {
          margin-bottom: var(--space-lg);
        }
        .title {
          font-size: var(--heading-h2);
          margin: var(--space-md) 0 var(--space-xs) 0;
        }
        .progress {
          color: var(--color-text-muted);
          font-weight: var(--font-medium);
        }
        
        .step-title {
          margin-top: 0;
          margin-bottom: var(--space-lg);
          padding-bottom: var(--space-md);
          border-bottom: 1px solid var(--color-border);
        }

        .fields-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-background);
          transition: background 0.2s;
        }
        
        .field-row.checked {
          background: var(--color-background-subtle);
          border-color: var(--color-success); // visual feedback
        }

        .field-info {
          flex: 1;
        }
        
        .field-label {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }
        
        .field-value-display {
          font-size: var(--text-lg);
          font-weight: var(--font-medium);
          font-family: monospace; /* easier to read for copying */
        }

        .field-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .copy-btn {
          background: var(--color-primary-soft);
          color: var(--color-primary);
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          font-size: var(--text-sm);
          min-width: 80px;
        }
        .copy-btn:hover {
          background: var(--color-primary-soft-hover);
        }

        .check-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: var(--text-sm);
          user-select: none;
        }

        .assist-nav {
          margin-top: var(--space-lg);
          display: flex;
          justify-content: space-between;
        }
        
        @media (max-width: 640px) {
          .field-row {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-mb);
          }
          .field-actions {
            width: 100%;
            justify-content: space-between;
            margin-top: var(--space-sm);
          }
        }
      `}</style>
        </Section>
    );
}
// Force rebuild check
