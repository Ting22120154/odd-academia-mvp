/**
 * PATCH /api/auth/account
 *
 * Updates the admin email and/or password in the in-memory store.
 * Requires the current password to authorise any change.
 *
 * Body: { currentPassword: string, newEmail?: string, newPassword?: string }
 */

import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { adminCredentials } from "@/lib/auth/store";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.currentPassword) {
    return err("Current password is required.", 400);
  }

  if (body.currentPassword !== adminCredentials.password) {
    return err("Current password is incorrect.", 401);
  }

  if (body.newEmail)    adminCredentials.email    = body.newEmail;
  if (body.newPassword) adminCredentials.password = body.newPassword;

  return ok({ message: "Account updated." });
}
