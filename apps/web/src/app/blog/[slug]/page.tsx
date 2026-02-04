import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { content, BlogPostDetail } from "../../lib/api/client";
import { PublicLayout } from "../../components/PublicLayout";
import { BlogPostClient } from "./BlogPostClient";
import { SafeMarkdownContent } from "../../components/SafeMarkdownContent";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchBlogPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const response = await content.getBlogPost(slug, {
      cache: "no-store",
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);

  if (!post) {
    return {
      title: "Artikel nicht gefunden – ZollPilot",
    };
  }

  return {
    title: post.meta_title || `${post.title} – ZollPilot`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: "article",
      publishedTime: post.published_at || undefined,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <PublicLayout>
      <BlogPostClient post={post}>
        <SafeMarkdownContent source={post.content} />
      </BlogPostClient>
    </PublicLayout>
  );
}
