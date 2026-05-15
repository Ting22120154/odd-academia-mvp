/**
 * Next.js Middleware — runs on every matched request before it reaches a page or API route.
 *
 * Responsibilities:
 *  - Protect all admin pages: redirect unauthenticated visitors to /login
 *  - Prevent authenticated admins from seeing /login again (redirect to /dashboard)
 *  - Leave /api routes and static assets untouched
 *
 * Why we decode manually instead of using jsonwebtoken here:
 *  Next.js middleware runs on the Edge Runtime (a lightweight V8 sandbox on the server).
 *  The jsonwebtoken library relies on Node.js's built-in crypto module which is not
 *  available in that sandbox. Rather than adding a new dependency, we decode the JWT
 *  payload using atob() — which is available everywhere — and just check the expiry
 *  and role fields. The actual signature verification is handled by the API routes,
 *  which run in the full Node.js runtime where jsonwebtoken works fine.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Decodes the JWT payload without verifying the signature.
 * Returns null if the token is missing, malformed, or expired.
 *
 * Safe to use in Edge Runtime because it only uses atob(), which is a
 * standard Web API available in all environments (Edge, Node.js, browser).
 */
function decodeToken(token: string): { role: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // JWT uses base64url encoding — convert to standard base64 before decoding
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    // Reject tokens that have passed their expiry time
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read and decode the session cookie set by POST /api/auth/login
  const token = req.cookies.get("oa_admin_token")?.value;
  const payload = token ? decodeToken(token) : null;

  // A valid session must have the admin role
  const isAuthenticated = payload?.role === "admin";

  // API routes handle their own auth — let them through unconditionally
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // If an authenticated admin navigates to /login, skip it and go to the dashboard
  if (pathname.startsWith("/login")) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // All other routes are protected — bounce unauthenticated requests to /login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to every route except Next.js internals and static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
