import type { NextResponse } from "next/server";
import { signToken, type TokenPayload } from "@/lib/auth/jwt";

export const USER_TOKEN_COOKIE = "oa_user_token";
export const AUTH_SESSION_COOKIE = "auth-session";

const WEEK = 60 * 60 * 24 * 7;

export function attachSessionCookies(res: NextResponse, payload: TokenPayload) {
  const token = signToken(payload);

  res.cookies.set(USER_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });

  res.cookies.set(AUTH_SESSION_COOKIE, "user", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });

  return res;
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(USER_TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
