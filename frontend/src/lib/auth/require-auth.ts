/**
 * Server-side auth for Route Handlers.
 * Call getAuthPayload() at the start of protected APIs; returns null → 401.
 */
import { cookies } from "next/headers";
import { getBearerUserId, verifyToken } from "@/lib/auth/jwt";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

export async function getAuthPayload() {
  const token = (await cookies()).get(USER_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Cookie session first, then Bearer — for papers/posts APIs after auth merge. */
export async function getRouteUserId(req: Request): Promise<string | null> {
  const payload = await getAuthPayload();
  if (payload?.sub) return payload.sub;

  return getBearerUserId(req);
}
