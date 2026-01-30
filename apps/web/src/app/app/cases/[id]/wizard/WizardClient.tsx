"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Section } from "../../../../design-system/primitives/Section";
import { Card } from "../../../../design-system/primitives/Card";
import { Button } from "../../../../design-system/primitives/Button";
import { Alert } from "../../../../design-system/primitives/Alert";
import { Badge } from "../../../../design-system/primitives/Badge";
import { Stepper, type Step } from "../../../../design-system/primitives/Stepper";

import {
  cases as casesApi,
  fields as fieldsApi,
  procedures as proceduresApi,
  profile as profileApi,
  type CaseDetail,
  type ProcedureDefinition,
  type ProcedureStep,
  type ValidationError,
  type ApiError,
  type ProfileData,
} from "../../../../lib/api/client";

import { ProcedureSelector } from "./ProcedureSelector";
import { FieldRenderer } from "./FieldRenderer";
import { MappingView } from "./mapping";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type FieldSaveState = {
  [fieldKey: string]: SaveStatus;
};

type WizardClientProps = {
  caseId: string;
};

// Step-specific hints for the user
const STEP_HINTS: Record<string, string> = {
  // Assuming standard keys based on typical procedure structure
  "package": "Diese Angaben finden Sie später im Zollformular unter 'Sendung' / 'Paketdaten'.",
  "sender": "Diese Angaben entsprechen dem Abschnitt 'Versender' im Zollformular.",
  "recipient": "Diese Angaben gehören in den Abschnitt 'Empfänger' im Zollformular.",
  "goods": "Jede Warenposition muss einzeln im Zollformular unter 'Positionen' erfasst werden.",
  "additional": "Hier erfassen Sie Zusatzinfos für das Feld 'Bemerkungen' oder 'Unterlagen'.",
};



/**
 * Wizard Client – Schritt-für-Schritt Formular
 */
