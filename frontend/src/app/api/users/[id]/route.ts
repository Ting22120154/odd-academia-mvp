/**
 * GET /api/users/[id] — public profile by UUID.
 * - Private profiles (profileVisibility=false): 403 unless viewer is the owner.
 * - Email only included when viewing your own profile via /me, not here.
 * - Response includes isFollowing when the viewer is logged in.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { viewerFollowsTarget } from "@/lib/auth/follow";
import { isValidUserId } from "@/lib/auth/user-id";
import { loadProfile } from "@/lib/auth/load-profile";
import { ok, err } from "@/lib/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUserId(id)) return err("Invalid user id.", 400);

  const viewer = await getAuthPayload();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, profileVisibility: true },
  });

  if (!user) return err("User not found.", 404);

  const isOwnProfile = viewer?.sub === user.id;
  if (!user.profileVisibility && !isOwnProfile) {
    return err("This profile is private.", 403);
  }

  const profile = await loadProfile(id, {
    viewerId: viewer?.sub,
    includeEmail: isOwnProfile,
  });
  if (!profile) return err("User not found.", 404);

  const isFollowing =
    !isOwnProfile && viewer?.sub
      ? await viewerFollowsTarget(viewer.sub, id)
      : false;

  return ok({ user: profile, isFollowing });
}
