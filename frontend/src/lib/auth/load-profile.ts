import { prisma } from "@/lib/prisma";
import {
  profileInclude,
  toProfilePaper,
  toProfileUser,
  type ProfileUser,
} from "@/lib/auth/profile";
import { loadProfileMetrics } from "@/lib/auth/profile-metrics";

export async function loadProfile(
  userId: string,
  options: { viewerId?: string; includeEmail?: boolean }
): Promise<ProfileUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: profileInclude,
  });
  if (!user) return null;

  const [papers, metrics] = await Promise.all([
    prisma.paper.findMany({
      where: { authorId: userId, status: "published" },
      include: { keywords: true, categories: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    loadProfileMetrics(userId),
  ]);

  return toProfileUser(user, papers.map(toProfilePaper), {
    viewerId: options.viewerId,
    includeEmail: options.includeEmail,
    metrics,
  });
}
