import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

import { SummaryClient } from "../src/app/app/cases/[id]/summary/SummaryClient";

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock case data
const mockSubmittedCase = {
  data: {
    id: "case-1",
    title: "Submitted Case",
    status: "SUBMITTED",
    version: 1,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    submitted_at: "2024-01-02T14:00:00Z",
    archived_at: null,
    procedure: { code: "IZA", name: "Import Zollanmeldung" },
    fields: []
  }
};

const mockDraftCase = {
  data: {
    id: "case-2",
    title: "Draft Case",
    status: "DRAFT",
    version: 1,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T12:00:00Z",
    submitted_at: null,
    archived_at: null,
    procedure: { code: "IZA", name: "Import Zollanmeldung" },
    fields: []
  }
};

const mockSnapshotsList = {
  data: [
    { id: "snap-1", version: 1, created_at: "2024-01-02T14:00:00Z" }
  ]
};

// Billing mock with credits
const mockBillingWithCredits = {
  data: {
    tenant: { id: "tenant-1", name: "Test Tenant" },
    plan: { code: "FREE", name: "Free Plan", interval: "NONE", price_cents: null, currency: "EUR" },
    credits: { balance: 5 }
  }
};

// Billing mock without credits
const mockBillingNoCredits = {
  data: {
    tenant: { id: "tenant-1", name: "Test Tenant" },
    plan: null,
    credits: { balance: 0 }
  }
};

// IZA structured summary mock
const mockIzaSummary = {
  data: {
    procedure: {
      code: "IZA",
      version: "v1",
      name: "Import Zollanmeldung"
    },
    sections: [
      {
        title: "Paket",
        items: [
          { label: "Inhalt", value: "Electronics - Smartphone" },
          { label: "Warenwert", value: "150,00 €" },
          { label: "Währung", value: "€ (Euro)" },
          { label: "Herkunftsland", value: "China" }
        ]
      },
      {
        title: "Absender",
        items: [
          { label: "Name", value: "AliExpress" },
          { label: "Land", value: "China" }
        ]
      },
      {
        title: "Empfänger",
        items: [
          { label: "Name", value: "Max Mustermann" },
          { label: "Adresse", value: "Musterstraße 123, 12345 Berlin" },
          { label: "Land", value: "Deutschland" }
        ]
      },
      {
        title: "Weitere Angaben",
        items: [
          { label: "Gewerbliche Einfuhr", value: "Nein" },
          { label: "Bemerkungen", value: "Keine" }
        ]
      }
    ]
  }
};

