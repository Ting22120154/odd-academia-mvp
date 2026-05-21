import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/notifications?userId=<id>
 *  Returns all notifications for the given user, newest first.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const notifications = await prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}

/** PATCH /api/notifications
 *  Body: { userId }
 *  Marks all unread notifications for the user as read.
 *  BADGE: Unread count must decrement as notifications are marked read
 */
export async function PATCH(req: NextRequest) {
  const body   = await req.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
