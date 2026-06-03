/**
 * JWT helpers for admin session tokens.
 *
 * Tokens are signed with JWT_SECRET from the environment.
 * A hardcoded fallback is used in local development so the app starts
 * without any .env setup — replace the fallback with a real secret in production.
 *
 * Token lifetime: 1 day (enforced both here and in the cookie maxAge).
 */

import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET environment variable is required");
const JWT_SECRET: string = SECRET;

/** Shape of the data encoded inside every admin JWT */
export interface TokenPayload {
  sub: string;   // subject — always "admin" for now
  email: string; // admin email address
  role: "admin"; // role guard used by adminGuard middleware
}

/**
 * Signs a new JWT with the given payload.
 * Called by the login route after credentials are verified.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

/**
 * Verifies a JWT and returns its payload, or null if invalid/expired.
 * Called by Next.js middleware on every incoming request.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    // Covers expired tokens, wrong signature, malformed tokens, etc.
    return null;
  }
}
