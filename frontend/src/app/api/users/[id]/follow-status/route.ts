/** GET /api/users/[id]/follow-status — { isFollowing, followerCount } for optional viewer. */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";import { isValidUserId, viewerFollowsTarget } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUserId(id)) return err("Invalid user id.", 400);

  const viewer = await getAuthPayload();
  const [isFollowing, target] = await Promise.all([
    viewerFollowsTarget(viewer?.sub, id),
    prisma.user.findUnique({
      where: { id },
      select: { _count: { select: { followers: true } } },
    }),
  ]);

  return ok({
    isFollowing,
    followerCount: target?._count.followers ?? 0,
  });
}
