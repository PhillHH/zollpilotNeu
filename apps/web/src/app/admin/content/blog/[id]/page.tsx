import { BlogEditClient } from "./BlogEditClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogEditPage({ params }: Props) {
  const { id } = await params;
  return <BlogEditClient postId={id} />;
}
