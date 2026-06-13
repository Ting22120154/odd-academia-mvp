/**
 * Aggregated profile engagement stats (not available via Prisma _count alone).
 */
import { prisma } from "@/lib/prisma";

export type ProfileMetrics = {
  papersPublished: number;
  paperViews: number;
  /** Other users following this author's published papers */
  paperFollows: number;
  /** Other users commenting on this author's published papers */
  commentsOnPapers: number;
  /** Published papers this user follows */
  followedPapers: number;
};

const publishedBy = (userId: string) =>
  ({ authorId: userId, status: "published" as const });

export async function loadProfileMetrics(userId: string): Promise<ProfileMetrics> {
  const publishedWhere = publishedBy(userId);

  const [
    papersPublished,
    viewsAgg,
    paperFollows,
    commentsOnPapers,
    followedPapers,
  ] = await Promise.all([
    prisma.paper.count({ where: publishedWhere }),
    prisma.paper.aggregate({
      where: publishedWhere,
      _sum: { viewCount: true },
    }),
    prisma.paperFollow.count({
      where: { paper: publishedWhere },
    }),
    prisma.comment.count({
      where: {
        paper: publishedWhere,
        authorId: { not: userId },
        isHidden: false,
      },
    }),
    prisma.paperFollow.count({
      where: { userId, paper: { status: "published" } },
    }),
  ]);

  return {
    papersPublished,
    paperViews: viewsAgg._sum.viewCount ?? 0,
    paperFollows,
    commentsOnPapers,
    followedPapers,
  };
}
