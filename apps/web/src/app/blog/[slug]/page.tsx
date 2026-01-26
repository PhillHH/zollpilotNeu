import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogSlugs } from "../../lib/content";
import { PublicLayout } from "../../components/PublicLayout";
import { BlogPostClient } from "./BlogPostClient";
import { MDXContent } from "../../components/MDXContent";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Artikel nicht gefunden – ZollPilot",
    };
  }

  return {
    title: `${post.meta.title} – ZollPilot`,
    description: post.meta.description,
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.published_at,
      tags: post.meta.tags,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <PublicLayout>
      <BlogPostClient meta={post.meta}>
        <MDXContent source={post.content} />
      </BlogPostClient>
    </PublicLayout>
  );
}
