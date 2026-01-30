import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  notFound: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock MDXRemote
vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source.substring(0, 50)}...</div>
  ),
}));

// Import components
import { PublicLayout } from "../src/app/components/PublicLayout";
import { BlogIndexClient } from "../src/app/blog/BlogIndexClient";
import { BlogPostClient } from "../src/app/blog/[slug]/BlogPostClient";
import { FaqIndexClient } from "../src/app/faq/FaqIndexClient";
import type {
  BlogPostListItem,
  BlogPostDetail,
  FaqCategory,
} from "../src/app/lib/api/client";

describe("Content System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PublicLayout", () => {
    test("renders navigation with Blog and FAQ links", () => {
      render(
        <PublicLayout>
          <div>Content</div>
        </PublicLayout>
      );

      expect(screen.getByText("ZollPilot")).toBeInTheDocument();
      expect(screen.getByText("Blog")).toBeInTheDocument();
      expect(screen.getByText("FAQ")).toBeInTheDocument();
      expect(screen.getByText("Zur App")).toBeInTheDocument();
    });

    test("renders footer with legal links", () => {
      render(
        <PublicLayout>
          <div>Content</div>
        </PublicLayout>
      );

      expect(screen.getByText("Impressum")).toBeInTheDocument();
      expect(screen.getByText("Datenschutz")).toBeInTheDocument();
    });

    test("renders children content", () => {
      render(
        <PublicLayout>
          <div data-testid="child">Child Content</div>
        </PublicLayout>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Child Content")).toBeInTheDocument();
    });
  });

  describe("BlogIndexClient", () => {
    const mockPosts: BlogPostListItem[] = [
      {
        id: "1",
        title: "First Blog Post",
        slug: "first-post",
        excerpt: "This is the first post excerpt",
        published_at: "2026-01-15T12:00:00Z",
        meta_title: null,
        meta_description: null,
      },
      {
        id: "2",
        title: "Second Blog Post",
        slug: "second-post",
        excerpt: "This is the second post excerpt",
        published_at: "2026-01-10T12:00:00Z",
        meta_title: "Custom SEO Title",
        meta_description: "Custom SEO description",
      },
    ];

    test("renders blog posts list", () => {
      render(<BlogIndexClient posts={mockPosts} />);

      expect(screen.getByText("Blog")).toBeInTheDocument();
      expect(screen.getByText("First Blog Post")).toBeInTheDocument();
      expect(screen.getByText("Second Blog Post")).toBeInTheDocument();
    });

    test("renders post excerpts", () => {
      render(<BlogIndexClient posts={mockPosts} />);

      expect(
        screen.getByText("This is the first post excerpt")
      ).toBeInTheDocument();
      expect(
        screen.getByText("This is the second post excerpt")
      ).toBeInTheDocument();
    });

    test("renders formatted dates", () => {
      render(<BlogIndexClient posts={mockPosts} />);

      // Dates should be formatted in German
      expect(screen.getByText(/15. Januar 2026/)).toBeInTheDocument();
      expect(screen.getByText(/10. Januar 2026/)).toBeInTheDocument();
    });

    test("renders links to blog post pages", () => {
      render(<BlogIndexClient posts={mockPosts} />);

      const firstLink = screen.getByText("First Blog Post").closest("a");
      expect(firstLink).toHaveAttribute("href", "/blog/first-post");

      const secondLink = screen.getByText("Second Blog Post").closest("a");
      expect(secondLink).toHaveAttribute("href", "/blog/second-post");
    });

    test("renders empty state when no posts", () => {
      render(<BlogIndexClient posts={[]} />);

      expect(
        screen.getByText("Noch keine Artikel vorhanden.")
      ).toBeInTheDocument();
    });

    test("handles posts without published_at", () => {
      const postsWithoutDate: BlogPostListItem[] = [
        {
          id: "1",
          title: "No Date Post",
          slug: "no-date",
          excerpt: "No date excerpt",
          published_at: null,
          meta_title: null,
          meta_description: null,
        },
      ];

      render(<BlogIndexClient posts={postsWithoutDate} />);

      expect(screen.getByText("No Date Post")).toBeInTheDocument();
    });
  });

  describe("BlogPostClient", () => {
    const mockPost: BlogPostDetail = {
      id: "1",
      title: "Test Blog Post",
      slug: "test-post",
      excerpt: "Test excerpt",
      content: "# Heading\n\nParagraph content",
      published_at: "2026-01-15T12:00:00Z",
      meta_title: "Custom Meta Title",
      meta_description: "Custom meta description",
    };

    test("renders blog post title", () => {
      render(
        <BlogPostClient post={mockPost}>
          <div>Content</div>
        </BlogPostClient>
      );

      expect(screen.getByText("Test Blog Post")).toBeInTheDocument();
    });

    test("renders published date", () => {
      render(
        <BlogPostClient post={mockPost}>
          <div>Content</div>
        </BlogPostClient>
      );

      expect(screen.getByText(/15. Januar 2026/)).toBeInTheDocument();
    });

    test("renders back link to blog list", () => {
      render(
        <BlogPostClient post={mockPost}>
          <div>Content</div>
        </BlogPostClient>
      );

      const backLinks = screen.getAllByText(/Zurück zum Blog|Alle Artikel/);
      expect(backLinks.length).toBeGreaterThan(0);
      expect(backLinks[0].closest("a")).toHaveAttribute("href", "/blog");
    });

    test("renders children content", () => {
      render(
        <BlogPostClient post={mockPost}>
          <div data-testid="post-content">MDX Content Here</div>
        </BlogPostClient>
      );

      expect(screen.getByTestId("post-content")).toBeInTheDocument();
    });
  });

  describe("FaqIndexClient", () => {
    const mockCategories: FaqCategory[] = [
      {
        category: "Allgemein",
        entries: [
          {
            id: "1",
            question: "Was ist ZollPilot?",
            answer: "ZollPilot hilft bei der Zollvorbereitung.",
            category: "Allgemein",
            order_index: 0,
            related_blog_slug: null,
          },
          {
            id: "2",
            question: "Wie starte ich?",
            answer: "Klicken Sie auf Start.",
            category: "Allgemein",
            order_index: 1,
            related_blog_slug: "getting-started",
          },
        ],
      },
      {
        category: "Kosten",
        entries: [
          {
            id: "3",
            question: "Was kostet ZollPilot?",
            answer: "Siehe unsere Preisseite.",
            category: "Kosten",
            order_index: 0,
            related_blog_slug: null,
          },
        ],
      },
    ];

    test("renders FAQ title and intro", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      expect(screen.getByText("Häufig gestellte Fragen")).toBeInTheDocument();
      expect(
        screen.getByText(/Hier finden Sie Antworten/)
      ).toBeInTheDocument();
    });

    test("renders category headers", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      expect(screen.getByText("Allgemein")).toBeInTheDocument();
      expect(screen.getByText("Kosten")).toBeInTheDocument();
    });

    test("renders FAQ questions", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      expect(screen.getByText("Was ist ZollPilot?")).toBeInTheDocument();
      expect(screen.getByText("Wie starte ich?")).toBeInTheDocument();
      expect(screen.getByText("Was kostet ZollPilot?")).toBeInTheDocument();
    });

    test("accordion expands on click to show answer", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      // Initially answer should not be visible
      expect(
        screen.queryByText("ZollPilot hilft bei der Zollvorbereitung.")
      ).not.toBeInTheDocument();

      // Click on question
      fireEvent.click(screen.getByText("Was ist ZollPilot?"));

      // Now answer should be visible
      expect(
        screen.getByText("ZollPilot hilft bei der Zollvorbereitung.")
      ).toBeInTheDocument();
    });

    test("accordion collapses on second click", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      const questionButton = screen.getByText("Was ist ZollPilot?");

      // Click to open
      fireEvent.click(questionButton);
      expect(
        screen.getByText("ZollPilot hilft bei der Zollvorbereitung.")
      ).toBeInTheDocument();

      // Click to close
      fireEvent.click(questionButton);
      expect(
        screen.queryByText("ZollPilot hilft bei der Zollvorbereitung.")
      ).not.toBeInTheDocument();
    });

    test("renders related blog link when present", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      // Expand the item with related blog
      fireEvent.click(screen.getByText("Wie starte ich?"));

      const relatedLink = screen.getByText("Mehr erfahren →");
      expect(relatedLink.closest("a")).toHaveAttribute(
        "href",
        "/blog/getting-started"
      );
    });

    test("does not render related blog link when null", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      // Expand the item without related blog
      fireEvent.click(screen.getByText("Was ist ZollPilot?"));

      // Should not have "Mehr erfahren" link
      const answer = screen.getByText(
        "ZollPilot hilft bei der Zollvorbereitung."
      );
      expect(answer.parentElement).not.toHaveTextContent("Mehr erfahren");
    });

    test("renders empty state when no categories", () => {
      render(<FaqIndexClient categories={[]} />);

      expect(
        screen.getByText("Noch keine FAQ-Einträge vorhanden.")
      ).toBeInTheDocument();
    });

    test("accordion buttons have correct aria-expanded attribute", () => {
      render(<FaqIndexClient categories={mockCategories} />);

      const questionButton = screen.getByText("Was ist ZollPilot?");
      expect(questionButton).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(questionButton);
      expect(questionButton).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("Navigation", () => {
    test("Blog link points to /blog", () => {
      render(
        <PublicLayout>
          <div>Test</div>
        </PublicLayout>
      );

      const blogLink = screen.getByText("Blog").closest("a");
      expect(blogLink).toHaveAttribute("href", "/blog");
    });

    test("FAQ link points to /faq", () => {
      render(
        <PublicLayout>
          <div>Test</div>
        </PublicLayout>
      );

      const faqLink = screen.getByText("FAQ").closest("a");
      expect(faqLink).toHaveAttribute("href", "/faq");
    });
  });
});
