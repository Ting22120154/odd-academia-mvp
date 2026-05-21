import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { USER_TOKEN_COOKIE } from "@/lib/auth/session";

export async function getAuthPayload() {
  const token = (await cookies()).get(USER_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
