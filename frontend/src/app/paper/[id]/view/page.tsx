import {
  getPublishedPaperByIdFromDb,
} from "@/lib/papers/db";
import { getServerUserId } from "@/lib/auth/server-user";
import { PaperDocumentViewClient } from "./PaperDocumentViewClient";

export default async function PaperDocumentViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewerId = await getServerUserId();
  const post = await getPublishedPaperByIdFromDb(id, viewerId);

  if (!post?.fileUrl || post.fileType !== "pdf") {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-[var(--page-max)] items-center justify-center px-6 text-center text-sm text-zinc-500">
        <p>No PDF is available for this paper.</p>
      </div>
    );
  }

  const fileSrc = `/api/papers/${id}/file`;

  return (
    <PaperDocumentViewClient
      paperId={id}
      title={post.title}
      summary={post.summary}
      fileSrc={fileSrc}
    />
  );
}
