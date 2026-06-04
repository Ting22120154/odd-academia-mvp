/**
 * Paper follow helpers (Prisma PaperFollow model).
 * userId → paperId means "user follows paper".
 */
import prisma from "@odd-academia/db/client";
import { isValidUserId } from "@/lib/auth/user-id";

export { isValidUserId as isValidPaperId };

export async function viewerFollowsPaper(
  viewerId: string | undefined,
  paperId: string,
): Promise<boolean> {
  if (!viewerId) return false;
  const row = await prisma.paperFollow.findUnique({
    where: {
      userId_paperId: { userId: viewerId, paperId },
    },
  });
  return !!row;
}

export async function countPaperFollowers(paperId: string): Promise<number> {
  return prisma.paperFollow.count({ where: { paperId } });
}

export type FollowedPaperSummary = {
  id: string;
  title: string;
  authorName: string;
  authorAvatarUrl?: string;
};

export async function listFollowedPapers(
  userId: string,
): Promise<FollowedPaperSummary[]> {
  const rows = await prisma.paperFollow.findMany({
    where: { userId },
    include: {
      paper: {
        select: {
          id: true,
          title: true,
          status: true,
          author: {
            select: { fullName: true, avatarUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows
    .filter((r) => r.paper.status === "published")
    .map((r) => ({
      id: r.paper.id,
      title: r.paper.title,
      authorName: r.paper.author.fullName,
      authorAvatarUrl: r.paper.author.avatarUrl ?? undefined,
    }));
}
