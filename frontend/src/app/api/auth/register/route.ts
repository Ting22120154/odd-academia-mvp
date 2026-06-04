/**
 * POST /api/auth/register
 * Creates a User in Postgres (role forced to "user"), hashes password, sets session cookies.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import { attachSessionCookies } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/modules/notifications/notification-settings.types";
import { ok, err } from "@/lib/response";

const REGISTER_LIMIT = 5;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`auth:register:${ip}`, REGISTER_LIMIT, WINDOW_MS)) {
    return err("Too many sign-up attempts. Please try again later.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.fullName || !body?.username) {
    return err("Full name, username, email, and password are required.", 400);
  }

  const email = String(body.email).trim().toLowerCase();
  const username = String(body.username).trim().toLowerCase();
  const fullName = String(body.fullName).trim();
  const password = String(body.password);

  if (!fullName) return err("Full name is required.", 400);
  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return err("Username must be 3–30 characters (letters, numbers, underscore).", 400);
  }
  if (password.length < 8) {
    return err("Password must be at least 8 characters.", 400);
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        passwordHash,
        role: "user", // Never allow self-registration as admin
        notificationSettings: {
          create: DEFAULT_NOTIFICATION_SETTINGS,
        },
      },
    });

    const res = ok({ user: toPublicUser(user) });
    return attachSessionCookies(res, {
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    const message = e instanceof Error ? e.message : "";
    if (code === "P2002") {
      return err("Email or username is already taken.", 409);
    }
    if (message.includes("DATABASE_URL")) {
      return err(
        "Database is not configured. Add DATABASE_URL to frontend/.env.local (see frontend/.env.example).",
        503
      );
    }
    console.error("[register]", e);
    return err("Could not create account. Check the server terminal for details.", 500);
  }
}
