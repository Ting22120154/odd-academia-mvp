/**
 * POST /api/auth/login
 *
 * Authenticates the admin using hardcoded credentials (no database).
 * On success, signs a JWT and stores it in an httpOnly cookie so the
 * middleware can verify it on every subsequent request.
 *
 * TODO: Replace hardcoded credentials with a database lookup + bcrypt
 *       comparison once Prisma is wired up.
 */

import { NextRequest } from "next/server";
import { signToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";

// Hardcoded admin credentials — swap these out when DB auth is added
const ADMIN_EMAIL = "admin@oddacademia.com";
const ADMIN_PASSWORD = "Admin@1234";

export async function POST(req: NextRequest) {
  // Parse request body; return 400 if body is malformed
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return err("Email and password are required.", 400);
  }

  // Check credentials against hardcoded values
  if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
    return err("Invalid email or password.", 401);
  }

  // Sign a JWT containing the admin identity
  const token = signToken({ sub: "admin", email: ADMIN_EMAIL, role: "admin" });

  // Attach the token as an httpOnly cookie so it is invisible to JavaScript
  // and automatically sent with every request to this origin
  const res = ok({ message: "Logged in." });
  res.cookies.set("oa_admin_token", token, {
    httpOnly: true,   // not accessible via document.cookie
    sameSite: "lax",  // sent on same-site navigations, blocked on cross-site POSTs
    path: "/",        // available across all admin routes
    maxAge: 60 * 60 * 24, // expires after 1 day
  });

  return res;
}
