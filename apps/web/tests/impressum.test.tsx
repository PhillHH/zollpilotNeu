/**
 * Tests für die Impressum-Seite
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/impressum",
}));

// Wir testen den Inhalt über den direkten Import der Seite
// Da es sich um eine Server Component handelt, testen wir den gerenderten Inhalt

describe("Impressum", () => {
  test("enthält Unternehmensangaben", async () => {
    // Dynamischer Import um Mock zu respektieren
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    // Firmenname
    expect(screen.getByText(/Growento UG/)).toBeInTheDocument();

    // Geschäftsführer (kommt mehrfach vor: als Vertreter und Verantwortlicher)
    const phillipElements = screen.getAllByText(/Phillip Rugullis/);
    expect(phillipElements.length).toBeGreaterThanOrEqual(1);

    // Standort (kommt mehrfach vor)
    const hamburgElements = screen.getAllByText(/Hamburg/);
    expect(hamburgElements.length).toBeGreaterThanOrEqual(1);
  });

  test("hat H1-Überschrift 'Impressum'", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Impressum");
  });

  test("enthält Kontaktinformationen", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    // E-Mail
    expect(screen.getByText(/info@zollpilot.de/)).toBeInTheDocument();
  });

  test("enthält § 5 TMG Angaben", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    expect(screen.getByText(/Angaben gemäß § 5 TMG/)).toBeInTheDocument();
  });

  test("enthält Verantwortlich für den Inhalt", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    expect(screen.getByText(/Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV/)).toBeInTheDocument();
  });

  test("enthält EU-Streitschlichtung Link", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    expect(screen.getByText("EU-Streitschlichtung")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /ec.europa.eu/ });
    expect(link).toHaveAttribute("href", "https://ec.europa.eu/consumers/odr/");
  });

  test("enthält ZollPilot Disclaimer", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    // Der Disclaimer muss den WORDING_GUIDE entsprechen
    // Kommt mehrfach vor: im Footer und im Impressum-Inhalt
    const disclaimerElements = screen.getAllByText(/ZollPilot bereitet Zollanmeldungen vor/);
    expect(disclaimerElements.length).toBeGreaterThanOrEqual(1);
  });

  test("enthält Haftungsausschluss", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    expect(screen.getByText("Haftungsausschluss")).toBeInTheDocument();
  });

  test("enthält Verbraucherstreitbeilegung", async () => {
    const { default: ImpressumPage } = await import("../src/app/impressum/page");

    render(<ImpressumPage />);

    expect(screen.getByText("Verbraucherstreitbeilegung")).toBeInTheDocument();
  });
});

describe("Impressum Metadata", () => {
  test("hat korrekten Titel", async () => {
    const { metadata } = await import("../src/app/impressum/page");

    expect(metadata.title).toBe("Impressum – ZollPilot");
  });

  test("hat Beschreibung", async () => {
    const { metadata } = await import("../src/app/impressum/page");

    expect(metadata.description).toContain("Impressum");
  });

  test("ist indexierbar", async () => {
    const { metadata } = await import("../src/app/impressum/page");

    // robots: { index: true, follow: true }
    expect((metadata.robots as { index: boolean }).index).toBe(true);
  });
});
