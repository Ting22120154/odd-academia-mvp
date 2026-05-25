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
import { profileInclude, toProfilePaper, toProfileUser } from "@/lib/auth/profile";
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
    include: profileInclude,
  });

  if (!user) return err("User not found.", 404);

  const isOwnProfile = viewer?.sub === user.id;
  if (!user.profileVisibility && !isOwnProfile) {
    return err("This profile is private.", 403);
  }

  const papers = await prisma.paper.findMany({
    where: { authorId: id, status: "published" },
    include: { keywords: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const profile = toProfileUser(user, papers.map(toProfilePaper), {
    viewerId: viewer?.sub,
    includeEmail: isOwnProfile,
  });

  const isFollowing =
    !isOwnProfile && viewer?.sub
      ? await viewerFollowsTarget(viewer.sub, id)
      : false;

  return ok({ user: profile, isFollowing });
}
