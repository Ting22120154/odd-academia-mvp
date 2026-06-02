import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as savedPaperService from "@/modules/saved-papers/saved-paper.service";
import { parsePaperIdParam } from "@/modules/saved-papers/saved-paper.validation";

/** GET /api/papers/:id/save — whether the current user saved this paper */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parsePaperIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const status = await savedPaperService.getSaveStatus(auth.user.id, parsed.data);
    return jsonOk(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "PAPER_NOT_FOUND") return jsonError("Paper not found", 404);
    return jsonError("Failed to load save status", 500);
  }
}

/** POST /api/papers/:id/save — save paper (idempotent) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parsePaperIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const status = await savedPaperService.savePaper(auth.user.id, parsed.data);
    return jsonOk(status, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "PAPER_NOT_FOUND") return jsonError("Paper not found", 404);
    return jsonError("Failed to save paper", 500);
  }
}

/** DELETE /api/papers/:id/save — remove saved paper */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parsePaperIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const status = await savedPaperService.unsavePaper(auth.user.id, parsed.data);
    return jsonOk(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_SAVED") return jsonError("Paper is not saved", 404);
    return jsonError("Failed to unsave paper", 500);
  }
}
