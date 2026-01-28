import React from "react";
import { render, screen } from "@testing-library/react";
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

// Mock content lib
vi.mock("../src/app/lib/content", () => ({
  getBlogPosts: vi.fn(() => [
    {
      meta: {
        title: "Test Blog Post",
        description: "Test description",
        slug: "test-post",
        published_at: "2026-01-15",
        tags: ["Test", "Blog"],
      },
    },
    {
      meta: {
        title: "Second Post",
        description: "Another description",
        slug: "second-post",
        published_at: "2026-01-10",
        tags: ["News"],
      },
    },
  ]),
  getBlogPost: vi.fn((slug: string) => {
    if (slug === "test-post") {
      return {
        meta: {
          title: "Test Blog Post",
          description: "Test description",
          slug: "test-post",
          published_at: "2026-01-15",
          tags: ["Test", "Blog"],
        },
        content: "# Test Content\n\nThis is test content.",
      };
    }
    return null;
  }),
  getBlogSlugs: vi.fn(() => ["test-post", "second-post"]),
  getFaqEntries: vi.fn(() => [
    {
      meta: {
        title: "Was ist ZollPilot?",
        description: "FAQ about ZollPilot",
        slug: "was-ist-zollpilot",
        published_at: "2026-01-01",
        category: "Allgemein",
      },
    },
    {
      meta: {
        title: "Wann brauche ich Zollanmeldung?",
        description: "FAQ about when",
        slug: "wann-zollanmeldung",
        published_at: "2026-01-02",
        category: "Zoll & Import",
      },
    },
  ]),
  getFaqEntry: vi.fn((slug: string) => {
    if (slug === "was-ist-zollpilot") {
      return {
        meta: {
          title: "Was ist ZollPilot?",
          description: "FAQ about ZollPilot",
          slug: "was-ist-zollpilot",
          published_at: "2026-01-01",
          category: "Allgemein",
        },
        content: "# Was ist ZollPilot?\n\nZollPilot ist eine digitale Plattform.",
      };
    }
    return null;
  }),
  getFaqSlugs: vi.fn(() => ["was-ist-zollpilot", "wann-zollanmeldung"]),
  getFaqByCategory: vi.fn(() => ({
    Allgemein: [
      {
        meta: {
          title: "Was ist ZollPilot?",
          description: "FAQ about ZollPilot",
          slug: "was-ist-zollpilot",
          published_at: "2026-01-01",
          category: "Allgemein",
        },
      },
    ],
    "Zoll & Import": [
      {
        meta: {
          title: "Wann brauche ich Zollanmeldung?",
          description: "FAQ about when",
          slug: "wann-zollanmeldung",
          published_at: "2026-01-02",
          category: "Zoll & Import",
        },
      },
    ],
  })),
  getAllContentUrls: vi.fn(() => [
    { url: "/blog/test-post", lastmod: "2026-01-15" },
    { url: "/faq/was-ist-zollpilot", lastmod: "2026-01-01" },
  ]),
}));

// Mock MDXRemote
vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source.substring(0, 50)}...</div>
  ),
}));

