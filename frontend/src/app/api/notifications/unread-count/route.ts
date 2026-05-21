import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/notifications/unread-count?userId=<id>
 *  Returns just the unread notification count — lightweight endpoint for polling.
 *  REALTIME: Notifications must update via WebSocket/SSE, not on page load only
 *  TODO: If using polling, replace with WebSocket before production
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return NextResponse.json({ count });
}
