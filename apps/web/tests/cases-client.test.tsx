/**
 * Tests für CasesClient – Fälle-Übersicht
 *
 * Testet:
 * - Rendering mehrerer Fälle
 * - Fortschrittsanzeige
 * - Inline-Titel-Bearbeitung
 * - Status-spezifische CTAs
 * - Leere Zustände
 * - Mandanten-Isolation (keine tenant_id in API-Calls)
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock API client
const mockCasesList = vi.fn();
const mockCasesGet = vi.fn();
const mockCasesPatch = vi.fn();
const mockCasesCreate = vi.fn();
const mockProceduresGet = vi.fn();

vi.mock("../src/app/lib/api/client", () => ({
  cases: {
    list: (...args: unknown[]) => mockCasesList(...args),
    get: (...args: unknown[]) => mockCasesGet(...args),
    patch: (...args: unknown[]) => mockCasesPatch(...args),
    create: (...args: unknown[]) => mockCasesCreate(...args),
  },
  procedures: {
    get: (...args: unknown[]) => mockProceduresGet(...args),
  },
}));

// Import after mocks
import { CasesClient } from "../src/app/app/cases/CasesClient";

// Mock data
const mockDraftCase = {
  id: "case-1",
  title: "Import China Q1",
  status: "DRAFT",
  created_at: "2026-01-20T10:00:00Z",
  updated_at: "2026-01-28T14:30:00Z",
};

const mockSubmittedCase = {
  id: "case-2",
  title: "Export USA Q4",
  status: "SUBMITTED",
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-25T15:00:00Z",
};

const mockArchivedCase = {
  id: "case-3",
  title: "Alter Fall 2025",
  status: "ARCHIVED",
  created_at: "2025-12-01T10:00:00Z",
  updated_at: "2025-12-20T15:00:00Z",
};

const mockCaseDetail = {
  ...mockDraftCase,
  version: 1,
  submitted_at: null,
  archived_at: null,
  procedure: { code: "IZA", name: "Import Zollanmeldung" },
  fields: [
    { key: "sender_name", value: "Test GmbH", updated_at: "2026-01-28T14:00:00Z" },
    { key: "sender_country", value: "DE", updated_at: "2026-01-28T14:00:00Z" },
  ],
};

const mockProcedure = {
  id: "proc-1",
  code: "IZA",
  name: "Import Zollanmeldung",
  version: "v1",
  is_active: true,
  steps: [
    {
      step_key: "sender",
      title: "Absender",
      order: 1,
      fields: [
        { field_key: "sender_name", field_type: "TEXT", required: true, config: null, order: 1 },
        { field_key: "sender_country", field_type: "COUNTRY", required: true, config: null, order: 2 },
      ],
    },
    {
      step_key: "recipient",
      title: "Empfänger",
      order: 2,
      fields: [
        { field_key: "recipient_name", field_type: "TEXT", required: true, config: null, order: 1 },
      ],
    },
    {
      step_key: "goods",
      title: "Waren",
      order: 3,
      fields: [
        { field_key: "goods_description", field_type: "TEXT", required: true, config: null, order: 1 },
      ],
    },
  ],
};

describe("CasesClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockCasesList.mockResolvedValue({ data: [] });
    mockCasesGet.mockResolvedValue({ data: mockCaseDetail });
    mockProceduresGet.mockResolvedValue({ data: mockProcedure });
  });

  describe("Rendering", () => {
    test("rendert Seitenüberschrift", () => {
      render(<CasesClient initialCases={[]} />);

      expect(screen.getByText("Fälle")).toBeInTheDocument();
      expect(screen.getByText("Verwalten Sie Ihre Zollanmeldungen")).toBeInTheDocument();
    });

    test("rendert Filter-Tabs", () => {
      render(<CasesClient initialCases={[]} />);

      expect(screen.getByText("Aktive Fälle")).toBeInTheDocument();
      expect(screen.getByText("Archiviert")).toBeInTheDocument();
    });

    test("rendert 'Neuen Fall erstellen' Button", () => {
      render(<CasesClient initialCases={[]} />);

      expect(screen.getByText("Neuen Fall erstellen")).toBeInTheDocument();
    });

    test("rendert mehrere Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase, mockSubmittedCase] });

      render(<CasesClient initialCases={[mockDraftCase, mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Import China Q1")).toBeInTheDocument();
      });
      expect(screen.getByText("Export USA Q4")).toBeInTheDocument();
    });
  });

  describe("Leere Zustände", () => {
    test("zeigt leeren Zustand bei keine Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [] });

      render(<CasesClient initialCases={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Keine Fälle gefunden")).toBeInTheDocument();
      });
      expect(screen.getByText(/Erstellen Sie Ihren ersten Fall/)).toBeInTheDocument();
    });

    test("zeigt 'Ersten Fall anlegen' Button bei leerem Zustand", async () => {
      mockCasesList.mockResolvedValue({ data: [] });

      render(<CasesClient initialCases={[]} />);

      await waitFor(() => {
        expect(screen.getByText("Ersten Fall anlegen")).toBeInTheDocument();
      });
    });

    test("zeigt Hinweis wenn nur abgeschlossene Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });

      render(<CasesClient initialCases={[mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText(/Alle Ihre Fälle sind abgeschlossen/)).toBeInTheDocument();
      });
    });
  });

  describe("Fall-Karten", () => {
    test("zeigt Fallback-Titel 'Unbenannter Fall'", async () => {
      const untitledCase = { ...mockDraftCase, title: "" };
      mockCasesList.mockResolvedValue({ data: [untitledCase] });

      render(<CasesClient initialCases={[untitledCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Unbenannter Fall")).toBeInTheDocument();
      });
    });

    test("zeigt Status-Badge für Entwurf", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Entwurf")).toBeInTheDocument();
      });
    });

    test("zeigt Status-Badge 'Bereit' für eingereichte Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });

      render(<CasesClient initialCases={[mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Bereit")).toBeInTheDocument();
      });
    });

    test("zeigt relative Zeitangabe", async () => {
      // Case updated recently
      const recentCase = {
        ...mockDraftCase,
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      };
      mockCasesList.mockResolvedValue({ data: [recentCase] });

      render(<CasesClient initialCases={[recentCase]} />);

      await waitFor(() => {
        expect(screen.getByText(/Vor \d+ Std\./)).toBeInTheDocument();
      });
    });
  });

  describe("CTAs", () => {
    test("zeigt 'Weiter ausfüllen' für Entwurf", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Weiter ausfüllen")).toBeInTheDocument();
      });
      const link = screen.getByText("Weiter ausfüllen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockDraftCase.id}/wizard`);
    });

    test("zeigt 'Zusammenfassung ansehen' für eingereichte Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });

      render(<CasesClient initialCases={[mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Zusammenfassung ansehen")).toBeInTheDocument();
      });
      const link = screen.getByText("Zusammenfassung ansehen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockSubmittedCase.id}/summary`);
    });

    test("zeigt 'Fall ansehen' für archivierte Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockArchivedCase] });

      render(<CasesClient initialCases={[mockArchivedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Fall ansehen")).toBeInTheDocument();
      });
      const link = screen.getByText("Fall ansehen").closest("a");
      expect(link).toHaveAttribute("href", `/app/cases/${mockArchivedCase.id}`);
    });
  });

  describe("Fortschrittsanzeige", () => {
    test("lädt Falldetails für Entwürfe", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(mockCasesGet).toHaveBeenCalledWith(mockDraftCase.id);
      });
    });

    test("zeigt Verfahrensname nach Laden", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(screen.getByText(/IZA – Import Zollanmeldung/)).toBeInTheDocument();
      });
    });

    test("zeigt Schrittfortschritt", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        // 1 of 3 steps completed (sender step has all required fields filled)
        expect(screen.getByText(/1 von 3 Schritten/)).toBeInTheDocument();
      });
    });
  });

  describe("Inline-Titel-Bearbeitung", () => {
    test("zeigt Edit-Button bei Hover für Entwürfe", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      // Wait for case to load, then check for edit button
      await waitFor(() => {
        expect(screen.getByText("Import China Q1")).toBeInTheDocument();
      });

      // Edit button exists (hidden until hover)
      const editBtn = screen.getByTitle("Titel bearbeiten");
      expect(editBtn).toBeInTheDocument();
    });

    test("öffnet Eingabefeld bei Klick auf Edit", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Import China Q1")).toBeInTheDocument();
      });

      const editBtn = screen.getByTitle("Titel bearbeiten");
      fireEvent.click(editBtn);

      expect(screen.getByPlaceholderText("Fallname eingeben...")).toBeInTheDocument();
    });

    test("speichert neuen Titel bei Enter", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });
      mockCasesPatch.mockResolvedValue({ data: { ...mockDraftCase, title: "Neuer Titel" } });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Import China Q1")).toBeInTheDocument();
      });

      const editBtn = screen.getByTitle("Titel bearbeiten");
      fireEvent.click(editBtn);

      const input = screen.getByPlaceholderText("Fallname eingeben...");
      fireEvent.change(input, { target: { value: "Neuer Titel" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      await waitFor(() => {
        expect(mockCasesPatch).toHaveBeenCalledWith(mockDraftCase.id, { title: "Neuer Titel" });
      });
    });

    test("zeigt keinen Edit-Button für eingereichte Fälle", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });

      render(<CasesClient initialCases={[mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Export USA Q4")).toBeInTheDocument();
      });

      expect(screen.queryByTitle("Titel bearbeiten")).not.toBeInTheDocument();
    });
  });

  describe("Mandanten-Isolation", () => {
    test("ruft API ohne explizite Tenant-ID auf", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase] });

      render(<CasesClient initialCases={[mockDraftCase]} />);

      // Initial call from useEffect
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

    test("übergibt keine Mandanten-Daten an Case-API", async () => {
      render(<CasesClient initialCases={[mockDraftCase]} />);

      await waitFor(() => {
        expect(mockCasesGet).toHaveBeenCalled();
      });

      // Only case ID should be passed, no tenant info
      expect(mockCasesGet).toHaveBeenCalledWith(mockDraftCase.id);
    });
  });

  describe("Wording Guide Compliance", () => {
    test("verwendet keine verbotenen Begriffe", async () => {
      mockCasesList.mockResolvedValue({ data: [mockDraftCase, mockSubmittedCase] });

      render(<CasesClient initialCases={[mockDraftCase, mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Import China Q1")).toBeInTheDocument();
      });

      const container = document.body;
      const text = container.textContent || "";

      // Verbotene Begriffe gemäß WORDING_GUIDE.md
      expect(text).not.toContain("amtlich");
      expect(text).not.toContain("offiziell");
      expect(text).not.toContain("ATLAS");
      expect(text).not.toContain("Zollbehörde");
      expect(text).not.toContain("bereit für den Zoll");
    });

    test("zeigt 'Bereit' statt 'Eingereicht' für SUBMITTED Status", async () => {
      mockCasesList.mockResolvedValue({ data: [mockSubmittedCase] });

      render(<CasesClient initialCases={[mockSubmittedCase]} />);

      await waitFor(() => {
        expect(screen.getByText("Export USA Q4")).toBeInTheDocument();
      });

      expect(screen.getByText("Bereit")).toBeInTheDocument();
      // "Eingereicht" might still appear in badges, but main display should be "Bereit"
    });
  });

  describe("Fall erstellen", () => {
    test("ruft API bei Klick auf 'Neuen Fall erstellen'", async () => {
      mockCasesCreate.mockResolvedValue({ data: { id: "new-case", title: "", status: "DRAFT" } });
      mockCasesList.mockResolvedValue({ data: [] });

      render(<CasesClient initialCases={[]} />);

      const createBtn = screen.getByText("Neuen Fall erstellen");
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockCasesCreate).toHaveBeenCalled();
      });
    });
  });
});

describe("CasesClient Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCasesList.mockResolvedValue({ data: [] });
  });

  test("hat korrekten Heading-Level", () => {
    render(<CasesClient initialCases={[]} />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  test("Buttons haben korrekten Typ", () => {
    render(<CasesClient initialCases={[]} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("type", "button");
    });
  });
});
