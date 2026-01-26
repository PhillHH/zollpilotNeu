import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

import { WizardClient } from "../src/app/app/cases/[id]/wizard/WizardClient";
import { FieldRenderer } from "../src/app/app/cases/[id]/wizard/FieldRenderer";
import { StepSidebar } from "../src/app/app/cases/[id]/wizard/StepSidebar";
import type { ProcedureField, ProcedureStep, ValidationError } from "../src/app/lib/api/client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock procedure definition
const mockProcedure = {
  data: {
    id: "proc-1",
    code: "IZA",
    name: "Zollanmeldung Import",
    version: "v1",
    is_active: true,
    steps: [
      {
        step_key: "package",
        title: "Sendungsdaten",
        order: 1,
        fields: [
          {
            field_key: "tracking_number",
            field_type: "TEXT" as const,
            required: true,
            config: { placeholder: "Tracking-Nummer eingeben", maxLength: 50 },
            order: 1
          },
          {
            field_key: "weight_kg",
            field_type: "NUMBER" as const,
            required: true,
            config: { min: 0.01, max: 1000 },
            order: 2
          }
        ]
      },
      {
        step_key: "person",
        title: "Empfängerdaten",
        order: 2,
        fields: [
          {
            field_key: "recipient_name",
            field_type: "TEXT" as const,
            required: true,
            config: { placeholder: "Name" },
            order: 1
          },
          {
            field_key: "is_business",
            field_type: "BOOLEAN" as const,
            required: false,
            config: { label: "Geschäftskunde" },
            order: 2
          }
        ]
      }
    ]
  }
};

// Mock case with bound procedure
const mockCaseWithProcedure = {
  data: {
    id: "case-1",
    title: "Test Case",
    status: "DRAFT",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    archived_at: null,
    fields: [],
    procedure_id: "proc-1",
    procedure_version: "v1",
    procedure: { code: "IZA", name: "Zollanmeldung Import" }
  }
};

// Mock case without procedure
const mockCaseNoProcedure = {
  data: {
    id: "case-2",
    title: "Unbound Case",
    status: "DRAFT",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    archived_at: null,
    fields: [],
    procedure_id: null,
    procedure_version: null,
    procedure: null
  }
};

// Mock procedure list
const mockProcedureList = {
  data: [
    { code: "IZA", name: "Zollanmeldung Import", version: "v1" },
    { code: "IPK", name: "Import Permit", version: "v1" }
  ]
};

