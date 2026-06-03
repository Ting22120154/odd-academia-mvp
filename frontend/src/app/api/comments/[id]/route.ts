import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as commentService from "@/modules/comments/comment.service";
import {
  parseCommentIdParam,
  parseUpdateCommentBody,
} from "@/modules/comments/comment.validation";

/** PUT /api/comments/:id — edit own comment */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const idParsed = parseCommentIdParam(id);
  if (!idParsed.ok) return jsonError(idParsed.error, 400);

  const raw = await req.json().catch(() => null);
  const parsed = parseUpdateCommentBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const comment = await commentService.updateComment(idParsed.data, auth.user.id, parsed.data);
    return jsonOk({ comment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_FOUND") return jsonError("Comment not found", 404);
    if (msg === "FORBIDDEN") return jsonError("You can only edit your own comments", 403);
    if (msg === "CONTENT_REQUIRED") return jsonError("Content is required", 400);
    return jsonError("Failed to update comment", 500);
  }
}

/** DELETE /api/comments/:id — soft-delete own comment */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const idParsed = parseCommentIdParam(id);
  if (!idParsed.ok) return jsonError(idParsed.error, 400);

  try {
    await commentService.deleteComment(idParsed.data, auth.user.id);
    return jsonOk({ deleted: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_FOUND") return jsonError("Comment not found", 404);
    if (msg === "FORBIDDEN") return jsonError("You can only delete your own comments", 403);
    return jsonError("Failed to delete comment", 500);
  }
}
