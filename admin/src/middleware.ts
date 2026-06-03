/**
 * Next.js Middleware — runs on every matched request before it reaches a page or API route.
 *
 * Responsibilities:
 *  - Protect all admin pages: redirect unauthenticated visitors to /login
 *  - Prevent authenticated admins from seeing /login again (redirect to /dashboard)
 *  - Leave /api routes and static assets untouched
 *
 * Uses verifyTokenEdge (jose / Web Crypto) for proper signature verification in Edge Runtime.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/auth/jwt-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle their own auth — let them through unconditionally
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("oa_admin_token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;
  const isAuthenticated = payload?.role === "admin";

  // If an authenticated admin navigates to /login, redirect to dashboard
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