describe("WizardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("renders steps from procedure definition", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCaseWithProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedure),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      // Check procedure name in header
      expect(screen.getByText(/Zollanmeldung Import/)).toBeInTheDocument();
      // Check step title
      expect(screen.getByText("Sendungsdaten")).toBeInTheDocument();
    });

    // Check fields are rendered
    expect(screen.getByPlaceholderText("Tracking-Nummer eingeben")).toBeInTheDocument();
  });

  test("shows procedure selector when no procedure bound", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/cases/case-2")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCaseNoProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures") && !url.includes("/procedures/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedureList),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-2" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Verfahren auswählen")).toBeInTheDocument();
      expect(screen.getByText("Zollanmeldung Import")).toBeInTheDocument();
      expect(screen.getByText("Import Permit")).toBeInTheDocument();
    });
  });

  test("autosave triggers PUT after debounce", async () => {
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCaseWithProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/fields/tracking_number") && options?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: { key: "tracking_number", value: "TEST123", updated_at: new Date().toISOString() }
          }),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Tracking-Nummer eingeben")).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText("Tracking-Nummer eingeben");

    // Type in input
    await act(async () => {
      fireEvent.change(input, { target: { value: "TEST123" } });
    });

    // Save shouldn't have been called yet
    const saveCallsBefore = mockFetch.mock.calls.filter((call) =>
      call[0].includes("/fields/tracking_number")
    );
    expect(saveCallsBefore.length).toBe(0);

    // Fast-forward debounce timer (500ms)
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Now save should have been called
    await waitFor(() => {
      const saveCalls = mockFetch.mock.calls.filter((call) =>
        call[0].includes("/fields/tracking_number")
      );
      expect(saveCalls.length).toBeGreaterThan(0);
    });
  });

  test("validation errors are displayed", async () => {
    const validationResponse = {
      data: {
        valid: false,
        errors: [
          { step_key: "package", field_key: "tracking_number", message: "Field 'tracking_number' is required." },
          { step_key: "package", field_key: "weight_kg", message: "Field 'weight_kg' is required." }
        ]
      }
    };

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCaseWithProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/validate") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(validationResponse),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Prüfen")).toBeInTheDocument();
    });

    // Click validate button
    const validateBtn = screen.getByText("Prüfen");
    await act(async () => {
      fireEvent.click(validateBtn);
    });

    // Check validation errors are shown
    await waitFor(() => {
      expect(screen.getByText(/tracking_number.*required/i)).toBeInTheDocument();
    });
  });

  test("submit button disabled when validation errors exist", async () => {
    // Mock case at last step with procedure
    const mockCaseLastStep = {
      ...mockCaseWithProcedure,
      data: { ...mockCaseWithProcedure.data, fields: [] }
    };

    const validationResponse = {
      data: {
        valid: false,
        errors: [{ step_key: "package", field_key: "tracking_number", message: "Required" }]
      }
    };

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCaseLastStep),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        // Only 1 step to test submit button on last step
        const singleStepProcedure = {
          data: { ...mockProcedure.data, steps: [mockProcedure.data.steps[0]] }
        };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(singleStepProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/validate") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(validationResponse),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Einreichen")).toBeInTheDocument();
    });

    // Run validation to populate errors
    const validateBtn = screen.getByText("Prüfen");
    await act(async () => {
      fireEvent.click(validateBtn);
    });

    // Submit button should be disabled due to validation errors
    await waitFor(() => {
      const submitBtn = screen.getByText("Einreichen");
      expect(submitBtn).toBeDisabled();
    });
  });

  test("shows readonly banner when status is SUBMITTED", async () => {
    const mockSubmittedCase = {
      data: {
        ...mockCaseWithProcedure.data,
        status: "SUBMITTED",
        version: 1,
        submitted_at: "2024-01-03T15:00:00Z"
      }
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmittedCase),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedure),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Eingereicht – Änderungen nicht mehr möglich")).toBeInTheDocument();
    });
  });

  test("fields are disabled when status is SUBMITTED", async () => {
    const mockSubmittedCase = {
      data: {
        ...mockCaseWithProcedure.data,
        status: "SUBMITTED",
        version: 1,
        submitted_at: "2024-01-03T15:00:00Z"
      }
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmittedCase),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProcedure),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText("Tracking-Nummer eingeben");
      expect(input).toBeDisabled();
    });
  });
});

