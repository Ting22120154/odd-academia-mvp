/** GET /api/papers/[id]/follow-status — { isFollowing, followerCount } */
import { NextRequest } from "next/server";
import { getAuthPayload } from "@/lib/auth/require-auth";
import {
  countPaperFollowers,
  isValidPaperId,
  viewerFollowsPaper,
} from "@/lib/auth/paper-follow";
import prisma from "@odd-academia/db/client";
import { ok, err } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isValidPaperId(id)) return err("Invalid paper id.", 400);

  const paper = await prisma.paper.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!paper || paper.status !== "published") {
    return err("Paper not found.", 404);
  }

  const viewer = await getAuthPayload();
  const [isFollowing, followerCount] = await Promise.all([
    viewerFollowsPaper(viewer?.sub, id),
    countPaperFollowers(id),
  ]);

  return ok({ isFollowing, followerCount });
}
