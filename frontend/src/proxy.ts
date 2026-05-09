import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require any session
const PUBLIC_ROUTES = ["/login"];

// Routes guests cannot access (logged-in users only)
const AUTH_ONLY_PREFIXES = [
  "/upload",
  "/profile",
  "/notifications",
  "/analytics",
  "/formatting",
  "/papers",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("auth-session")?.value; // "user" | "guest" | undefined
  const isLoggedIn = session === "user";
  const isGuest = session === "guest";

  // Public route: redirect to "/" if already logged in, otherwise allow through
  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // No session at all → redirect to login
  if (!isLoggedIn && !isGuest) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Guest trying to access a logged-in-only page → redirect to login
  if (isGuest && AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
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