describe("FieldRenderer", () => {
  test("renders TEXT field as text input", () => {
    const field: ProcedureField = {
      field_key: "name",
      field_type: "TEXT",
      required: true,
      config: { placeholder: "Enter name" },
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value=""
        onChange={() => {}}
        saveStatus="idle"
        error={null}
      />
    );

    const input = screen.getByPlaceholderText("Enter name");
    expect(input).toHaveAttribute("type", "text");
  });

  test("renders NUMBER field as number input", () => {
    const field: ProcedureField = {
      field_key: "weight",
      field_type: "NUMBER",
      required: true,
      config: { min: 0, max: 100 },
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value={50}
        onChange={() => {}}
        saveStatus="idle"
        error={null}
      />
    );

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveValue(50);
  });

  test("renders BOOLEAN field as checkbox", () => {
    const field: ProcedureField = {
      field_key: "is_active",
      field_type: "BOOLEAN",
      required: false,
      config: { label: "Is Active" },
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value={true}
        onChange={() => {}}
        saveStatus="idle"
        error={null}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
    expect(screen.getByText("Is Active")).toBeInTheDocument();
  });

  test("renders SELECT field with options", () => {
    const field: ProcedureField = {
      field_key: "transport",
      field_type: "SELECT",
      required: true,
      config: { options: ["AIR", "SEA", "ROAD"] },
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value="SEA"
        onChange={() => {}}
        saveStatus="idle"
        error={null}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("SEA");
    expect(screen.getByText("AIR")).toBeInTheDocument();
    expect(screen.getByText("SEA")).toBeInTheDocument();
    expect(screen.getByText("ROAD")).toBeInTheDocument();
  });

  test("renders COUNTRY field as select with country options", () => {
    const field: ProcedureField = {
      field_key: "origin_country",
      field_type: "COUNTRY",
      required: true,
      config: null,
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value="DE"
        onChange={() => {}}
        saveStatus="idle"
        error={null}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("DE");
    expect(screen.getByText(/Deutschland/)).toBeInTheDocument();
  });

  test("shows save status indicator", () => {
    const field: ProcedureField = {
      field_key: "name",
      field_type: "TEXT",
      required: true,
      config: null,
      order: 1
    };

    const { rerender } = render(
      <FieldRenderer
        field={field}
        value=""
        onChange={() => {}}
        saveStatus="saving"
        error={null}
      />
    );

    expect(screen.getByText("Speichern...")).toBeInTheDocument();

    rerender(
      <FieldRenderer
        field={field}
        value=""
        onChange={() => {}}
        saveStatus="saved"
        error={null}
      />
    );

    expect(screen.getByText("✓ Gespeichert")).toBeInTheDocument();
  });

  test("shows field error", () => {
    const field: ProcedureField = {
      field_key: "name",
      field_type: "TEXT",
      required: true,
      config: null,
      order: 1
    };

    render(
      <FieldRenderer
        field={field}
        value=""
        onChange={() => {}}
        saveStatus="idle"
        error="This field is required."
      />
    );

    expect(screen.getByText("This field is required.")).toBeInTheDocument();
  });
});

describe("StepSidebar", () => {
  const mockSteps: ProcedureStep[] = [
    { step_key: "step1", title: "First Step", order: 1, fields: [] },
    { step_key: "step2", title: "Second Step", order: 2, fields: [] },
    { step_key: "step3", title: "Third Step", order: 3, fields: [] }
  ];

  test("renders all steps", () => {
    render(
      <StepSidebar
        steps={mockSteps}
        currentIndex={0}
        validationErrors={[]}
        onStepClick={() => {}}
      />
    );

    expect(screen.getByText("First Step")).toBeInTheDocument();
    expect(screen.getByText("Second Step")).toBeInTheDocument();
    expect(screen.getByText("Third Step")).toBeInTheDocument();
  });

  test("shows error badge for steps with validation errors", () => {
    const errors: ValidationError[] = [
      { step_key: "step1", field_key: "field1", message: "Error 1" },
      { step_key: "step1", field_key: "field2", message: "Error 2" }
    ];

    render(
      <StepSidebar
        steps={mockSteps}
        currentIndex={0}
        validationErrors={errors}
        onStepClick={() => {}}
      />
    );

    // Should show "2" badge for step1 (2 errors)
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("calls onStepClick when step is clicked", () => {
    const onStepClick = vi.fn();

    render(
      <StepSidebar
        steps={mockSteps}
        currentIndex={0}
        validationErrors={[]}
        onStepClick={onStepClick}
      />
    );

    fireEvent.click(screen.getByText("Second Step"));
    expect(onStepClick).toHaveBeenCalledWith(1);
  });
});


// --- Additional Wizard Flow Tests ---

describe("Wizard Complete Flow (Validation Fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("validation error on field -> fix field -> validation passes", async () => {
    // Scenario: Field has error, user fixes it, validation passes
    let currentValidation = {
      data: {
        valid: false,
        errors: [{ step_key: "package", field_key: "tracking_number", message: "Field is required" }]
      }
    };

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              id: "case-1",
              title: "Test Case",
              status: "DRAFT",
              created_at: "2024-01-01T10:00:00Z",
              updated_at: "2024-01-02T12:00:00Z",
              fields: [],
              procedure_id: "proc-1",
              procedure_version: "v1",
              procedure: { code: "IZA", name: "Test" }
            }
          }),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              id: "proc-1",
              code: "IZA",
              name: "Test",
              version: "v1",
              steps: [{
                step_key: "package",
                title: "Package",
                order: 1,
                fields: [{
                  field_key: "tracking_number",
                  field_type: "TEXT",
                  required: true,
                  config: { placeholder: "Enter tracking" },
                  order: 1
                }]
              }]
            }
          }),
          headers: new Headers()
        });
      }
      if (url.includes("/validate") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(currentValidation),
          headers: new Headers()
        });
      }
      if (url.includes("/fields/tracking_number") && options?.method === "PUT") {
        // After field is saved, next validation should pass
        currentValidation = { data: { valid: true, errors: [] } };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { key: "tracking_number", value: "FIXED123" } }),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    // Wait for wizard to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter tracking")).toBeInTheDocument();
    });

    // Click validate - should show error
    const validateBtn = screen.getByText("Prüfen");
    await act(async () => {
      fireEvent.click(validateBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    // Fix the field
    const input = screen.getByPlaceholderText("Enter tracking");
    await act(async () => {
      fireEvent.change(input, { target: { value: "FIXED123" } });
    });

    // Advance debounce timer
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Validate again - should pass
    await act(async () => {
      fireEvent.click(validateBtn);
    });

    await waitFor(() => {
      // Error should no longer be shown (or valid state is shown)
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  test("step navigation back and forth preserves field values", async () => {
    let savedFields: Record<string, any> = {};

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/cases/case-1") && !url.includes("/fields") && !url.includes("/procedure") && !url.includes("/validate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              id: "case-1",
              title: "Test",
              status: "DRAFT",
              fields: Object.entries(savedFields).map(([k, v]) => ({ key: k, value_json: v })),
              procedure_id: "proc-1",
              procedure_version: "v1",
              procedure: { code: "IZA", name: "Test" }
            }
          }),
          headers: new Headers()
        });
      }
      if (url.includes("/procedures/IZA")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              id: "proc-1",
              code: "IZA",
              name: "Test",
              version: "v1",
              steps: [
                { step_key: "step1", title: "Step 1", order: 1, fields: [{ field_key: "field1", field_type: "TEXT", required: true, config: { placeholder: "Field 1" }, order: 1 }] },
                { step_key: "step2", title: "Step 2", order: 2, fields: [{ field_key: "field2", field_type: "TEXT", required: true, config: { placeholder: "Field 2" }, order: 1 }] }
              ]
            }
          }),
          headers: new Headers()
        });
      }
      if (url.match(/\/fields\/(\w+)$/) && options?.method === "PUT") {
        const key = url.match(/\/fields\/(\w+)$/)?.[1];
        const body = JSON.parse(options?.body as string);
        if (key) savedFields[key] = body.value;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { key, value: body.value } }),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });

    await act(async () => {
      render(<WizardClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Field 1")).toBeInTheDocument();
    });

    // Fill Step 1
    const input1 = screen.getByPlaceholderText("Field 1");
    await act(async () => {
      fireEvent.change(input1, { target: { value: "Value1" } });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Navigate to Step 2
    const nextBtn = screen.getByText("Weiter");
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Field 2")).toBeInTheDocument();
    });

    // Fill Step 2
    const input2 = screen.getByPlaceholderText("Field 2");
    await act(async () => {
      fireEvent.change(input2, { target: { value: "Value2" } });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Navigate back to Step 1
    const backBtn = screen.getByText("Zurück");
    await act(async () => {
      fireEvent.click(backBtn);
    });

    await waitFor(() => {
      const field1 = screen.getByPlaceholderText("Field 1") as HTMLInputElement;
      expect(field1.value).toBe("Value1");
    });
  });
});

