import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
  if (!notif)                       return err("Not found.", 404);
  if (notif.userId !== payload.sub) return err("Forbidden.", 403);

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}

// DELETE /api/notifications/[id] — hard delete (persists across reloads)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const { id } = await params;
  const notif = await prisma.notification.findUnique({ where: { id }, select: { userId: true } });
  if (!notif)                       return err("Not found.", 404);
  if (notif.userId !== payload.sub) return err("Forbidden.", 403);

  await prisma.notification.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
