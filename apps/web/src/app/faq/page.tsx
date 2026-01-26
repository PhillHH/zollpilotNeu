import type { Metadata } from "next";
import { getFaqByCategory } from "../lib/content";
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

export default function FaqPage() {
  const faqByCategory = getFaqByCategory();

  return (
    <PublicLayout>
      <FaqIndexClient faqByCategory={faqByCategory} />
    </PublicLayout>
  );
}

