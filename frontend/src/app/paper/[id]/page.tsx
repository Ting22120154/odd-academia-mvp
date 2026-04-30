import { getMockPostById } from "@/lib/mockPosts";
import { PaperDetailClient } from "@/app/paper/_components/PaperDetailClient";

export default async function PaperDetailPage({
  params,
}: {
  /**
   * Dynamic route: `/paper/:id`
   *
   * Requirement from client docs: generate a unique URL per paper so it can be shared.
   */
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getMockPostById(id);

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-[var(--page-max)]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
          Paper not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[var(--page-max)]">
      <PaperDetailClient post={post} />
    </div>
  );
}

