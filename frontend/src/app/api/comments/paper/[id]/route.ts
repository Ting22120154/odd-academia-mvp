import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getRouteUserId } from "@/lib/auth/require-auth";
import * as commentService from "@/modules/comments/comment.service";
import { parsePaperIdParam } from "@/modules/comments/comment.validation";

/** GET /api/comments/paper/:id — threaded comments for a paper */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = parsePaperIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  const viewerId = await getRouteUserId(req);

  try {
    const comments = await commentService.getCommentsForPaper(parsed.data, viewerId);
    return jsonOk({ comments });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "PAPER_NOT_FOUND") return jsonError("Paper not found", 404);
    const detail = process.env.NODE_ENV === "development" ? `: ${msg}` : "";
    return jsonError(`Failed to load comments${detail}`, 500);
  }
}
