/**
 * JWT helpers for the frontend user app (not the admin app).
 * Tokens are stored in httpOnly cookies — see session.ts.
 * Set JWT_SECRET in frontend/.env.local (required — no fallback secret).
 */
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

export type TokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Papers API routes (Talha): read user id from Authorization Bearer header.
 * Prefer getRouteUserId() in route handlers — it also accepts the session cookie.
 */
export function getBearerUserId(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const payload = verifyToken(header.slice("Bearer ".length).trim());
  return payload?.sub ?? null;
}
