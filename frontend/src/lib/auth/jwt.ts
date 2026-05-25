import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "oa-frontend-dev-secret";

export type UserTokenPayload = jwt.JwtPayload & {
  userId: string;
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