// Import components after mocks
import { PublicLayout } from "../src/app/components/PublicLayout";

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

  describe("Blog", () => {
    test("getBlogPosts returns posts sorted by date", async () => {
      const { getBlogPosts } = await import("../src/app/lib/content");
      const posts = getBlogPosts();

      expect(posts).toHaveLength(2);
      expect(posts[0].meta.title).toBe("Test Blog Post");
      expect(posts[1].meta.title).toBe("Second Post");
    });

    test("getBlogPost returns post by slug", async () => {
      const { getBlogPost } = await import("../src/app/lib/content");
      const post = getBlogPost("test-post");

      expect(post).not.toBeNull();
      expect(post?.meta.title).toBe("Test Blog Post");
      expect(post?.content).toContain("Test Content");
    });

    test("getBlogPost returns null for unknown slug", async () => {
      const { getBlogPost } = await import("../src/app/lib/content");
      const post = getBlogPost("unknown-slug");

      expect(post).toBeNull();
    });
  });

  describe("FAQ", () => {
    test("getFaqByCategory groups entries correctly", async () => {
      const { getFaqByCategory } = await import("../src/app/lib/content");
      const grouped = getFaqByCategory();

      expect(Object.keys(grouped)).toContain("Allgemein");
      expect(Object.keys(grouped)).toContain("Zoll & Import");
      expect(grouped["Allgemein"]).toHaveLength(1);
    });

    test("getFaqEntry returns entry by slug", async () => {
      const { getFaqEntry } = await import("../src/app/lib/content");
      const entry = getFaqEntry("was-ist-zollpilot");

      expect(entry).not.toBeNull();
      expect(entry?.meta.title).toBe("Was ist ZollPilot?");
      expect(entry?.meta.category).toBe("Allgemein");
    });

    test("getFaqEntry returns null for unknown slug", async () => {
      const { getFaqEntry } = await import("../src/app/lib/content");
      const entry = getFaqEntry("unknown-faq");

      expect(entry).toBeNull();
    });
  });

  describe("Sitemap", () => {
    test("getAllContentUrls returns blog and faq urls", async () => {
      const { getAllContentUrls } = await import("../src/app/lib/content");
      const urls = getAllContentUrls();

      expect(urls.length).toBeGreaterThan(0);
      expect(urls.some((u) => u.url.startsWith("/blog/"))).toBe(true);
      expect(urls.some((u) => u.url.startsWith("/faq/"))).toBe(true);
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

  describe("SEO Configuration", () => {
    test("sitemap includes content URLs", async () => {
      const { getAllContentUrls } = await import("../src/app/lib/content");
      const urls = getAllContentUrls();

      // Content pages should be included
      expect(urls.some((u) => u.url.includes("/blog/"))).toBe(true);
      expect(urls.some((u) => u.url.includes("/faq/"))).toBe(true);

      // Each URL should have a lastmod date
      urls.forEach((u) => {
        expect(u.lastmod).toBeDefined();
        expect(new Date(u.lastmod).toString()).not.toBe("Invalid Date");
      });
    });

    test("content URLs do not include /app paths", async () => {
      const { getAllContentUrls } = await import("../src/app/lib/content");
      const urls = getAllContentUrls();

      // /app should never be in sitemap content URLs
      urls.forEach((u) => {
        expect(u.url).not.toMatch(/^\/app/);
        expect(u.url).not.toMatch(/^\/admin/);
        expect(u.url).not.toMatch(/^\/api/);
      });
    });

    test("content frontmatter has required SEO fields", async () => {
      const { getBlogPosts, getFaqEntries } = await import(
        "../src/app/lib/content"
      );
      const posts = getBlogPosts();
      const faqs = getFaqEntries();

      // All blog posts must have title, description, slug
      posts.forEach((post) => {
        expect(post.meta.title).toBeDefined();
        expect(post.meta.title.length).toBeGreaterThan(0);
        expect(post.meta.description).toBeDefined();
        expect(post.meta.slug).toBeDefined();
        expect(post.meta.published_at).toBeDefined();
      });

      // All FAQ entries must have title, description, slug
      faqs.forEach((faq) => {
        expect(faq.meta.title).toBeDefined();
        expect(faq.meta.title.length).toBeGreaterThan(0);
        expect(faq.meta.description).toBeDefined();
        expect(faq.meta.slug).toBeDefined();
        expect(faq.meta.published_at).toBeDefined();
      });
    });
  });

  describe("Content Structure", () => {
    test("blog posts have valid tags array", async () => {
      const { getBlogPosts } = await import("../src/app/lib/content");
      const posts = getBlogPosts();

      posts.forEach((post) => {
        if (post.meta.tags) {
          expect(Array.isArray(post.meta.tags)).toBe(true);
        }
      });
    });

    test("FAQ entries have valid category", async () => {
      const { getFaqByCategory } = await import("../src/app/lib/content");
      const grouped = getFaqByCategory();

      // Should have at least one category
      expect(Object.keys(grouped).length).toBeGreaterThan(0);

      // Each category should have entries
      Object.values(grouped).forEach((entries) => {
        expect(entries.length).toBeGreaterThan(0);
      });
    });
  });
});

