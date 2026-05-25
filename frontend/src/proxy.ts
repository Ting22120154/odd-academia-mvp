import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require any session
const PUBLIC_ROUTES = ["/login"];

// Routes guests cannot access (logged-in users only)
const AUTH_ONLY_PREFIXES = [
  "/profile",
  "/notifications",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("auth-session")?.value; // "user" | "guest" | undefined
  const isLoggedIn = session === "user";
  const isGuest = session === "guest";

  // Always allow the login page — the client validates user + JWT together.
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Frontend-only MVP: allow browsing without a session (logged-out users).
  // Only gate pages that require a real account.
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
  if (isAuthOnly && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
