/** POST /api/auth/logout — clears httpOnly session cookies. */
import { ok } from "@/lib/response";
import { clearSessionCookies } from "@/lib/auth/session";

export async function POST() {
  const res = ok({ message: "Logged out." });
  return clearSessionCookies(res);
}
