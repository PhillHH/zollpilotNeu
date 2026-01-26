import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFaqEntry, getFaqSlugs } from "../../lib/content";
import { PublicLayout } from "../../components/PublicLayout";
import { FaqEntryClient } from "./FaqEntryClient";
import { MDXContent } from "../../components/MDXContent";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = getFaqSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getFaqEntry(slug);

  if (!entry) {
    return {
      title: "FAQ nicht gefunden – ZollPilot",
    };
  }

  return {
    title: `${entry.meta.title} – ZollPilot FAQ`,
    description: entry.meta.description,
    openGraph: {
      title: entry.meta.title,
      description: entry.meta.description,
      type: "article",
    },
    alternates: {
      canonical: `/faq/${slug}`,
    },
  };
}

export default async function FaqEntryPage({ params }: Props) {
  const { slug } = await params;
  const entry = getFaqEntry(slug);

  if (!entry) {
    notFound();
  }

  return (
    <PublicLayout>
      <FaqEntryClient meta={entry.meta}>
        <MDXContent source={entry.content} />
      </FaqEntryClient>
    </PublicLayout>
  );
}
