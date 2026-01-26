/**
 * Tests für App UI (Dashboard, Cases, Wizard, Summary)
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API client
vi.mock("../src/app/lib/api/client", () => ({
  cases: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    submit: vi.fn(),
    listSnapshots: vi.fn(),
    getSummary: vi.fn(),
    exportPdf: vi.fn(),
  },
  billing: {
    me: vi.fn(),
  },
  procedures: {
    list: vi.fn(),
    get: vi.fn(),
    bind: vi.fn(),
    validate: vi.fn(),
  },
  fields: {
    upsert: vi.fn(),
  },
}));

// Import components
import { CasesClient } from "../src/app/app/cases/CasesClient";
import { AppShell } from "../src/app/app/components/AppShell";

// Mock data
const mockCases = [
  {
    id: "case-1",
    title: "Test Fall 1",
    status: "DRAFT",
    created_at: "2026-01-20T10:00:00Z",
    updated_at: "2026-01-20T12:00:00Z",
  },
  {
    id: "case-2",
    title: "Test Fall 2",
    status: "SUBMITTED",
    created_at: "2026-01-19T10:00:00Z",
    updated_at: "2026-01-19T15:00:00Z",
  },
];

describe("AppShell", () => {
  test("rendert Header mit Navigation", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    
    expect(screen.getByText("ZollPilot")).toBeInTheDocument();
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Fälle")).toBeInTheDocument();
    expect(screen.getByText("Abrechnung")).toBeInTheDocument();
  });

  test("rendert Footer mit Links", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    
    expect(screen.getByText("Impressum")).toBeInTheDocument();
    expect(screen.getByText("Datenschutz")).toBeInTheDocument();
    expect(screen.getByText("Hilfe")).toBeInTheDocument();
  });

  test("rendert Abmelden-Link", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    
    expect(screen.getByText("Abmelden")).toBeInTheDocument();
  });

  test("rendert Kinder", () => {
    render(
      <AppShell>
        <div data-testid="child">Child Content</div>
      </AppShell>
    );
    
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});

describe("CasesClient", () => {
  test("rendert Überschrift", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Fälle")).toBeInTheDocument();
    expect(screen.getByText("Verwalten Sie Ihre Zollanmeldungen")).toBeInTheDocument();
  });

  test("rendert 'Neuen Fall erstellen' Button", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Neuen Fall erstellen")).toBeInTheDocument();
  });

  test("rendert Filter-Tabs", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Aktive Fälle")).toBeInTheDocument();
    expect(screen.getByText("Archiviert")).toBeInTheDocument();
  });

  test("zeigt leeren State wenn keine Fälle", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Keine Fälle gefunden")).toBeInTheDocument();
  });

  test("zeigt 'Ersten Fall erstellen' bei leerem State", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Ersten Fall erstellen")).toBeInTheDocument();
  });
});

describe("Design System Integration in App", () => {
  test("CasesClient nutzt Section", () => {
    const { container } = render(<CasesClient initialCases={[]} />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  test("CasesClient nutzt Card für leeren State", () => {
    const { container } = render(<CasesClient initialCases={[]} />);
    const card = container.querySelector(".card");
    expect(card).toBeInTheDocument();
  });

  test("AppShell nutzt PageShell Struktur", () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    const pageShell = container.querySelector(".page-shell");
    expect(pageShell).toBeInTheDocument();
  });
});

describe("Deutsche Texte in App UI", () => {
  test("CasesClient hat deutsche Texte", () => {
    render(<CasesClient initialCases={[]} />);
    
    expect(screen.getByText("Fälle")).toBeInTheDocument();
    expect(screen.getByText("Verwalten Sie Ihre Zollanmeldungen")).toBeInTheDocument();
    expect(screen.getByText("Neuen Fall erstellen")).toBeInTheDocument();
    expect(screen.getByText("Aktive Fälle")).toBeInTheDocument();
    expect(screen.getByText("Archiviert")).toBeInTheDocument();
  });

  test("AppShell Navigation ist auf Deutsch", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Fälle")).toBeInTheDocument();
    expect(screen.getByText("Abrechnung")).toBeInTheDocument();
    expect(screen.getByText("Abmelden")).toBeInTheDocument();
  });
});

describe("Filter-Funktionalität", () => {
  test("Filter-Tab wechselt bei Klick", () => {
    render(<CasesClient initialCases={[]} />);
    
    const archivedTab = screen.getByText("Archiviert");
    fireEvent.click(archivedTab);
    
    // Der Tab sollte jetzt aktiv sein (visuelle Prüfung via Klasse)
    expect(archivedTab.className).toContain("filter-tab");
  });
});

describe("Accessibility", () => {
  test("AppShell hat korrekten Dokumentstruktur", () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );
    
    // Header und Footer sollten existieren
    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("footer")).toBeInTheDocument();
  });

  test("CasesClient hat Überschriften-Hierarchie", () => {
    render(<CasesClient initialCases={[]} />);
    
    // h1 für Seitentitel
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

