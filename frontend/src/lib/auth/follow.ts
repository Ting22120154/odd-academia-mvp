/**
 * Follow graph helpers (Prisma Follow model).
 * followerId → followingId means "follower follows following".
 * Used by /api/users/[id]/follow and /api/users/me/following|followers.
 */
import { prisma } from "@/lib/prisma";

export type FollowAuthor = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  isFollowing: boolean;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserId(id: string): boolean {
  return UUID_RE.test(id);
}

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
