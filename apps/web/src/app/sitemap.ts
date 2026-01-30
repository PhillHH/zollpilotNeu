import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://zollpilot.de";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

type BlogPostForSitemap = {
  slug: string;
  published_at: string | null;
};

/**
 * Fetch published blog posts from API for sitemap generation.
 * Falls back to empty array if API is unavailable.
 */
async function fetchPublishedBlogPosts(): Promise<BlogPostForSitemap[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/content/blog`, {
      headers: { "X-Contract-Version": "1" },
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      return [];
    }

    const result = (await response.json()) as { data: BlogPostForSitemap[] };
    return result.data || [];
  } catch {
    // API not available - return empty array
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/impressum`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic blog posts (published only, fetched from API)
  // Note: FAQ has no individual pages - answers are shown inline on /faq
  const blogPosts = await fetchPublishedBlogPosts();
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.published_at ? new Date(post.published_at) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
