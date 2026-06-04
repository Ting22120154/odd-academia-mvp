import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as commentService from "@/modules/comments/comment.service";
import { parseCreateCommentBody } from "@/modules/comments/comment.validation";

/** POST /api/comments — add comment or reply */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const raw = await req.json().catch(() => null);
  const parsed = parseCreateCommentBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const comment = await commentService.createComment(auth.user.id, parsed.data);
    return jsonOk({ comment }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "PAPER_NOT_FOUND") return jsonError("Paper not found", 404);
    if (msg === "PARENT_NOT_FOUND") return jsonError("Parent comment not found", 404);
    if (msg === "CONTENT_REQUIRED") return jsonError("Content is required", 400);
    console.error("[POST /api/comments] Unhandled error:", e);
    return jsonError("Failed to create comment", 500);
  }
}
