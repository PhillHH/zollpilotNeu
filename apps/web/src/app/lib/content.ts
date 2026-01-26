/**
 * Content library for reading MDX files from the content directory.
 * Provides utilities for blog and FAQ content.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Content directory paths
const CONTENT_DIR = path.join(process.cwd(), "content");
const BLOG_DIR = path.join(CONTENT_DIR, "blog");
const FAQ_DIR = path.join(CONTENT_DIR, "faq");

// Types

export type ContentMeta = {
  title: string;
  description: string;
  slug: string;
  published_at: string;
  tags?: string[];
  category?: string;
};

export type ContentItem = {
  meta: ContentMeta;
  content: string;
};

export type ContentListItem = {
  meta: ContentMeta;
};

// Helper functions

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getMdxFiles(dir: string): string[] {
  ensureDir(dir);
  try {
    return fs.readdirSync(dir).filter((file) => file.endsWith(".mdx"));
  } catch {
    return [];
  }
}

function parseContentFile(filePath: string): ContentItem | null {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const meta: ContentMeta = {
      title: data.title || "Untitled",
      description: data.description || "",
      slug: data.slug || path.basename(filePath, ".mdx"),
      published_at: data.published_at || new Date().toISOString(),
      tags: data.tags || [],
      category: data.category,
    };

    return { meta, content };
  } catch {
    return null;
  }
}

// Blog functions

export function getBlogPosts(): ContentListItem[] {
  const files = getMdxFiles(BLOG_DIR);

  const posts = files
    .map((file) => {
      const item = parseContentFile(path.join(BLOG_DIR, file));
      return item ? { meta: item.meta } : null;
    })
    .filter((item): item is ContentListItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.meta.published_at).getTime() -
        new Date(a.meta.published_at).getTime()
    );

  return posts;
}

export function getBlogPost(slug: string): ContentItem | null {
  const files = getMdxFiles(BLOG_DIR);

  for (const file of files) {
    const item = parseContentFile(path.join(BLOG_DIR, file));
    if (item && item.meta.slug === slug) {
      return item;
    }
  }

  return null;
}

export function getBlogSlugs(): string[] {
  return getBlogPosts().map((post) => post.meta.slug);
}

// FAQ functions

export function getFaqEntries(): ContentListItem[] {
  const files = getMdxFiles(FAQ_DIR);

  const entries = files
    .map((file) => {
      const item = parseContentFile(path.join(FAQ_DIR, file));
      return item ? { meta: item.meta } : null;
    })
    .filter((item): item is ContentListItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.meta.published_at).getTime() -
        new Date(a.meta.published_at).getTime()
    );

  return entries;
}

export function getFaqEntry(slug: string): ContentItem | null {
  const files = getMdxFiles(FAQ_DIR);

  for (const file of files) {
    const item = parseContentFile(path.join(FAQ_DIR, file));
    if (item && item.meta.slug === slug) {
      return item;
    }
  }

  return null;
}

export function getFaqSlugs(): string[] {
  return getFaqEntries().map((entry) => entry.meta.slug);
}

// Grouped FAQ by category

export function getFaqByCategory(): Record<string, ContentListItem[]> {
  const entries = getFaqEntries();
  const grouped: Record<string, ContentListItem[]> = {};

  for (const entry of entries) {
    const category = entry.meta.category || "Allgemein";
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(entry);
  }

  return grouped;
}

// Sitemap helpers

export function getAllContentUrls(): { url: string; lastmod: string }[] {
  const urls: { url: string; lastmod: string }[] = [];

  // Blog posts
  for (const post of getBlogPosts()) {
    urls.push({
      url: `/blog/${post.meta.slug}`,
      lastmod: post.meta.published_at,
    });
  }

  // FAQ entries
  for (const entry of getFaqEntries()) {
    urls.push({
      url: `/faq/${entry.meta.slug}`,
      lastmod: entry.meta.published_at,
    });
  }

  return urls;
}

