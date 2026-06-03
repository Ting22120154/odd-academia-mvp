/**
 * Server-side auth for Route Handlers.
 * Use requireAuthPayload() for protected APIs (handles ban → 403).
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getBearerUserId, verifyToken, type TokenPayload } from "@/lib/auth/jwt";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

export type AuthPayloadResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; error: string; status: number };

export async function requireAuthPayload(): Promise<AuthPayloadResult> {
  const token = (await cookies()).get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return { ok: false, error: "Not authenticated.", status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload?.sub) {
    return { ok: false, error: "Not authenticated.", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { isBanned: true },
  });
  if (!user) {
    return { ok: false, error: "Not authenticated.", status: 401 };
  }
  if (user.isBanned) {
    return { ok: false, error: "Account suspended.", status: 403 };
  }

  return { ok: true, payload };
}

/** Returns payload only when JWT is valid and user is not banned. */
export async function getAuthPayload(): Promise<TokenPayload | null> {
  const auth = await requireAuthPayload();
  return auth.ok ? auth.payload : null;
}

/** Cookie session first, then Bearer — for papers/posts APIs after auth merge. */
export async function getRouteUserId(req: Request): Promise<string | null> {
  const auth = await requireAuthPayload();
  if (auth.ok) return auth.payload.sub;

  const bearerId = getBearerUserId(req);
  if (!bearerId) return null;

  const user = await prisma.user.findUnique({
    where: { id: bearerId },
    select: { isBanned: true },
  });
  if (!user || user.isBanned) return null;

  return bearerId;
}
