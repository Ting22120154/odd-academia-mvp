import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_TOKEN_COOKIE = "oa_user_token";
const AUTH_SESSION_COOKIE = "auth-session";

const PUBLIC_ROUTES = ["/login"];
const AUTH_ONLY_PREFIXES = ["/profile", "/notifications", "/upload", "/following"];

function decodeToken(token: string): { role: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function getSession(req: NextRequest) {
  const token = req.cookies.get(USER_TOKEN_COOKIE)?.value;
  const payload = token ? decodeToken(token) : null;
  if (payload?.role === "user" || payload?.role === "admin") {
    return "user" as const;
  }
  if (req.cookies.get(AUTH_SESSION_COOKIE)?.value === "guest") {
    return "guest" as const;
  }
  return "anonymous" as const;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = getSession(request);
  const isLoggedIn = session === "user";

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthOnly && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
