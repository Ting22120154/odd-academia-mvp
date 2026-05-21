import { getMockPostById } from "@/lib/mockPosts";
import { prisma } from "@/lib/prisma";
import { PaperDetailClient } from "@/app/paper/_components/PaperDetailClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Map `/paper/1` mock ids to seeded Neon papers (same order as seed). */
async function resolveCommentsPaperId(routeId: string): Promise<string | null> {
  if (UUID_RE.test(routeId)) {
    const paper = await prisma.paper.findUnique({
      where: { id: routeId },
      select: { id: true },
    });
    return paper?.id ?? null;
  }

  const index = Number.parseInt(routeId, 10);
  if (!Number.isInteger(index) || index < 1) return null;

  const papers = await prisma.paper.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
    take: 20,
  });
  return papers[index - 1]?.id ?? null;
}

export default async function PaperDetailPage({
  params,
}: {
  /**
   * Dynamic route: `/paper/:id`
   *
   * Requirement from client docs: generate a unique URL per paper so it can be shared.
   *
   * Note for reviewers:
   * - This server component only resolves the data (mock for now) and delegates UI
   *   to `PaperDetailClient` which matches the Figma layout.
   */
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getMockPostById(id);
  const commentsPaperId = await resolveCommentsPaperId(id);

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
      <PaperDetailClient post={post} commentsPaperId={commentsPaperId} />
    </div>
  );
}
