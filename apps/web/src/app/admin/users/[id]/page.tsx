import { UserDetailClient } from "./UserDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;
  return <UserDetailClient userId={id} />;
}
