import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_SELECT = {
  id:         true,
  fullName:   true,
  username:   true,
  workStatus: true,
  jobTitle:   true,
  avatarUrl:  true,
} as const;

/** GET /api/follow?userId=<id>
 *  Returns { following, followers, followingIds } for the given user.
 *  - following:    users this person follows
 *  - followers:    users following this person
 *  - followingIds: Set-friendly array of IDs the user follows (for O(1) lookup)
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const [followingRows, followerRows] = await Promise.all([
    prisma.follow.findMany({
      where:   { followerId: userId },
      include: { following: { select: USER_SELECT } },
    }),
    prisma.follow.findMany({
      where:   { followingId: userId },
      include: { follower: { select: USER_SELECT } },
    }),
  ]);

  const following    = followingRows.map(r => r.following);
  const followers    = followerRows.map(r => r.follower);
  const followingIds = following.map(u => u.id);

  return NextResponse.json({ following, followers, followingIds });
}

/** POST /api/follow
 *  Body: { followerId, followingId }
 *  Creates a follow relationship. Idempotent — no error if already exists.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { followerId, followingId } = (body ?? {}) as Record<string, string>;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId are required." }, { status: 400 });
  }
  if (followerId === followingId) {
    return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });
  }

  await prisma.follow.upsert({
    where:  { followerId_followingId: { followerId, followingId } },
    create: { followerId, followingId },
    update: {},
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

/** DELETE /api/follow
 *  Body: { followerId, followingId }
 *  Removes a follow relationship. Idempotent — no error if not found.
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { followerId, followingId } = (body ?? {}) as Record<string, string>;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: "followerId and followingId are required." }, { status: 400 });
  }

  await prisma.follow.deleteMany({
    where: { followerId, followingId },
  });

  return NextResponse.json({ ok: true });
}
