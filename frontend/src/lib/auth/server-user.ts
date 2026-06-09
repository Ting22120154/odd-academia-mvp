import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

/** Logged-in user id for Server Components (null when guest). */
export async function getServerUserId(): Promise<string | null> {
  const token = (await cookies()).get(USER_TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub ?? null;
}
