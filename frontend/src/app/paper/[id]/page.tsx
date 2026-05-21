import { getMockPostById } from "@/lib/mockPosts";
import type { MockPost } from "@/lib/mockPosts";
import { prisma } from "@/lib/prisma";
import {
  getSeededPaperIds,
  paperIdToRouteId,
  resolveRouteToPaperId,
} from "@/modules/papers/paper-route.service";
import { PaperDetailClient } from "@/app/paper/_components/PaperDetailClient";

const DUMMY_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

function resolveMockPost(routeId: string, paperUuid: string | null, seededIds: string[]): MockPost | null {
  const direct = getMockPostById(routeId);
  if (direct) return direct;

  if (!paperUuid) return null;

  const mockId = paperIdToRouteId(paperUuid, seededIds);
  if (mockId) return getMockPostById(mockId);

  return null;
}

/** Fallback when the paper exists in Neon but is not in the seed/mock list. */
async function buildPostFromDb(paperUuid: string): Promise<MockPost | null> {
  const paper = await prisma.paper.findUnique({
    where: { id: paperUuid },
    select: {
      id: true,
      title: true,
      abstract: true,
      status: true,
      author: { select: { fullName: true } },
      categories: { take: 1, select: { category: true } },
      keywords: { take: 2, select: { keyword: true } },
    },
  });

  if (!paper || paper.status === "removed") return null;

  const abstract = paper.abstract ?? "";
  return {
    id: paper.id,
    title: paper.title,
    summary: abstract.length > 120 ? `${abstract.slice(0, 120)}…` : abstract,
    authorName: paper.author.fullName,
    subject: paper.categories[0]?.category ?? "",
    tags: paper.keywords.map((k) => k.keyword),
    fileUrl: DUMMY_PDF,
    fileType: "pdf",
    headerGradientClass: "bg-gradient-to-br from-indigo-300 via-blue-200 to-sky-200",
  };
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seededIds = await getSeededPaperIds();
  const commentsPaperId = resolveRouteToPaperId(id, seededIds);

  let post = resolveMockPost(id, commentsPaperId, seededIds);
  if (!post && commentsPaperId) {
    post = await buildPostFromDb(commentsPaperId);
  }

  if (!post || !commentsPaperId) {
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
