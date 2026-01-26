import { AssistClient } from "./AssistClient";

export default function AssistPage({ params }: { params: { id: string } }) {
    return <AssistClient caseId={params.id} />;
}
