/** GET /api/users/me/followers — list of followers; isFollowing=true if you follow them back. */
import { getAuthPayload } from "@/lib/auth/require-auth";
import { listFollowerAuthors } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const people = await listFollowerAuthors(payload.sub);
  return ok({ people });
}
