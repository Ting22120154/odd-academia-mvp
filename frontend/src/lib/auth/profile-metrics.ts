/**
 * Aggregated profile engagement stats (not available via Prisma _count alone).
 */
import { prisma } from "@/lib/prisma";

export type ProfileMetrics = {
  papersPublished: number;
  totalLikes: number;
  paperEngagement: number;
};

export async function loadProfileMetrics(userId: string): Promise<ProfileMetrics> {
  const [papersPublished, totalLikes, viewsAgg, paperFollows] = await Promise.all([
    prisma.paper.count({
      where: { authorId: userId, status: "published" },
    }),
    prisma.commentLike.count({
      where: { comment: { authorId: userId } },
    }),
    prisma.paper.aggregate({
      where: { authorId: userId, status: "published" },
      _sum: { viewCount: true },
    }),
    prisma.paperFollow.count({
      where: { paper: { authorId: userId, status: "published" } },
    }),
  ]);

  const paperEngagement = (viewsAgg._sum.viewCount ?? 0) + paperFollows;

  return { papersPublished, totalLikes, paperEngagement };
}
