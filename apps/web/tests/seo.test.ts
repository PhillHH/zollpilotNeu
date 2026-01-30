/**
 * Tests für SEO-Funktionalität (Sitemap, robots.txt)
 */

import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock fetch für API-Aufrufe
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Importiere Sitemap-Funktion nach dem Mock
import sitemap from "../src/app/sitemap";

describe("Sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("enthält statische Seiten", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();

    // Prüfe, dass alle statischen Seiten enthalten sind
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://zollpilot.de");
    expect(urls).toContain("https://zollpilot.de/blog");
    expect(urls).toContain("https://zollpilot.de/faq");
    expect(urls).toContain("https://zollpilot.de/impressum");
    expect(urls).toContain("https://zollpilot.de/datenschutz");
    expect(urls).toContain("https://zollpilot.de/login");
    expect(urls).toContain("https://zollpilot.de/register");
  });

  test("enthält keine Admin-Routen", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    // Admin-Routen dürfen nicht in der Sitemap sein
    const adminUrls = urls.filter((url) => url.includes("/admin"));
    expect(adminUrls).toHaveLength(0);
  });

  test("enthält keine App-Routen", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    // App-Routen dürfen nicht in der Sitemap sein
    const appUrls = urls.filter((url) => url.includes("/app"));
    expect(appUrls).toHaveLength(0);
  });

  test("enthält veröffentlichte Blog-Posts", async () => {
    const mockBlogPosts = [
      { slug: "zollanmeldung-einfach-erklaert", published_at: "2026-01-15" },
      { slug: "einfuhrumsatzsteuer-berechnen", published_at: "2026-01-10" },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockBlogPosts }),
    });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    expect(urls).toContain("https://zollpilot.de/blog/zollanmeldung-einfach-erklaert");
    expect(urls).toContain("https://zollpilot.de/blog/einfuhrumsatzsteuer-berechnen");
  });

  test("enthält keine FAQ-Einzelseiten", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();
    const urls = result.map((entry) => entry.url);

    // FAQ-Einzelseiten gibt es nicht mehr
    const faqDetailUrls = urls.filter(
      (url) => url.includes("/faq/") && url !== "https://zollpilot.de/faq"
    );
    expect(faqDetailUrls).toHaveLength(0);
  });

  test("setzt korrekte Prioritäten", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();

    // Startseite hat höchste Priorität
    const homepage = result.find((entry) => entry.url === "https://zollpilot.de");
    expect(homepage?.priority).toBe(1);

    // Blog und FAQ haben hohe Priorität
    const blogIndex = result.find((entry) => entry.url === "https://zollpilot.de/blog");
    expect(blogIndex?.priority).toBe(0.9);

    const faqIndex = result.find((entry) => entry.url === "https://zollpilot.de/faq");
    expect(faqIndex?.priority).toBe(0.9);

    // Impressum hat niedrige Priorität
    const impressum = result.find((entry) => entry.url === "https://zollpilot.de/impressum");
    expect(impressum?.priority).toBe(0.3);
  });

  test("funktioniert auch wenn API nicht erreichbar", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await sitemap();

    // Sollte trotzdem statische Seiten enthalten
    expect(result.length).toBeGreaterThan(0);
    const urls = result.map((entry) => entry.url);
    expect(urls).toContain("https://zollpilot.de");
  });

  test("setzt changeFrequency korrekt", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await sitemap();

    // Startseite: weekly
    const homepage = result.find((entry) => entry.url === "https://zollpilot.de");
    expect(homepage?.changeFrequency).toBe("weekly");

    // Blog-Index: daily
    const blogIndex = result.find((entry) => entry.url === "https://zollpilot.de/blog");
    expect(blogIndex?.changeFrequency).toBe("daily");

    // Impressum: yearly
    const impressum = result.find((entry) => entry.url === "https://zollpilot.de/impressum");
    expect(impressum?.changeFrequency).toBe("yearly");
  });
});

describe("robots.txt", () => {
  // robots.ts is synchron, so we can import it directly
  // Note: This test verifies the expected structure of robots.txt

  test("robots.txt Struktur ist definiert", async () => {
    // Import robots dynamically to ensure fresh import
    const { default: robots } = await import("../src/app/robots");
    const result = robots();

    expect(result.rules).toBeDefined();
    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.sitemap).toBe("https://zollpilot.de/sitemap.xml");
  });

  test("robots.txt erlaubt öffentliche Seiten", async () => {
    const { default: robots } = await import("../src/app/robots");
    const result = robots();

    const rule = result.rules[0];
    expect(rule.allow).toContain("/");
    expect(rule.allow).toContain("/blog");
    expect(rule.allow).toContain("/faq");
  });

  test("robots.txt blockiert Admin-Routen", async () => {
    const { default: robots } = await import("../src/app/robots");
    const result = robots();

    const rule = result.rules[0];
    expect(rule.disallow).toContain("/admin");
    expect(rule.disallow).toContain("/admin/*");
  });

  test("robots.txt blockiert App-Routen", async () => {
    const { default: robots } = await import("../src/app/robots");
    const result = robots();

    const rule = result.rules[0];
    expect(rule.disallow).toContain("/app");
    expect(rule.disallow).toContain("/app/*");
  });

  test("robots.txt blockiert API-Routen", async () => {
    const { default: robots } = await import("../src/app/robots");
    const result = robots();

    const rule = result.rules[0];
    expect(rule.disallow).toContain("/api");
    expect(rule.disallow).toContain("/api/*");
  });
});
