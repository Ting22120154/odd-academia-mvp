/**
 * POST   /api/papers/[id]/follow — follow a published paper (idempotent).
 * DELETE /api/papers/[id]/follow — unfollow.
 */
import { NextRequest } from "next/server";
import prisma from "@odd-academia/db/client";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import {
  countPaperFollowers,
  isValidPaperId,
  viewerFollowsPaper,
} from "@/lib/auth/paper-follow";
import { ok, err } from "@/lib/response";

async function resolvePublishedPaper(id: string) {
  if (!isValidPaperId(id)) return { error: err("Invalid paper id.", 400) };
  const paper = await prisma.paper.findUnique({
    where: { id },
    select: { id: true, status: true, authorId: true },
  });
  if (!paper || paper.status !== "published") {
    return { error: err("Paper not found.", 404) };
  }
  return { paper };
}

async function followPayload(viewerId: string | undefined, paperId: string) {
  const [isFollowing, followerCount] = await Promise.all([
    viewerFollowsPaper(viewerId, paperId),
    countPaperFollowers(paperId),
  ]);
  return { isFollowing, followerCount };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);
  const payload = auth.payload;

  const { id } = await params;
  const resolved = await resolvePublishedPaper(id);
  if (resolved.error) return resolved.error;

  let alreadyFollowing = false;
  try {
    await prisma.paperFollow.create({
      data: { userId: payload.sub, paperId: id },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      alreadyFollowing = true;
    } else {
      console.error("[POST paper follow]", e);
      return err("Could not follow paper.", 500);
    }
  }

  if (!alreadyFollowing && resolved.paper.authorId !== payload.sub) {
    await prisma.notification.create({
      data: {
        userId: resolved.paper.authorId,
        type: "follow",
        referenceId: id,
        referenceType: "paper",
        actorId: payload.sub,
      },
    }).catch((e) => console.error("[paper follow] notification failed:", e));
  }

  return ok(await followPayload(payload.sub, id));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);
  const payload = auth.payload;

  const { id } = await params;
  const resolved = await resolvePublishedPaper(id);
  if (resolved.error) return resolved.error;

  await prisma.paperFollow.deleteMany({
    where: { userId: payload.sub, paperId: id },
  });

  return ok(await followPayload(payload.sub, id));
}
