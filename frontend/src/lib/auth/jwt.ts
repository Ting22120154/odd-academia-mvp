import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "oa-frontend-dev-secret";

export type UserTokenPayload = jwt.JwtPayload & {
  userId?: string;
  email?: string;
};

export function signUserToken(userId: string, email: string): string {
  return jwt.sign({ userId, sub: userId, email }, SECRET, { expiresIn: "7d" });
}

export function verifyUserToken(token: string): UserTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as UserTokenPayload;
  } catch {
    return null;
  }
}

/** Extract authenticated user id from `Authorization: Bearer` header. */
export function getBearerUserId(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyUserToken(token);
  if (!payload) return null;

  if (typeof payload.userId === "string") return payload.userId;
  if (typeof payload.sub === "string") return payload.sub;
  return null;
}
