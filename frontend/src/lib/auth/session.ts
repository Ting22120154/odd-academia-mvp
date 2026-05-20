import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const AUTH_USER_COOKIE = "auth-user-id";

/** Read user id set on login (see AuthContext). */
export function getUserIdFromRequest(req: NextRequest): string | null {
  const header = req.headers.get("x-user-id")?.trim();
  if (header) return header;

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === AUTH_USER_COOKIE) {
      return decodeURIComponent(rest.join("=")) || null;
    }
  }
  return null;
}

type AuthUser = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  email: string;
  role: string;
};

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string; status: number };

/** Returns DB user or an error payload for API routes. */
export async function requireAuthUser(req: NextRequest): Promise<AuthResult> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return { ok: false, error: "Unauthorized", status: 401 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, avatarUrl: true, email: true, role: true },
  });
  if (!user) return { ok: false, error: "User not found", status: 401 };

  return { ok: true, user };
}

export { AUTH_USER_COOKIE };
