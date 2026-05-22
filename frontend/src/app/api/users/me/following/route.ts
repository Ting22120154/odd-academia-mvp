/** GET /api/users/me/following — list of users the current user follows (for /following page). */
import { getAuthPayload } from "@/lib/auth/require-auth";
import { listFollowingAuthors } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const people = await listFollowingAuthors(payload.sub);
  return ok({ people });
}
