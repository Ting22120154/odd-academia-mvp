import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

const SECRET = process.env.JWT_SECRET ?? "oa-user-dev-secret";

export type TokenPayload = {
  sub: string;
  email: string;
  role: Role;
};

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
