import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

/** GET /api/notifications
 *  Returns all notifications for the session user, newest first.
 */
export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const notifications = await prisma.notification.findMany({
    where:   { userId: payload.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}

/** PATCH /api/notifications
 *  Marks all unread notifications for the session user as read.
 */
export async function PATCH() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  await prisma.notification.updateMany({
    where: { userId: payload.sub, isRead: false },
    data:  { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
