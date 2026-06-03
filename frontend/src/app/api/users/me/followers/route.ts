/** GET /api/users/me/followers — list of followers; isFollowing=true if you follow them back. */
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { listFollowerAuthors } from "@/lib/auth/follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const people = await listFollowerAuthors(auth.payload.sub);
  return ok({ people });
}
