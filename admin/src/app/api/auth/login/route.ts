/**
 * POST /api/auth/login
 * Authenticates the admin against the AdminUser table.
 * On success, signs a JWT and stores it in an httpOnly cookie.
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.email || !body?.password) {
      return err("Email and password are required.", 400);
    }

    const adminEmail = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    const admin = await prisma.adminUser.findUnique({ where: { adminEmail } });
    if (!admin) {
      return err("Invalid email or password.", 401);
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return err("Invalid email or password.", 401);
    }

    const token = signToken({ sub: admin.id, email: admin.adminEmail, role: "admin" });

    const res = ok({ message: "Logged in." });
    res.cookies.set("oa_admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return err("Login service unavailable. Check admin server configuration.", 500);
  }
}
