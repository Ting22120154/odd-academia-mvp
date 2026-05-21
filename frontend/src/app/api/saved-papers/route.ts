import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as savedPaperService from "@/modules/saved-papers/saved-paper.service";

/** GET /api/saved-papers — list papers saved by the current user */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  try {
    const [papers, count] = await Promise.all([
      savedPaperService.listSavedPapers(auth.user.id),
      savedPaperService.countSavedPapers(auth.user.id),
    ]);
    return jsonOk({ papers, count });
  } catch {
    return jsonError("Failed to load saved papers", 500);
  }
}
