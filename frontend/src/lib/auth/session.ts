import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, type TokenPayload } from "@/lib/auth/jwt";

// ─── JWT session cookies (login/logout/proxy) ─────────────────────────────────
export const USER_TOKEN_COOKIE = "oa_user_token";
export const AUTH_SESSION_COOKIE = "auth-session";

const WEEK = 60 * 60 * 24 * 7;
const IS_PROD = process.env.NODE_ENV === "production";

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: IS_PROD,
  };
}

export function attachSessionCookies(res: NextResponse, payload: TokenPayload) {
  const token = signToken(payload);
  res.cookies.set(USER_TOKEN_COOKIE, token, sessionCookieOptions(WEEK));
  res.cookies.set(AUTH_SESSION_COOKIE, "user", sessionCookieOptions(WEEK));
  return res;
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(USER_TOKEN_COOKIE, "", sessionCookieOptions(0));
  res.cookies.set(AUTH_SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}

// ─── Legacy bridge session (comment / saved-paper / notification APIs) ────────
export const AUTH_USER_COOKIE = "auth-user-id";

/** Read legacy user id cookie set by auth bridge. */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get("x-user-id")?.trim();
  if (header) return header;

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === AUTH_USER_COOKIE) {
      return decodeURIComponent(rest.join("=")) || null;
    }
  }
  return null;
}

type AuthUser = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
  role: string;
};

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; status: number };

/** Returns DB user or an error payload for API routes. */
export async function requireAuthUser(req: NextRequest): Promise<AuthResult> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return { ok: false, error: "Unauthorized", status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, avatarUrl: true, email: true, role: true },
  });
  if (!user) return { ok: false, error: "User not found", status: 401 };

  return { ok: true, user };
}
