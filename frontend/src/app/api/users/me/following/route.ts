/** GET /api/users/me/following — list of users the current user follows (for /following page). */
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { listFollowingAuthors } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const people = await listFollowingAuthors(auth.payload.sub);
  return ok({ people });
}
