import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import { attachSessionCookies } from "@/lib/auth/session";
import { ok, err } from "@/lib/response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return err("Email and password are required.", 400);
  }

  const email = String(body.email).trim().toLowerCase();
  const password = String(body.password);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return err("Invalid email or password.", 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return err("Invalid email or password.", 401);
  }

  const res = ok({ user: toPublicUser(user) });
  return attachSessionCookies(res, {
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}
