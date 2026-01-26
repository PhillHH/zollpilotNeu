/**
 * Tests für Admin UI (Tenants, Plans)
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

// Mock API client
vi.mock("../src/app/lib/api/client", () => ({
  admin: {
    tenants: {
      list: vi.fn(),
      ledger: vi.fn(),
      grantCredits: vi.fn(),
      setPlan: vi.fn(),
    },
    plans: {
      list: vi.fn(),
      create: vi.fn(),
      activate: vi.fn(),
      deactivate: vi.fn(),
    },
  },
}));

// Import components
import { AdminShell } from "../src/app/admin/components/AdminShell";
import { TenantsClient } from "../src/app/admin/tenants/TenantsClient";
import { PlansClient } from "../src/app/admin/plans/PlansClient";

describe("AdminShell", () => {
  test("rendert Header mit Titel", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(screen.getByText("Administration")).toBeInTheDocument();
  });

  test("rendert Navigation mit deutschen Labels", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Mandanten")).toBeInTheDocument();
    expect(screen.getByText("Tarife")).toBeInTheDocument();
  });

  test("rendert 'Zur App' Link", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(screen.getByText("← Zur App")).toBeInTheDocument();
  });

  test("rendert Footer mit Hinweis", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(
      screen.getByText(/Nur für autorisierte Benutzer/)
    ).toBeInTheDocument();
  });

  test("rendert Kinder korrekt", () => {
    render(
      <AdminShell>
        <div data-testid="admin-content">Admin Content</div>
      </AdminShell>
    );

    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });
});

describe("TenantsClient", () => {
  test("rendert Seitentitel", async () => {
    render(<TenantsClient />);

    // Warte auf Laden
    expect(
      await screen.findByText("Mandanten werden geladen...")
    ).toBeInTheDocument();
  });

  test("hat deutsche Beschreibung", async () => {
    render(<TenantsClient />);

    // Der Ladetext ist auf Deutsch
    expect(
      await screen.findByText("Mandanten werden geladen...")
    ).toBeInTheDocument();
  });
});

describe("PlansClient", () => {
  test("rendert Seitentitel", async () => {
    render(<PlansClient />);

    // Warte auf Laden
    expect(
      await screen.findByText("Tarife werden geladen...")
    ).toBeInTheDocument();
  });

  test("hat deutsche Beschreibung", async () => {
    render(<PlansClient />);

    // Der Ladetext ist auf Deutsch
    expect(
      await screen.findByText("Tarife werden geladen...")
    ).toBeInTheDocument();
  });
});

describe("Design System Integration in Admin", () => {
  test("AdminShell nutzt PageShell Struktur", () => {
    const { container } = render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    const pageShell = container.querySelector(".page-shell");
    expect(pageShell).toBeInTheDocument();
  });

  test("AdminShell hat Header und Footer", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("footer")).toBeInTheDocument();
  });
});

describe("Deutsche Texte in Admin UI", () => {
  test("AdminShell Navigation ist auf Deutsch", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    // Alle Navigationselemente auf Deutsch
    expect(screen.getByText("Übersicht")).toBeInTheDocument();
    expect(screen.getByText("Mandanten")).toBeInTheDocument();
    expect(screen.getByText("Tarife")).toBeInTheDocument();
    expect(screen.getByText("← Zur App")).toBeInTheDocument();
  });
});

describe("Accessibility", () => {
  test("AdminShell hat korrekten Dokumentstruktur", () => {
    render(
      <AdminShell>
        <div>Content</div>
      </AdminShell>
    );

    // Header und Footer sollten existieren
    expect(document.querySelector("header")).toBeInTheDocument();
    expect(document.querySelector("footer")).toBeInTheDocument();
    expect(document.querySelector("nav")).toBeInTheDocument();
  });
});

