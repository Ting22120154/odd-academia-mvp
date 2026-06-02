import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/** POST /api/comments/:id/report — submit a comment report */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: commentId } = await params;

  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) return jsonError("Reason is required", 400);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { author: { select: { fullName: true } } },
  });
  if (!comment) return jsonError("Comment not found", 404);
  if (comment.isHidden) return jsonError("Comment not found", 404);
  if (comment.authorId === auth.user.id) return jsonError("Cannot report your own comment", 400);

  const report = await prisma.commentReport.create({
    data: {
      commentId,
      reporterId:    auth.user.id,
      reason,
      commentBody:   comment.content,
      commentAuthor: comment.author.fullName,
    },
  });

  return jsonOk({ reportId: report.id });
}
