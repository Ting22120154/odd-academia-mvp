import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as commentService from "@/modules/comments/comment.service";
import { parseCommentIdParam } from "@/modules/comments/comment.validation";

/** POST /api/comments/:id/like — like a comment (idempotent) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parseCommentIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const result = await commentService.likeComment(parsed.data, auth.user.id);
    return jsonOk(result, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_FOUND") return jsonError("Comment not found", 404);
    return jsonError("Failed to like comment", 500);
  }
}

/** DELETE /api/comments/:id/like — remove like */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parseCommentIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const result = await commentService.unlikeComment(parsed.data, auth.user.id);
    return jsonOk(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_LIKED") return jsonError("Comment is not liked", 404);
    return jsonError("Failed to unlike comment", 500);
  }
}
