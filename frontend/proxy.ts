/**
 * Next.js proxy — page-level access control only (UI routing).
 * - Does NOT protect /api/* (each route calls getAuthPayload + jwt.verify).
 * - Uses verifyTokenEdge() — jsonwebtoken does not run reliably in proxy.
 * - Redirects anonymous users away from AUTH_ONLY_PREFIXES to /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";
import { USER_TOKEN_COOKIE, AUTH_SESSION_COOKIE } from "@/lib/auth/session";

const PUBLIC_ROUTES = ["/login"];
const AUTH_ONLY_PREFIXES = [
  "/profile",
  "/notifications",
  "/upload",
  "/following",
];

async function getSession(req: NextRequest) {
  const token = req.cookies.get(USER_TOKEN_COOKIE)?.value;
  const payload = token ? await verifyTokenEdge(token) : null;
  if (payload?.role === "user" || payload?.role === "admin") {
    return "user" as const;
  }
  if (req.cookies.get(AUTH_SESSION_COOKIE)?.value === "guest") {
    return "guest" as const;
  }
  return "anonymous" as const;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);
  const isLoggedIn = session === "user";

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
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
    // Skip file upload API so proxy does not truncate multipart bodies (see proxyClientMaxBodySize).
    "/((?!_next/static|_next/image|favicon.ico|api/papers/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
