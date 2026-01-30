import type { Metadata } from "next";
import { content, BlogPostListItem } from "../lib/api/client";
import { PublicLayout } from "../components/PublicLayout";
import { BlogIndexClient } from "./BlogIndexClient";

export const metadata: Metadata = {
  title: "Blog – ZollPilot",
  description:
    "Aktuelle Artikel rund um Zoll, Import und Einfuhrumsatzsteuer. Tipps und Anleitungen für Ihre Zollanmeldung.",
  openGraph: {
    title: "Blog – ZollPilot",
    description:
      "Aktuelle Artikel rund um Zoll, Import und Einfuhrumsatzsteuer.",
    type: "website",
  },
};

async function fetchBlogPosts(): Promise<BlogPostListItem[]> {
  try {
    const response = await content.listBlogPosts({
      cache: "no-store",
    });
    return response.data;
  } catch {
    // Return empty array on error (e.g., API not available)
    return [];
  }
}

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
    <PublicLayout>
      <BlogIndexClient posts={posts} />
    </PublicLayout>
  );
}
