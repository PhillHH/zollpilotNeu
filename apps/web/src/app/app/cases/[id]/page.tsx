import { CaseDetailClient } from "./CaseDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  return <CaseDetailClient caseId={id} />;
}