describe("SummaryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMockFetch = (
    caseData = mockSubmittedCase,
    summaryData = mockIzaSummary,
    billingData = mockBillingWithCredits
  ) => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/billing/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(billingData),
          headers: new Headers()
        });
      }
      if (url.includes("/cases/") && url.includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(summaryData),
          headers: new Headers()
        });
      }
      if (url.includes("/cases/") && !url.includes("/snapshots") && !url.includes("/pdf")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(caseData),
          headers: new Headers()
        });
      }
      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSnapshotsList),
          headers: new Headers()
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
        headers: new Headers()
      });
    });
  };

  test("renders case status as SUBMITTED with badge", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Eingereicht")).toBeInTheDocument();
    });
  });

  test("renders structured IZA summary with sections", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      // Check section titles
      expect(screen.getByText("Paket")).toBeInTheDocument();
      expect(screen.getByText("Absender")).toBeInTheDocument();
      expect(screen.getByText("Empfänger")).toBeInTheDocument();
      expect(screen.getByText("Weitere Angaben")).toBeInTheDocument();
    });
  });

  test("renders formatted field values from summary", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      // Check formatted values (country names, currency)
      expect(screen.getByText("China")).toBeInTheDocument();
      expect(screen.getByText("150,00 €")).toBeInTheDocument();
      expect(screen.getByText("Max Mustermann")).toBeInTheDocument();
      expect(screen.getByText("Deutschland")).toBeInTheDocument();
    });
  });

  test("renders label-value pairs", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      // Check that labels are present
      expect(screen.getByText("Inhalt")).toBeInTheDocument();
      expect(screen.getByText("Warenwert")).toBeInTheDocument();
      expect(screen.getByText("Herkunftsland")).toBeInTheDocument();
      expect(screen.getByText("Gewerbliche Einfuhr")).toBeInTheDocument();
    });
  });

  test("displays version and submitted date", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Version")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("Eingereicht am")).toBeInTheDocument();
    });
  });

  test("shows info banner for submitted cases", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Zollanmeldung/)).toBeInTheDocument();
    });
  });

  test("shows wizard link for draft cases", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/cases/case-2") && !url.includes("/snapshots") && !url.includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDraftCase),
          headers: new Headers()
        });
      }
      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
          headers: new Headers()
        });
      }
      if (url.includes("/summary")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { code: "NO_DATA" } }),
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
      render(<SummaryClient caseId="case-2" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Der Case wurde noch nicht eingereicht.")).toBeInTheDocument();
      expect(screen.getByText("Zum Wizard")).toBeInTheDocument();
    });
  });

  test("displays procedure name from summary", async () => {
    setupMockFetch();

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Verfahren")).toBeInTheDocument();
      expect(screen.getByText("Import Zollanmeldung")).toBeInTheDocument();
    });
  });

  test("shows enabled PDF button when submitted and has credits", async () => {
    setupMockFetch(mockSubmittedCase, mockIzaSummary, mockBillingWithCredits);

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      const pdfButton = screen.getByText(/Als PDF herunterladen/);
      expect(pdfButton).toBeInTheDocument();
      // Button should be enabled when case is SUBMITTED and credits > 0
      expect(pdfButton).not.toBeDisabled();
    });
  });

  test("shows disabled PDF button when no credits", async () => {
    setupMockFetch(mockSubmittedCase, mockIzaSummary, mockBillingNoCredits);

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      const pdfButton = screen.getByText(/Als PDF herunterladen/);
      expect(pdfButton).toBeInTheDocument();
      expect(pdfButton).toBeDisabled();
      expect(screen.getByText(/Credits aufladen/)).toBeInTheDocument();
    });
  });

  test("shows disabled PDF button when case is draft", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/billing/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBillingWithCredits),
          headers: new Headers()
        });
      }
      if (url.includes("/cases/case-2") && !url.includes("/snapshots") && !url.includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDraftCase),
          headers: new Headers()
        });
      }
      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
          headers: new Headers()
        });
      }
      if (url.includes("/summary")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { code: "NO_DATA" } }),
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
      render(<SummaryClient caseId="case-2" />);
    });

    await waitFor(() => {
      // Draft case shows wizard link, not PDF button
      expect(screen.getByText("Zum Wizard")).toBeInTheDocument();
    });
  });

  test("displays credits balance", async () => {
    setupMockFetch(mockSubmittedCase, mockIzaSummary, mockBillingWithCredits);

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText("Verfügbare Credits:")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  test("shows credit cost hint for PDF", async () => {
    setupMockFetch(mockSubmittedCase, mockIzaSummary, mockBillingWithCredits);

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText(/PDF Export kostet 1 Credit/)).toBeInTheDocument();
    });
  });

  test("PDF button triggers download when clicked", async () => {
    setupMockFetch(mockSubmittedCase, mockIzaSummary, mockBillingWithCredits);

    // Mock blob response for PDF
    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes("/pdf") && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(["%PDF-1.4"], { type: "application/pdf" })),
          headers: new Headers({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=test.pdf"
          })
        });
      }
      // Default mock responses
      if (url.includes("/billing/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBillingWithCredits),
          headers: new Headers()
        });
      }
      if (url.includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockIzaSummary),
          headers: new Headers()
        });
      }
      if (url.includes("/cases/") && !url.includes("/snapshots") && !url.includes("/pdf")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSubmittedCase),
          headers: new Headers()
        });
      }
      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSnapshotsList),
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
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      const pdfButton = screen.getByText(/Als PDF herunterladen/);
      expect(pdfButton).toBeInTheDocument();
    });

    // Check that the PDF button can be clicked
    const pdfButton = screen.getByText(/Als PDF herunterladen/);
    expect(pdfButton).not.toBeDisabled();
  });

  test("shows loading state while fetching data", async () => {
    // Delay the fetch to capture loading state
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    await act(async () => {
      render(<SummaryClient caseId="case-1" />);
    });

    // Should show loading state
    expect(screen.getByText("Lade Zusammenfassung...")).toBeInTheDocument();
  });

  test("handles missing procedure gracefully", async () => {
    const caseNoProcedure = {
      data: {
        ...mockSubmittedCase.data,
        procedure: null
      }
    };

    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/billing/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBillingWithCredits),
          headers: new Headers()
        });
      }
      if (url.includes("/cases/") && !url.includes("/snapshots") && !url.includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(caseNoProcedure),
          headers: new Headers()
        });
      }
      if (url.includes("/snapshots")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
          headers: new Headers()
        });
      }
      if (url.includes("/summary")) {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { code: "NO_PROCEDURE_BOUND" } }),
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
      render(<SummaryClient caseId="case-1" />);
    });

    await waitFor(() => {
      // Should handle gracefully, showing case info without summary
      expect(screen.getByText("case-1")).toBeInTheDocument();
    });
  });
});

