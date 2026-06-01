import {
  getPublishedPaperByIdFromDb,
  getRelatedPublishedPapersFromDb,
} from "@/lib/papers/db";
import { PaperDetailClient } from "@/app/paper/_components/PaperDetailClient";

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPublishedPaperByIdFromDb(id);

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-[var(--page-max)]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
          Paper not found.
        </div>
      </div>
    );
  }

  const relatedPosts = await getRelatedPublishedPapersFromDb(
    post.id,
    post.categories ?? [],
  );

  return (
    <div className="mx-auto w-full max-w-[var(--page-max)]">
      <PaperDetailClient post={post} relatedPosts={relatedPosts} />
    </div>
  );
}
