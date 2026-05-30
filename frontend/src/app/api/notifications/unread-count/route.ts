import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";

/** GET /api/notifications/unread-count
 *  Lightweight endpoint for badge polling — returns { count: number } for the session user.
 */
export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return NextResponse.json({ count: 0 });

  const count = await prisma.notification.count({
    where: { userId: payload.sub, isRead: false },
  });

  return NextResponse.json({ count });
}
