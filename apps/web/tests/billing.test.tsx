import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/app/billing",
}));

// Define mock functions that will be used in the mock
const mockMe = vi.fn();
const mockHistory = vi.fn();

// Mock API client using the pre-defined mock functions
vi.mock("../src/app/lib/api/client", () => ({
  billing: {
    me: () => mockMe(),
    history: (limit?: number) => mockHistory(limit),
  },
  apiRequest: vi.fn(),
}));

import { BillingClient } from "../src/app/app/billing/BillingClient";

describe("BillingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBillingData = {
    tenant: {
      id: "tenant-123",
      name: "Test GmbH",
    },
    plan: {
      code: "BASIC",
      name: "Basis",
      interval: "MONTHLY",
      price_cents: 999,
      currency: "EUR",
    },
    credits: {
      balance: 10,
    },
  };

  const mockHistoryData = [
    {
      id: "entry-1",
      delta: 10,
      reason: "ADMIN_GRANT",
      case_title: null,
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "entry-2",
      delta: -1,
      reason: "PDF_EXPORT",
      case_title: "Import aus China",
      created_at: "2024-01-16T14:30:00Z",
    },
  ];

  test("shows loading state initially", () => {
    mockMe.mockReturnValue(new Promise(() => {}));
    mockHistory.mockReturnValue(new Promise(() => {}));

    render(<BillingClient />);

    expect(screen.getByText(/Lade Abrechnungsdaten/i)).toBeInTheDocument();
  });

  test("renders billing page with credit balance", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Abrechnung")).toBeInTheDocument();
    });

    // Check credit balance is displayed
    expect(screen.getByText("10")).toBeInTheDocument();
    // "Credits" appears multiple times (balance unit + history header)
    expect(screen.getAllByText("Credits").length).toBeGreaterThan(0);
    expect(screen.getByText("Ein Credit entspricht einer Ausfüllhilfe.")).toBeInTheDocument();
  });

  test("renders plan information when available", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Aktueller Tarif")).toBeInTheDocument();
    });

    expect(screen.getByText("Basis")).toBeInTheDocument();
    expect(screen.getByText("BASIC")).toBeInTheDocument();
  });

  test("does not render plan card when no plan", async () => {
    const dataWithoutPlan = { ...mockBillingData, plan: null };
    mockMe.mockResolvedValue({ data: dataWithoutPlan });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Abrechnung")).toBeInTheDocument();
    });

    expect(screen.queryByText("Aktueller Tarif")).not.toBeInTheDocument();
  });

  test("shows error when loading fails", async () => {
    mockMe.mockRejectedValue(new Error("Network error"));
    mockHistory.mockRejectedValue(new Error("Network error"));

    render(<BillingClient />);

    await waitFor(() => {
      // Error message comes from err.message when err is an Error instance
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  test("renders price comparison section", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Kostenvergleich")).toBeInTheDocument();
    });

    // Check ZollPilot price
    expect(screen.getByText("ab 1,49 EUR")).toBeInTheDocument();
    // Check competitor prices
    expect(screen.getByText("6 - 15 EUR")).toBeInTheDocument();
    // Check disclaimer
    expect(
      screen.getByText(/ZollPilot erstellt Ausfüllhilfen zur Vorbereitung/i)
    ).toBeInTheDocument();
  });

  test("toggles price info section", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Preise anzeigen")).toBeInTheDocument();
    });

    // Price info should not be visible initially
    expect(screen.queryByText("Preisübersicht")).not.toBeInTheDocument();

    // Click to show prices
    fireEvent.click(screen.getByText("Preise anzeigen"));

    // Price info should now be visible
    expect(screen.getByText("Preisübersicht")).toBeInTheDocument();
    expect(screen.getByText("IZA Ausfüllhilfe")).toBeInTheDocument();
    expect(screen.getByText("1,49 EUR")).toBeInTheDocument();
    expect(screen.getByText("IZA Premium Ausfüllhilfe")).toBeInTheDocument();
    expect(screen.getByText("2,99 EUR")).toBeInTheDocument();

    // Click to hide prices
    fireEvent.click(screen.getByText("Preise ausblenden"));

    // Price info should be hidden again
    expect(screen.queryByText("Preisübersicht")).not.toBeInTheDocument();
  });

  test("renders credit history with entries", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Credit-Historie")).toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText("Datum")).toBeInTheDocument();
    expect(screen.getByText("Aktion")).toBeInTheDocument();
    expect(screen.getByText("Bezug")).toBeInTheDocument();

    // Check translated reasons
    expect(screen.getByText("Gutschrift")).toBeInTheDocument();
    expect(screen.getByText("Ausfüllhilfe exportiert")).toBeInTheDocument();

    // Check case title
    expect(screen.getByText("Import aus China")).toBeInTheDocument();

    // Check delta values
    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  test("shows empty state when no history", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: [] });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Credit-Historie")).toBeInTheDocument();
    });

    expect(screen.getByText("Noch keine Transaktionen vorhanden.")).toBeInTheDocument();
  });

  test("shows buy credits button (stub)", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    // Mock window.alert
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Credits kaufen")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Credits kaufen"));
    expect(alertMock).toHaveBeenCalledWith("Credits kaufen wird bald verfügbar sein.");

    alertMock.mockRestore();
  });

  test("displays credit hint explaining value", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(
        screen.getByText("Ein Credit entspricht einer Ausfüllhilfe.")
      ).toBeInTheDocument();
    });
  });

  test("handles tenant isolation (only loads own data)", async () => {
    mockMe.mockResolvedValue({ data: mockBillingData });
    mockHistory.mockResolvedValue({ data: mockHistoryData });

    render(<BillingClient />);

    await waitFor(() => {
      expect(screen.getByText("Abrechnung")).toBeInTheDocument();
    });

    // Verify API was called (tenant-scoped by session)
    expect(mockMe).toHaveBeenCalledTimes(1);
    expect(mockHistory).toHaveBeenCalledTimes(1);
    expect(mockHistory).toHaveBeenCalledWith(20);
  });
});