export function WizardClient({ caseId }: WizardClientProps) {
  const router = useRouter();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [procedure, setProcedure] = useState<ProcedureDefinition | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});

  // Wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [fieldSaveStates, setFieldSaveStates] = useState<FieldSaveState>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMappingView, setShowMappingView] = useState(false);

  // Debounce timers
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

  // Readonly mode when case is not DRAFT
  const isReadonly = caseData?.status !== "DRAFT";

  // Check if all required fields are filled (all steps complete)
  const allStepsComplete = useMemo(() => {
    if (!procedure) return false;

    for (const step of procedure.steps) {
      for (const field of step.fields) {
        if (field.required) {
          const value = fieldValues[field.field_key];
          if (value === null || value === undefined || value === "") {
            return false;
          }
        }
      }
    }
    return true;
  }, [procedure, fieldValues]);

  // Map profile data to case field keys
  const getProfileDefaults = (profileData: ProfileData): Record<string, unknown> => {
    const defaults: Record<string, unknown> = {};

    // Map profile fields to wizard field keys
    if (profileData.default_sender_name) {
      defaults["sender_name"] = profileData.default_sender_name;
    }
    if (profileData.default_sender_country) {
      defaults["sender_country"] = profileData.default_sender_country;
    }
    if (profileData.default_recipient_name) {
      defaults["recipient_name"] = profileData.default_recipient_name;
    }
    if (profileData.default_recipient_country) {
      defaults["recipient_country"] = profileData.default_recipient_country;
    }

    return defaults;
  };

  // Apply profile defaults to empty fields
  const applyProfileDefaults = useCallback(
    async (existingValues: Record<string, unknown>) => {
      try {
        const profileResponse = await profileApi.get();
        const profileData = profileResponse.data;
        const defaults = getProfileDefaults(profileData);

        // Only apply defaults where fields are empty
        const fieldsToUpdate: { key: string; value: unknown }[] = [];

        for (const [key, value] of Object.entries(defaults)) {
          if (
            existingValues[key] === undefined ||
            existingValues[key] === null ||
            existingValues[key] === ""
          ) {
            fieldsToUpdate.push({ key, value });
          }
        }

        // Update fields with defaults
        if (fieldsToUpdate.length > 0) {
          const newValues = { ...existingValues };

          for (const { key, value } of fieldsToUpdate) {
            newValues[key] = value;
            // Save to API (don't await all, just fire)
            fieldsApi.upsert(caseId, key, value).catch(() => {
              // Silent fail - user can manually fill
            });
          }

          setFieldValues(newValues);
        }
      } catch {
        // Silent fail - profile defaults are optional
      }
    },
    [caseId]
  );

  // Load case and procedure
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const caseResponse = await casesApi.get(caseId);
      const loadedCase = caseResponse.data;
      setCaseData(loadedCase);

      const values: Record<string, unknown> = {};
      for (const field of loadedCase.fields) {
        values[field.key] = field.value;
      }
      setFieldValues(values);

      if (loadedCase.procedure?.code) {
        const procResponse = await proceduresApi.get(loadedCase.procedure.code);
        setProcedure(procResponse.data);
      }

      // Apply profile defaults for new cases (DRAFT with few/no fields)
      if (loadedCase.status === "DRAFT" && loadedCase.fields.length < 5) {
        applyProfileDefaults(values);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }, [caseId, applyProfileDefaults]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(clearTimeout);
    };
  }, [debounceTimers]);

  // Current step
  const currentStep: ProcedureStep | null = useMemo(() => {
    if (!procedure) return null;
    return procedure.steps[currentStepIndex] ?? null;
  }, [procedure, currentStepIndex]);

  // Validation errors for current step
  const currentStepErrors = useMemo(() => {
    if (!currentStep) return [];
    return validationErrors.filter((e) => e.step_key === currentStep.step_key);
  }, [validationErrors, currentStep]);

  // Steps for Stepper component
  const stepperSteps: Step[] = useMemo(() => {
    if (!procedure) return [];
    return procedure.steps.map((step, index) => {
      const hasErrors = validationErrors.some((e) => e.step_key === step.step_key);
      let status: Step["status"] = "pending";

      if (index < currentStepIndex) {
        status = hasErrors ? "error" : "completed";
      } else if (index === currentStepIndex) {
        status = hasErrors ? "error" : "active";
      }

      return {
        id: step.step_key,
        label: step.title,
        status,
      };
    });
  }, [procedure, currentStepIndex, validationErrors]);

  // Handle field change with debounced autosave
  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (isReadonly) return;

      setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));

      if (debounceTimers[fieldKey]) {
        clearTimeout(debounceTimers[fieldKey]);
      }

      setFieldSaveStates((prev) => ({ ...prev, [fieldKey]: "saving" }));

      const timer = setTimeout(async () => {
        try {
          await fieldsApi.upsert(caseId, fieldKey, value);
          setFieldSaveStates((prev) => ({ ...prev, [fieldKey]: "saved" }));

          setTimeout(() => {
            setFieldSaveStates((prev) => ({ ...prev, [fieldKey]: "idle" }));
          }, 2000);
        } catch {
          setFieldSaveStates((prev) => ({ ...prev, [fieldKey]: "error" }));
        }
      }, 500);

      setDebounceTimers((prev) => ({ ...prev, [fieldKey]: timer }));
    },
    [caseId, debounceTimers, isReadonly]
  );

  // Submit case
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await casesApi.submit(caseId);
      router.push(`/app/cases/${caseId}/summary`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "CASE_INVALID") {
        setError("Der Fall enthält noch Fehler. Bitte korrigieren Sie diese zuerst.");
        await runValidation();
      } else {
        setError(apiErr.message || "Fehler beim Einreichen.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [caseId, router]);

  // Validate case
  const runValidation = useCallback(async () => {
    setIsValidating(true);
    try {
      const response = await proceduresApi.validate(caseId);
      setValidationErrors(response.data.errors ?? []);
      return response.data.valid;
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === "NO_PROCEDURE_BOUND") {
        setError("Kein Verfahren gebunden.");
      }
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [caseId]);

  // Navigate to step
  const goToStep = useCallback(
    async (stepId: string) => {
      if (!procedure) return;
      const index = procedure.steps.findIndex((s) => s.step_key === stepId);
      if (index >= 0) {
        await runValidation();
        setCurrentStepIndex(index);
      }
    },
    [procedure, runValidation]
  );

  // Next step
  const nextStep = useCallback(async () => {
    if (!procedure) return;
    if (currentStepIndex < procedure.steps.length - 1) {
      await runValidation();
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [procedure, currentStepIndex, runValidation]);

  // Previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  // Handle procedure selection
  const handleProcedureSelected = useCallback(
    async (code: string) => {
      try {
        await proceduresApi.bind(caseId, code);
        await loadData();
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Fehler beim Binden des Verfahrens.");
      }
    },
    [caseId, loadData]
  );

  // Get error for specific field
  const getFieldError = useCallback(
    (fieldKey: string): string | null => {
      const err = validationErrors.find((e) => e.field_key === fieldKey);
      return err?.message ?? null;
    },
    [validationErrors]
  );

  // Loading state
  if (loading) {
    return (
      <Section maxWidth="lg" padding="xl">
        <div className="wizard-loading">
          <p>Laden...</p>
        </div>
        <style jsx>{`
          .wizard-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            color: var(--color-text-muted);
          }
        `}</style>
      </Section>
    );
  }

  // Error state
  if (error && !caseData) {
    return (
      <Section maxWidth="lg" padding="xl">
        <Alert variant="error">
          {error}
        </Alert>
        <div className="error-actions">
          <Button variant="secondary" onClick={() => router.push("/app/cases")}>
            Zurück zur Übersicht
          </Button>
        </div>
        <style jsx>{`
          .error-actions {
            margin-top: var(--space-lg);
            text-align: center;
          }
        `}</style>
      </Section>
    );
  }

  // No procedure bound - show selector
  if (!procedure) {
    return (
      <ProcedureSelector
        caseTitle={caseData?.title ?? "Unbenannt"}
        onSelect={handleProcedureSelected}
        onCancel={() => router.push(`/app/cases/${caseId}`)}
      />
    );
  }

  // Render wizard
  const totalSteps = procedure.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <Section maxWidth="xl" padding="lg" className="wizard-section">
      {/* Header */}
      <header className="wizard-header">
        <button
          type="button"
          className="back-link"
          onClick={() => router.push(`/app/cases/${caseId}`)}
        >
          ← Zurück zum Fall
        </button>
        <div className="header-content">
          <h1 className="wizard-title">{procedure.name}</h1>
          <p className="wizard-subtitle">
            Schritt {currentStepIndex + 1} von {totalSteps}
          </p>
        </div>
        {isReadonly && <Badge status="submitted">{""}</Badge>}
      </header>

      {/* Readonly Banner */}
      {isReadonly && (
        <Alert variant="info" title="Nur Lesen">
          Dieser Fall wurde bereits eingereicht. Änderungen sind nicht mehr möglich.
        </Alert>
      )}

      {/* Intro Hint */}
      {!isReadonly && (
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <Alert variant="info" title="Wichtig zu wissen">
            ZollPilot bereitet Ihre Zollanmeldung vor. Die eigentliche Anmeldung nehmen Sie
            anschließend selbst beim Zoll vor (wir zeigen Ihnen wie).
          </Alert>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stepper */}
      <Card padding="md" className="stepper-card">
        <Stepper
          steps={stepperSteps}
          currentStep={currentStep?.step_key}
          onStepClick={goToStep}
          orientation="horizontal"
        />
      </Card>

      {/* Main Content */}
      <div className="wizard-body">
        {currentStep && (
          <Card padding="lg" className="step-card">
            <h2 className="step-title">{currentStep.title}</h2>

            {/* Step Hint */}
            {STEP_HINTS[currentStep.step_key] && (
              <div style={{ marginBottom: "var(--space-md)" }}>
                <Alert variant="info">
                  💡 {STEP_HINTS[currentStep.step_key]}
                </Alert>
              </div>
            )}

            {/* Step Errors */}
            {currentStepErrors.length > 0 && (
              <Alert variant="warning" title="Bitte korrigieren">
                <ul className="error-list">
                  {currentStepErrors.map((e) => (
                    <li key={e.field_key}>{e.message}</li>
                  ))}
                </ul>
              </Alert>
            )}

            {/* Fields */}
            <div className="fields">
              {currentStep.fields.map((field) => (
                <FieldRenderer
                  key={field.field_key}
                  field={field}
                  value={fieldValues[field.field_key]}
                  onChange={(value) => handleFieldChange(field.field_key, value)}
                  saveStatus={fieldSaveStates[field.field_key] ?? "idle"}
                  error={getFieldError(field.field_key)}
                  disabled={isReadonly}
                />
              ))}
            </div>
          </Card>
        )}

        {/* Navigation */}
        <Card padding="md" className="nav-card">
          <div className="wizard-nav">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={isFirstStep}
            >
              ← Zurück
            </Button>

            <Button
              variant="ghost"
              onClick={() => setShowMappingView(true)}
              disabled={!allStepsComplete || isReadonly}
              title={!allStepsComplete ? "Bitte füllen Sie zuerst alle Pflichtfelder aus" : undefined}
            >
              Wo trage ich das beim Zoll ein?
            </Button>

            {isLastStep ? (
              isReadonly ? (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/app/cases/${caseId}/summary`)}
                >
                  Zur Zusammenfassung
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || validationErrors.length > 0}
                  loading={isSubmitting}
                >
                  Einreichen
                </Button>
              )
            ) : (
              <Button
                variant="primary"
                onClick={nextStep}
              >
                Weiter →
              </Button>
            )}
          </div>
        </Card>
      </div>

      <style jsx>{`
        :global(.wizard-section) {
          min-height: calc(100vh - 140px);
        }

        .wizard-header {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          margin-bottom: var(--space-lg);
        }

        .back-link {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: var(--text-sm);
          cursor: pointer;
          padding: 0;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .header-content {
          flex: 1;
        }

        .wizard-title {
          font-size: var(--heading-h2);
          color: var(--color-text);
          margin: 0;
        }

        .wizard-subtitle {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: var(--space-xs) 0 0 0;
        }

        :global(.stepper-card) {
          margin-bottom: var(--space-lg);
        }

        .wizard-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .step-title {
          font-size: var(--heading-h3);
          color: var(--color-text);
          margin: 0 0 var(--space-lg) 0;
          padding-bottom: var(--space-md);
          border-bottom: 1px solid var(--color-border);
        }

        .error-list {
          margin: 0;
          padding-left: var(--space-lg);
        }

        .error-list li {
          margin: var(--space-xs) 0;
        }

        .fields {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .wizard-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }

        @media (max-width: 768px) {
          .wizard-nav {
            flex-wrap: wrap;
          }
        }

        /* Mapping View Modal Overlay */
        .mapping-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--space-lg);
          overflow-y: auto;
        }

        .mapping-modal {
          background: var(--color-background);
          border-radius: var(--radius-lg);
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: var(--space-xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        @media (max-width: 768px) {
          .mapping-modal {
            padding: var(--space-lg);
            max-height: 95vh;
          }
        }
      `}</style>

      {/* Mapping View Modal */}
      {showMappingView && procedure && (
        <div className="mapping-overlay" onClick={() => setShowMappingView(false)}>
          <div className="mapping-modal" onClick={(e) => e.stopPropagation()}>
            <MappingView
              procedureCode={procedure.code}
              procedureVersion={procedure.version}
              fieldValues={fieldValues}
              onClose={() => setShowMappingView(false)}
              onConfirm={async () => {
                setShowMappingView(false);
                await handleSubmit();
              }}
            />
          </div>
        </div>
      )}
    </Section>
  );
}
