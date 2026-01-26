import type { Metadata } from "next";
import { getBlogPosts } from "../lib/content";
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

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <PublicLayout>
      <BlogIndexClient posts={posts} />
    </PublicLayout>
  );
}

