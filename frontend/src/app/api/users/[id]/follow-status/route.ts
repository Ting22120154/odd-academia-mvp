/** GET /api/users/[id]/follow-status — { isFollowing } for optional viewer (false if logged out). */
import { NextRequest } from "next/server";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { isValidUserId, viewerFollowsTarget } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidUserId(id)) return err("Invalid user id.", 400);

  const viewer = await getAuthPayload();
  const isFollowing = await viewerFollowsTarget(viewer?.sub, id);

  return ok({ isFollowing });
}
