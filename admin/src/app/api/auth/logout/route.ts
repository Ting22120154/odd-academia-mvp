/**
 * POST /api/auth/logout
 *
 * Clears the oa_admin_token cookie, effectively ending the admin session.
 * The middleware will then redirect any subsequent protected-route request
 * back to /login.
 */

import { ok } from "@/lib/response";

export async function POST() {
  const res = ok({ message: "Logged out." });

  // Overwrite the cookie with an empty value and maxAge 0 to delete it
  res.cookies.set("oa_admin_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
