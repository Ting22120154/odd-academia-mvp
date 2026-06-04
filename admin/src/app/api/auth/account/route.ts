/**
 * PATCH /api/auth/account
 * Updates the admin email and/or password in the database.
 * Requires a valid oa_admin_token cookie and the current password.
 *
 * Body: { currentPassword: string, newEmail?: string, newPassword?: string }
 */

import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return err("Unauthorized.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.currentPassword) {
    return err("Current password is required.", 400);
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
  if (!admin) return err("Admin account not found.", 404);

  const valid = await bcrypt.compare(String(body.currentPassword), admin.passwordHash);
  if (!valid) return err("Current password is incorrect.", 401);

  const data: { adminEmail?: string; passwordHash?: string } = {};
  if (body.newEmail)    data.adminEmail    = String(body.newEmail).trim().toLowerCase();
  if (body.newPassword) data.passwordHash  = await bcrypt.hash(String(body.newPassword), 12);

  if (Object.keys(data).length === 0) {
    return err("No changes provided.", 400);
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data });

  return ok({ message: "Account updated." });
}
