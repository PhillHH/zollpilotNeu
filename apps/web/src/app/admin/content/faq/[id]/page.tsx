import { FaqEditClient } from "./FaqEditClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminFaqEditPage({ params }: Props) {
  const { id } = await params;
  return <FaqEditClient entryId={id} />;
}
