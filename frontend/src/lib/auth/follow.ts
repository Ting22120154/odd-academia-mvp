/**
 * Follow graph helpers (Prisma Follow model).
 * followerId → followingId means "follower follows following".
 * Used by /api/users/[id]/follow and /api/users/me/following|followers.
 */
import { prisma } from "@/lib/prisma";
import { isValidUserId } from "@/lib/auth/user-id";

export type FollowAuthor = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isFollowing: boolean;
};

export { isValidUserId };

export async function viewerFollowsTarget(
  viewerId: string | undefined,
  targetId: string
): Promise<boolean> {
  if (!viewerId || viewerId === targetId) return false;
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: viewerId, followingId: targetId },
    },
  });
  return !!row;
}

export async function listFollowingAuthors(viewerId: string): Promise<FollowAuthor[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: viewerId },
    include: {
      following: {
        select: { id: true, fullName: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.following.id,
    name: r.following.fullName,
    username: r.following.username,
    avatarUrl: r.following.avatarUrl ?? undefined,
    isFollowing: true,
  }));
}

export async function listFollowerAuthors(viewerId: string): Promise<FollowAuthor[]> {
  const rows = await prisma.follow.findMany({
    where: { followingId: viewerId },
    include: {
      follower: {
        select: { id: true, fullName: true, username: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const followerIds = rows.map((r) => r.follower.id);
  const mutual = followerIds.length
    ? await prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: followerIds } },
        select: { followingId: true },
      })
    : [];
  const followingSet = new Set(mutual.map((m) => m.followingId));

  return rows.map((r) => ({
    id: r.follower.id,
    name: r.follower.fullName,
    username: r.follower.username,
    avatarUrl: r.follower.avatarUrl ?? undefined,
    isFollowing: followingSet.has(r.follower.id),
  }));
}
