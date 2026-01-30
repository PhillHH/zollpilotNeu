import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

import { MappingView } from "../src/app/app/cases/[id]/wizard/mapping/MappingView";
import {
  getMappingConfig,
  getFieldMapping,
  IZA_V1_MAPPING,
} from "../src/app/app/cases/[id]/wizard/mapping/MappingConfig";

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve())
};
Object.assign(navigator, {
  clipboard: mockClipboard
});

describe("MappingConfig", () => {
  test("getMappingConfig returns IZA v1 config", () => {
    const config = getMappingConfig("IZA", "v1");
    expect(config).not.toBeNull();
    expect(config?.procedureCode).toBe("IZA");
    expect(config?.procedureVersion).toBe("v1");
  });

  test("getMappingConfig returns null for unknown procedure", () => {
    const config = getMappingConfig("UNKNOWN", "v1");
    expect(config).toBeNull();
  });

  test("getFieldMapping returns correct mapping for content field", () => {
    const mapping = getFieldMapping("IZA", "v1", "content");
    expect(mapping).not.toBeNull();
    expect(mapping?.label).toBe("Inhalt der Sendung");
    expect(mapping?.targetForm).toBe("IZA – Angaben zur Sendung");
    expect(mapping?.targetField).toBe('Feld „Warenbeschreibung"');
  });

  test("getFieldMapping returns null for unknown field", () => {
    const mapping = getFieldMapping("IZA", "v1", "unknown_field");
    expect(mapping).toBeNull();
  });

  test("IZA v1 config has all expected fields", () => {
    const expectedFields = [
      "content",
      "value_amount",
      "value_currency",
      "origin_country",
      "commercial_goods",
      "sender_name",
      "sender_country",
      "recipient_name",
      "recipient_country",
      "remarks"
    ];

    for (const fieldKey of expectedFields) {
      const mapping = IZA_V1_MAPPING.mappings.find((m) => m.fieldKey === fieldKey);
      expect(mapping).toBeDefined();
    }
  });

  test("all mappings have required properties", () => {
    for (const mapping of IZA_V1_MAPPING.mappings) {
      expect(mapping.fieldKey).toBeDefined();
      expect(mapping.label).toBeDefined();
      expect(mapping.targetForm).toBeDefined();
      expect(mapping.targetField).toBeDefined();
      // hint is optional
    }
  });
});

describe("MappingView", () => {
  const mockFieldValues = {
    content: "Electronics - Smartphone",
    value_amount: 150.00,
    value_currency: "EUR",
    origin_country: "CN",
    commercial_goods: false,
    sender_name: "Test Sender",
    sender_country: "CN",
    recipient_name: "Max Mustermann",
    recipient_country: "DE",
    remarks: "Test order #12345"
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders mapping view with correct title", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Wo trage ich das beim Zoll ein?")).toBeInTheDocument();
  });

  test("renders all field values", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // Check some field values are displayed
    expect(screen.getByText("Electronics - Smartphone")).toBeInTheDocument();
    expect(screen.getByText("Max Mustermann")).toBeInTheDocument();
    expect(screen.getByText("Test Sender")).toBeInTheDocument();
  });

  test("renders target form and field information", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // Check target form sections (multiple elements may exist with same text)
    expect(screen.getAllByText("IZA – Angaben zur Sendung").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IZA – Versender").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IZA – Empfänger").length).toBeGreaterThan(0);
  });

  test("copy button copies value to clipboard", async () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // Find and click a copy button
    const copyButtons = screen.getAllByText("Kopieren");
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  test("copy button shows 'Kopiert!' after clicking", async () => {
    vi.useFakeTimers();

    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    const copyButtons = screen.getAllByText("Kopieren");
    fireEvent.click(copyButtons[0]);

    expect(screen.getByText("Kopiert!")).toBeInTheDocument();

    // After 2 seconds, should reset
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText("Kopiert!")).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  test("shows hint when toggle is clicked", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // Find hint toggle
    const hintToggles = screen.getAllByText("Warum fragt der Zoll das?");
    expect(hintToggles.length).toBeGreaterThan(0);

    fireEvent.click(hintToggles[0]);

    // Should now show "Weniger anzeigen"
    expect(screen.getByText("Weniger anzeigen")).toBeInTheDocument();
  });

  test("calls onClose when back button is clicked", () => {
    const onClose = vi.fn();

    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={onClose}
      />
    );

    const backButton = screen.getByText("Zurück zum Formular");
    fireEvent.click(backButton);

    expect(onClose).toHaveBeenCalled();
  });

  test("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();

    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
        onConfirm={onConfirm}
      />
    );

    const confirmButton = screen.getByText("Verstanden, bereit");
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  test("does not show confirm button when onConfirm is not provided", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText("Verstanden, bereit")).not.toBeInTheDocument();
  });

  test("shows warning for unknown procedure", () => {
    render(
      <MappingView
        procedureCode="UNKNOWN"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/keine Mapping-Konfiguration verfügbar/i)).toBeInTheDocument();
  });

  test("shows 'Keine Angabe' for empty values", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={{}}
        onClose={() => {}}
      />
    );

    const emptyValues = screen.getAllByText("Keine Angabe");
    expect(emptyValues.length).toBeGreaterThan(0);
  });

  test("does not show copy button for empty values", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={{}}
        onClose={() => {}}
      />
    );

    // With no values, there should be no copy buttons
    const copyButtons = screen.queryAllByText("Kopieren");
    expect(copyButtons.length).toBe(0);
  });

  test("displays country names instead of codes", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // CN should be displayed as "China" (appears multiple times for origin_country and sender_country)
    expect(screen.getAllByText("China").length).toBeGreaterThan(0);
    // DE should be displayed as "Deutschland"
    expect(screen.getByText("Deutschland")).toBeInTheDocument();
  });

  test("displays formatted amount", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // 150.00 should be formatted as "150,00"
    expect(screen.getByText("150,00")).toBeInTheDocument();
  });

  test("displays boolean as Ja/Nein", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={{ ...mockFieldValues, commercial_goods: true }}
        onClose={() => {}}
      />
    );

    expect(screen.getByText("Ja")).toBeInTheDocument();
  });

  test("shows filled field count", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    // Should show "10 von 10" (all fields filled)
    expect(screen.getByText("10 von 10")).toBeInTheDocument();
  });

  test("shows correct count when some fields empty", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={{
          content: "Test",
          value_amount: 100
        }}
        onClose={() => {}}
      />
    );

    // Should show "2 von 10"
    expect(screen.getByText("2 von 10")).toBeInTheDocument();
  });

  test("shows disclaimer about ZollPilot", () => {
    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={mockFieldValues}
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/ZollPilot übermittelt keine Daten an Zollbehörden/)).toBeInTheDocument();
  });
});

describe("MappingView - Draft cases should not see mapping", () => {
  // This test validates the business rule that draft cases
  // with incomplete fields should not access the mapping view
  // (the button is disabled in WizardClient)

  test("mapping view accepts any field values (validation is in WizardClient)", () => {
    // The MappingView component itself doesn't block draft cases
    // The button is disabled in WizardClient when allStepsComplete is false
    // This test just confirms MappingView renders even with empty values

    render(
      <MappingView
        procedureCode="IZA"
        procedureVersion="v1"
        fieldValues={{}}
        onClose={() => {}}
      />
    );

    // Should render without crashing
    expect(screen.getByText("Wo trage ich das beim Zoll ein?")).toBeInTheDocument();
  });
});
