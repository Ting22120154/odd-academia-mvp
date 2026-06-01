import prisma from "@odd-academia/db/client";
import { mapApiPaperToViewerPost, type ApiPaper } from "@/lib/mapApiPaper";
import type { MockPost } from "@/lib/mockPosts";
import { paperInclude } from "./constants";

function assertDatabaseUrl() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is not set. Copy frontend/.env.example to frontend/.env and add your Neon connection string.",
    );
  }
}

export type ListPublishedPapersOptions = {
  limit?: number;
  skip?: number;
  authorId?: string;
};

export async function listPublishedPapersFromDb(
  options: ListPublishedPapersOptions = {},
): Promise<{ posts: MockPost[]; total: number }> {
  assertDatabaseUrl();

  const limit = Math.min(50, options.limit ?? 50);
  const skip = options.skip ?? 0;
  const where = {
    status: "published" as const,
    ...(options.authorId ? { authorId: options.authorId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: paperInclude,
    }),
    prisma.paper.count({ where }),
  ]);

  return {
    posts: rows.map((row) => mapApiPaperToViewerPost(row as ApiPaper)),
    total,
  };
}

export async function getPublishedPaperByIdFromDb(id: string): Promise<MockPost | null> {
  assertDatabaseUrl();

  const existing = await prisma.paper.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing || existing.status === "removed" || existing.status !== "published") {
    return null;
  }

  const paper = await prisma.paper.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
    include: paperInclude,
  });

  return mapApiPaperToViewerPost(paper as ApiPaper);
}

export async function getRelatedPublishedPapersFromDb(
  excludeId: string,
  categories: string[],
  limit = 3,
): Promise<MockPost[]> {
  const { posts } = await listPublishedPapersFromDb({ limit: 50 });
  const cats = categories ?? [];
  return posts
    .filter((p) => p.id !== excludeId)
    .filter((p) =>
      (p.categories ?? []).some((c) => cats.includes(c)),
    )
    .slice(0, limit);
}
