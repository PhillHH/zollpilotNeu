/**
 * Tests für Dashboard-Seite (/app)
 *
 * Testet:
 * - Dashboard-Cards (Aktive Fälle, Credits, Letzter Fortschritt)
 * - Aktive-Fälle-Sektion
 * - Leere Zustände
 * - CTA-Routing
 * - Wording (keine Behördensprache)
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock API client
const mockCasesList = vi.fn();
const mockCasesGet = vi.fn();
const mockBillingMe = vi.fn();
const mockProceduresGet = vi.fn();

vi.mock("../src/app/lib/api/client", () => ({
  cases: {
    list: (...args: unknown[]) => mockCasesList(...args),
    get: (...args: unknown[]) => mockCasesGet(...args),
    create: vi.fn(),
    submit: vi.fn(),
    listSnapshots: vi.fn(),
    getSummary: vi.fn(),
    exportPdf: vi.fn(),
  },
  billing: {
    me: (...args: unknown[]) => mockBillingMe(...args),
  },
  procedures: {
    list: vi.fn(),
    get: (...args: unknown[]) => mockProceduresGet(...args),
    bind: vi.fn(),
    validate: vi.fn(),
  },
  fields: {
    upsert: vi.fn(),
  },
}));

// Import after mocks
import AppDashboard from "../src/app/app/page";

// Mock data
const mockDraftCase = {
  id: "case-draft-1",
  title: "Mein Import",
  status: "DRAFT",
  created_at: "2026-01-28T10:00:00Z",
  updated_at: "2026-01-29T14:30:00Z",
};

const mockSubmittedCase = {
  id: "case-submitted-1",
  title: "China Import Q4",
  status: "SUBMITTED",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-20T15:00:00Z",
};

const mockDraftCaseDetail = {
  ...mockDraftCase,
  version: 1,
  submitted_at: null,
  archived_at: null,
  procedure: { code: "IZA", name: "Import Zollanmeldung" },
  fields: [],
};

const mockProcedure = {
  id: "proc-1",
  code: "IZA",
  name: "Import Zollanmeldung",
  version: "v1",
  is_active: true,
  steps: [
    { step_key: "package", title: "Paket", order: 1, fields: [] },
    { step_key: "sender", title: "Absender", order: 2, fields: [] },
    { step_key: "recipient", title: "Empfänger", order: 3, fields: [] },
    { step_key: "additional", title: "Zusatzinfo", order: 4, fields: [] },
  ],
};

const mockBillingInfo = {
  tenant: { id: "tenant-1", name: "Test Firma" },
  plan: { code: "FREE", name: "Free", interval: "NONE", price_cents: 0, currency: "EUR" },
  credits: { balance: 10 },
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("zeigt Lade-Zustand", () => {
    mockCasesList.mockImplementation(() => new Promise(() => {})); // Never resolves
    mockBillingMe.mockImplementation(() => new Promise(() => {}));

    render(<AppDashboard />);

    expect(screen.getByText("Laden...")).toBeInTheDocument();
  });

  test("rendert Dashboard-Header", async () => {
    mockCasesList.mockResolvedValue({ data: [] });
    mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

    render(<AppDashboard />);

    await waitFor(() => {
      expect(screen.getByText("Übersicht")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Ihr Dashboard für die Vorbereitung von Zollanmeldungen.")
    ).toBeInTheDocument();
  });

  describe("Aktive Fälle Card", () => {
    test("zeigt Anzahl der Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase, mockSubmittedCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });

      expect(screen.getByText("Fälle")).toBeInTheDocument();
    });

    test("zeigt Breakdown Entwürfe und Abgeschlossene", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase, mockSubmittedCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("1 Entwürfe")).toBeInTheDocument();
      });

      expect(screen.getByText("1 Abgeschlossen")).toBeInTheDocument();
    });

    test("zeigt CTA 'Fälle anzeigen'", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Fälle anzeigen")).toBeInTheDocument();
      });

      const link = screen.getByText("Fälle anzeigen").closest("a");
      expect(link).toHaveAttribute("href", "/app/cases");
    });
  });

  describe("Credits Card", () => {
    test("zeigt Credit-Guthaben", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });

      expect(screen.getByText("verfügbar")).toBeInTheDocument();
    });

    test("zeigt Warnung bei 0 Credits", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({
        data: { ...mockBillingInfo, credits: { balance: 0 } },
      });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Credits werden für den PDF-Export benötigt.")
        ).toBeInTheDocument();
      });
    });

    test("zeigt CTA 'Kosten anzeigen'", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Kosten anzeigen")).toBeInTheDocument();
      });

      const link = screen.getByText("Kosten anzeigen").closest("a");
      expect(link).toHaveAttribute("href", "/app/billing");
    });
  });

  describe("Letzter Fortschritt Card", () => {
    test("zeigt letzen Entwurf mit Titel", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        // Text appears in progress card and cases list
        const titles = screen.getAllByText("Mein Import");
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });
    });

    test("zeigt Verfahrensname mit Schrittanzahl", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Import Zollanmeldung/)).toBeInTheDocument();
      });

      expect(screen.getByText(/4 Schritte/)).toBeInTheDocument();
    });

    test("zeigt CTA 'Fall fortsetzen'", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Fall fortsetzen")).toBeInTheDocument();
      });

      const link = screen.getByText("Fall fortsetzen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockDraftCase.id}/wizard`);
    });

    test("zeigt 'Neuer Fall' Card wenn kein Entwurf", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Neuen Fall erstellen")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Starten Sie mit der Vorbereitung Ihrer Zollanmeldung.")
      ).toBeInTheDocument();
    });
  });

  describe("Aktive-Fälle-Sektion", () => {
    test("zeigt max 3 Fälle", async () => {
      const manyCases = [
        mockDraftCase,
        mockSubmittedCase,
        { ...mockDraftCase, id: "case-3", title: "Fall 3" },
        { ...mockDraftCase, id: "case-4", title: "Fall 4" },
        { ...mockDraftCase, id: "case-5", title: "Fall 5" },
      ];
      mockCasesList.mockResolvedValue({ data: manyCases });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        // Text may appear multiple times (progress card + cases list)
        const titles = screen.getAllByText("Mein Import");
        expect(titles.length).toBeGreaterThanOrEqual(1);
      });

      // Should show "Alle anzeigen (5)" link
      expect(screen.getByText(/Alle anzeigen \(5\)/)).toBeInTheDocument();
    });

    test("zeigt korrekten CTA für Entwurf", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Weiter ausfüllen")).toBeInTheDocument();
      });

      const link = screen.getByText("Weiter ausfüllen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockDraftCase.id}/wizard`);
    });

    test("zeigt korrekten CTA für eingereichten Fall", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Zusammenfassung ansehen")).toBeInTheDocument();
      });

      const link = screen.getByText("Zusammenfassung ansehen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockSubmittedCase.id}/summary`);
    });

    test("zeigt Fallback-Titel 'Unbenannter Fall'", async () => {
      const untitledCase = { ...mockDraftCase, title: "" };
      mockCasesList.mockResolvedValue({ data: [untitledCase] });
      mockCasesGet.mockResolvedValue({
        data: { ...mockDraftCaseDetail, title: "" },
      });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        // Should appear twice: once in progress card, once in cases list
        const unnamedCases = screen.getAllByText("Unbenannter Fall");
        expect(unnamedCases.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Leere Zustände", () => {
    test("zeigt leeren Zustand bei keine Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Noch keine Fälle vorhanden")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Erstellen Sie Ihren ersten Fall/)
      ).toBeInTheDocument();
    });

    test("zeigt Credit-Hinweis bei 0 Credits und eingereichten Fällen", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });
      mockBillingMe.mockResolvedValue({
        data: { ...mockBillingInfo, credits: { balance: 0 } },
      });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Keine Credits vorhanden/)).toBeInTheDocument();
      });

      expect(screen.getByText("Zu Kosten & Credits")).toBeInTheDocument();
    });
  });

  describe("Wording Guide Compliance", () => {
    test("verwendet keine verbotenen Begriffe", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase, mockSubmittedCase] });
      mockCasesGet.mockResolvedValue({ data: mockDraftCaseDetail });
      mockProceduresGet.mockResolvedValue({ data: mockProcedure });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      const { container } = render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Übersicht")).toBeInTheDocument();
      });

      const text = container.textContent || "";

      // Verbotene Begriffe gemäß WORDING_GUIDE.md
      expect(text).not.toContain("amtlich");
      expect(text).not.toContain("offiziell");
      expect(text).not.toContain("ATLAS");
      expect(text).not.toContain("Zollbehörde");
      expect(text).not.toContain("bereit für den Zoll");
    });

    test("verwendet 'Vorbereitung' statt 'Einreichen'", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      const { container } = render(<AppDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Übersicht")).toBeInTheDocument();
      });

      const text = container.textContent || "";
      expect(text).toContain("Vorbereitung");
    });
  });

  describe("Fehlerbehandlung", () => {
    test("zeigt Fehlermeldung bei API-Fehler", async () => {
      mockCasesList.mockRejectedValue(new Error("Network error"));
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Daten konnten nicht geladen werden.")
        ).toBeInTheDocument();
      });
    });

    test("zeigt Credits-Fehlermeldung wenn Billing fehlschlägt", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockRejectedValue(new Error("Billing error"));

      render(<AppDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("Credits konnten nicht geladen werden.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Multi-Tenant Scoping", () => {
    test("ruft API ohne explizite Tenant-ID auf", async () => {
      mockCasesList.mockResolvedValue({ data: [] });
      mockBillingMe.mockResolvedValue({ data: mockBillingInfo });

      render(<AppDashboard />);

      await waitFor(() => {
        expect(mockCasesList).toHaveBeenCalledWith("active");
      });

      // API sollte ohne tenant_id Parameter aufgerufen werden
      // Tenant-Scoping erfolgt serverseitig über Session
      expect(mockCasesList).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tenant_id: expect.anything() })
      );
    });
  });
});

describe("Dashboard Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCasesList.mockResolvedValue({ data: [] });
    mockBillingMe.mockResolvedValue({ data: mockBillingInfo });
  });

  test("hat korrekten Heading-Level", async () => {
    render(<AppDashboard />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  test("hat Section für Fälle-Liste", async () => {
    render(<AppDashboard />);

    await waitFor(() => {
      const section = document.querySelector("section.cases-section");
      expect(section).toBeInTheDocument();
    });
  });
});
