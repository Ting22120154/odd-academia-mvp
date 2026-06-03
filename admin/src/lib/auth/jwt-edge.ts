/**
 * JWT verify for admin middleware (Edge runtime).
 * Uses Web Crypto API (crypto.subtle) — available in Edge without any external dependency.
 */
import type { TokenPayload } from "@/lib/auth/jwt";

function b64urlToBytes(b64url: string): Uint8Array {
  const base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatureBytes = b64urlToBytes(signatureB64);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, data);
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    const { sub, email, role } = payload;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    if (role !== "admin") return null;

    return { sub, email, role };
  } catch {
    return null;
  }
}
