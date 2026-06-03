import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";
import * as notificationService from "@/modules/notifications/notification.service";
import { parseNotificationIdParam } from "@/modules/notifications/notification.validation";

/** PATCH /api/notifications/[id] — mark single notification as read */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const { id } = await params;
  const parsed = parseNotificationIdParam(id);
  if (!parsed.ok) return err(parsed.error, 400);

  try {
    await notificationService.markNotificationRead(parsed.data, auth.payload.sub);
    return NextResponse.json({ ok: true, read: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_FOUND") return err("Notification not found.", 404);
    return err("Failed to mark notification as read.", 500);
  }
}

/** DELETE /api/notifications/[id] — hard delete */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
  if (!notif) return err("Not found.", 404);
  if (notif.userId !== auth.payload.sub) return err("Forbidden.", 403);

  await prisma.notification.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
