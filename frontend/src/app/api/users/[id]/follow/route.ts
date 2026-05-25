/**
 * POST   /api/users/[id]/follow — create follow row (idempotent on duplicate).
 * DELETE /api/users/[id]/follow — remove follow row.
 * Auth required. Cannot follow yourself. [id] must be a user UUID.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { isValidUserId, viewerFollowsTarget } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

async function resolveTarget(id: string) {
  if (!isValidUserId(id)) return { error: err("Invalid user id.", 400) };
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!target) return { error: err("User not found.", 404) };
  return { target };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const { id } = await params;
  if (id === payload.sub) return err("You cannot follow yourself.", 400);

  const resolved = await resolveTarget(id);
  if (resolved.error) return resolved.error;

  try {
    await prisma.follow.create({
      data: { followerId: payload.sub, followingId: id },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code !== "P2002") {
      console.error("[POST follow]", e);
      return err("Could not follow user.", 500);
    }
  }

  const isFollowing = await viewerFollowsTarget(payload.sub, id);
  return ok({ isFollowing });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const { id } = await params;
  const resolved = await resolveTarget(id);
  if (resolved.error) return resolved.error;

  await prisma.follow.deleteMany({
    where: { followerId: payload.sub, followingId: id },
  });

  const isFollowing = await viewerFollowsTarget(payload.sub, id);
  return ok({ isFollowing });
}
