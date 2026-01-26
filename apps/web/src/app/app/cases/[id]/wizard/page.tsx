import { WizardClient } from "./WizardClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WizardPage({ params }: Props) {
  const { id } = await params;
  return <WizardClient caseId={id} />;
}

