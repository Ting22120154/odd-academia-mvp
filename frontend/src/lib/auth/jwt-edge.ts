/**
 * JWT verify for middleware (Edge runtime).
 * Do not import jsonwebtoken here — it breaks in Next.js middleware.
 * Tokens are still signed by signToken() in jwt.ts (jsonwebtoken, HS256).
 */
import { jwtVerify } from "jose";
import type { TokenPayload } from "@/lib/auth/jwt";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  const key = getSecretKey();
  if (!key) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const sub = payload.sub;
    const email = payload.email;
    const role = payload.role;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "user" && role !== "admin") return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}
