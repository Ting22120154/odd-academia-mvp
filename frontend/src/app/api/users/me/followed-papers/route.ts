/** GET /api/users/me/followed-papers — papers the current user follows. */
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { listFollowedPapers } from "@/lib/auth/paper-follow";
import { ok, err } from "@/lib/response";

export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const papers = await listFollowedPapers(auth.payload.sub);
  return ok({ papers });
}
