import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { err } from "@/lib/response";

/** Verifies the request carries a valid admin JWT (role === "admin"). */
export async function requireAdmin() {
  const token = (await cookies()).get("oa_admin_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "admin") {
    return { ok: false as const, response: err("Unauthorised.", 401) };
  }
  return { ok: true as const, payload };
}
