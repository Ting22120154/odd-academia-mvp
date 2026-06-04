/**
 * GET /api/auth/me
 * Returns the logged-in user from JWT sub. Used by AuthContext on load and after profile save.
 */
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { toPublicUser } from "@/lib/auth/user";
import { ok, err } from "@/lib/response";

export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const user = await prisma.user.findUnique({ where: { id: auth.payload.sub } });
  if (!user) {
    return err("User not found.", 404);
  }

  return ok({ user: toPublicUser(user) });
}
