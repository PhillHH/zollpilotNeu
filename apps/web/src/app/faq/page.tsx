import type { Metadata } from "next";
import { content, FaqCategory } from "../lib/api/client";
import { PublicLayout } from "../components/PublicLayout";
import { FaqIndexClient } from "./FaqIndexClient";

export const metadata: Metadata = {
  title: "FAQ – ZollPilot",
  description:
    "Häufig gestellte Fragen zu Zollanmeldungen, Einfuhrumsatzsteuer und dem ZollPilot-Service.",
  openGraph: {
    title: "FAQ – ZollPilot",
    description: "Häufig gestellte Fragen zu Zollanmeldungen und Import.",
    type: "website",
  },
};

async function fetchFaqCategories(): Promise<FaqCategory[]> {
  try {
    const response = await content.listFaq({
      cache: "no-store",
    });
    return response.data;
  } catch {
    // Return empty array on error (e.g., API not available)
    return [];
  }
}

export default async function FaqPage() {
  const categories = await fetchFaqCategories();

  return (
    <PublicLayout>
      <FaqIndexClient categories={categories} />
    </PublicLayout>
  );
}
