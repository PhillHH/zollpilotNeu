/**
 * Tests für öffentliche Seiten (Landing, Blog, FAQ)
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Komponenten importieren
import { BlogIndexClient } from "../src/app/blog/BlogIndexClient";
import { FaqIndexClient } from "../src/app/faq/FaqIndexClient";
import { BlogPostClient } from "../src/app/blog/[slug]/BlogPostClient";
import { FaqEntryClient } from "../src/app/faq/[slug]/FaqEntryClient";

// Mock-Daten
const mockBlogPosts = [
  {
    meta: {
      title: "Test-Artikel",
      description: "Eine Beschreibung des Artikels",
      slug: "test-artikel",
      published_at: "2026-01-15",
      tags: ["Zoll", "Import"],
    },
  },
  {
    meta: {
      title: "Zweiter Artikel",
      description: "Weitere Beschreibung",
      slug: "zweiter-artikel",
      published_at: "2026-01-10",
      tags: [],
    },
  },
];

const mockFaqByCategory = {
  Allgemein: [
    {
      meta: {
        title: "Was ist ZollPilot?",
        description: "Eine kurze Antwort",
        slug: "was-ist-zollpilot",
        published_at: "2026-01-01",
        category: "Allgemein",
      },
    },
  ],
  Kosten: [
    {
      meta: {
        title: "Welche Kosten fallen an?",
        description: "Preisübersicht",
        slug: "kosten",
        published_at: "2026-01-01",
        category: "Kosten",
      },
    },
  ],
};

describe("Blog Index", () => {
  test("rendert Überschrift und Intro", () => {
    render(<BlogIndexClient posts={mockBlogPosts} />);
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(
      screen.getByText(/Aktuelle Artikel und Anleitungen/)
    ).toBeInTheDocument();
  });

  test("rendert Blog-Artikel", () => {
    render(<BlogIndexClient posts={mockBlogPosts} />);
    expect(screen.getByText("Test-Artikel")).toBeInTheDocument();
    expect(screen.getByText("Zweiter Artikel")).toBeInTheDocument();
  });

  test("rendert Tags als Badges", () => {
    render(<BlogIndexClient posts={mockBlogPosts} />);
    expect(screen.getByText("Zoll")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
  });

  test("zeigt leeren State wenn keine Posts", () => {
    render(<BlogIndexClient posts={[]} />);
    expect(screen.getByText("Noch keine Artikel vorhanden.")).toBeInTheDocument();
  });

  test("zeigt Datum formatiert auf Deutsch", () => {
    render(<BlogIndexClient posts={mockBlogPosts} />);
    expect(screen.getByText("15. Januar 2026")).toBeInTheDocument();
  });
});

describe("Blog Post Detail", () => {
  const mockMeta = {
    title: "Ausführlicher Artikel",
    description: "Beschreibung",
    slug: "ausfuehrlicher-artikel",
    published_at: "2026-01-20",
    tags: ["Einfuhr"],
  };

  test("rendert Titel", () => {
    render(
      <BlogPostClient meta={mockMeta}>
        <p>Artikelinhalt</p>
      </BlogPostClient>
    );
    expect(screen.getByText("Ausführlicher Artikel")).toBeInTheDocument();
  });

  test("rendert MDX-Inhalt", () => {
    render(
      <BlogPostClient meta={mockMeta}>
        <p>Artikelinhalt hier</p>
      </BlogPostClient>
    );
    expect(screen.getByText("Artikelinhalt hier")).toBeInTheDocument();
  });

  test("rendert Zurück-Link", () => {
    render(
      <BlogPostClient meta={mockMeta}>
        <p>Inhalt</p>
      </BlogPostClient>
    );
    expect(screen.getByText("← Zurück zum Blog")).toBeInTheDocument();
  });

  test("rendert Tags", () => {
    render(
      <BlogPostClient meta={mockMeta}>
        <p>Inhalt</p>
      </BlogPostClient>
    );
    expect(screen.getByText("Einfuhr")).toBeInTheDocument();
  });
});

describe("FAQ Index", () => {
  test("rendert Überschrift", () => {
    render(<FaqIndexClient faqByCategory={mockFaqByCategory} />);
    expect(screen.getByText("Häufig gestellte Fragen")).toBeInTheDocument();
  });

  test("rendert Kategorien", () => {
    render(<FaqIndexClient faqByCategory={mockFaqByCategory} />);
    expect(screen.getByText("Allgemein")).toBeInTheDocument();
    expect(screen.getByText("Kosten")).toBeInTheDocument();
  });

  test("rendert FAQ-Einträge", () => {
    render(<FaqIndexClient faqByCategory={mockFaqByCategory} />);
    expect(screen.getByText("Was ist ZollPilot?")).toBeInTheDocument();
    expect(screen.getByText("Welche Kosten fallen an?")).toBeInTheDocument();
  });

  test("zeigt leeren State wenn keine FAQs", () => {
    render(<FaqIndexClient faqByCategory={{}} />);
    expect(
      screen.getByText("Noch keine FAQ-Einträge vorhanden.")
    ).toBeInTheDocument();
  });

  test("zeigt 'Antwort lesen' Links", () => {
    render(<FaqIndexClient faqByCategory={mockFaqByCategory} />);
    const links = screen.getAllByText("Antwort lesen →");
    expect(links.length).toBe(2);
  });
});

describe("FAQ Entry Detail", () => {
  const mockMeta = {
    title: "Was kostet die Nutzung?",
    description: "Preisübersicht",
    slug: "kosten",
    published_at: "2026-01-01",
    category: "Kosten",
  };

  test("rendert Titel", () => {
    render(
      <FaqEntryClient meta={mockMeta}>
        <p>Antwort auf die Frage</p>
      </FaqEntryClient>
    );
    expect(screen.getByText("Was kostet die Nutzung?")).toBeInTheDocument();
  });

  test("rendert Kategorie als Badge", () => {
    render(
      <FaqEntryClient meta={mockMeta}>
        <p>Antwort</p>
      </FaqEntryClient>
    );
    expect(screen.getByText("Kosten")).toBeInTheDocument();
  });

  test("rendert MDX-Inhalt", () => {
    render(
      <FaqEntryClient meta={mockMeta}>
        <p>Detaillierte Antwort hier</p>
      </FaqEntryClient>
    );
    expect(screen.getByText("Detaillierte Antwort hier")).toBeInTheDocument();
  });

  test("rendert Zurück-Links", () => {
    render(
      <FaqEntryClient meta={mockMeta}>
        <p>Inhalt</p>
      </FaqEntryClient>
    );
    expect(screen.getByText("← Zurück zu FAQ")).toBeInTheDocument();
    expect(screen.getByText("← Alle FAQ anzeigen")).toBeInTheDocument();
  });
});

describe("Public Pages nutzen Design System", () => {
  test("BlogIndexClient verwendet Section", () => {
    const { container } = render(<BlogIndexClient posts={mockBlogPosts} />);
    const section = container.querySelector(".blog-index");
    expect(section).toBeInTheDocument();
  });

  test("FaqIndexClient verwendet Section", () => {
    const { container } = render(
      <FaqIndexClient faqByCategory={mockFaqByCategory} />
    );
    const section = container.querySelector(".faq-index");
    expect(section).toBeInTheDocument();
  });

  test("Blog-Einträge nutzen Card-Komponente", () => {
    const { container } = render(<BlogIndexClient posts={mockBlogPosts} />);
    const cards = container.querySelectorAll(".post-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  test("FAQ-Einträge nutzen Card-Komponente", () => {
    const { container } = render(
      <FaqIndexClient faqByCategory={mockFaqByCategory} />
    );
    const cards = container.querySelectorAll(".faq-card");
    expect(cards.length).toBeGreaterThan(0);
  });
});

