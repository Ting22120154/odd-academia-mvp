/**
 * POST /api/auth/login
 * Same generic error for wrong email vs wrong password (avoids account enumeration).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import { attachSessionCookies } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { ok, err } from "@/lib/response";

const LOGIN_LIMIT = 10;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`auth:login:${ip}`, LOGIN_LIMIT, WINDOW_MS)) {
    return err("Too many login attempts. Please try again later.", 429);
  }

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
