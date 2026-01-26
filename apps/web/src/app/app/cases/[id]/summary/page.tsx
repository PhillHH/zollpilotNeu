import { SummaryClient } from "./SummaryClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SummaryPage({ params }: Props) {
  const { id } = await params;
  return <SummaryClient caseId={id} />;
}

