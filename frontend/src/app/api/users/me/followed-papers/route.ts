/** GET /api/users/me/followed-papers — papers the current user follows. */
import { getAuthPayload } from "@/lib/auth/require-auth";
import { listFollowedPapers } from "@/lib/auth/paper-follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const papers = await listFollowedPapers(payload.sub);
  return ok({ papers });
}
