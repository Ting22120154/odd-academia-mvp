/**
 * Session cookies after login/register.
 * - oa_user_token: signed JWT (httpOnly, not readable by client JS)
 * - auth-session: lightweight flag used by proxy.ts for route guards
 */
import type { NextResponse } from "next/server";
import { signToken, type TokenPayload } from "@/lib/auth/jwt";

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
