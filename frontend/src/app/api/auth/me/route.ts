/**
 * GET /api/auth/me
 * Returns the logged-in user from JWT sub. Used by AuthContext on load and after profile save.
 */
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { toPublicUser } from "@/lib/auth/user";
import { ok, err } from "@/lib/response";

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) {
    return err("Not authenticated.", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return err("User not found.", 404);
  }

  return ok({ user: toPublicUser(user) });
}
