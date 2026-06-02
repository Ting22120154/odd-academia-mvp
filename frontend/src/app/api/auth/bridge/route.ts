import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { AUTH_USER_COOKIE } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * Mock-login bridge: map email to a seeded Neon user and set auth-user-id cookie
 * so comment/save APIs can authenticate until real auth ships.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return jsonError("email is required", 400);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, fullName: true, email: true, avatarUrl: true },
  });
  if (!user) return jsonError("User not found for this email", 404);

  const res = jsonOk({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? undefined,
    },
  });
  res.cookies.set(AUTH_USER_COOKIE, user.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return res;
}
