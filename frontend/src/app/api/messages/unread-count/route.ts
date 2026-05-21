import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/messages/unread-count?userId=<myId>
 *  Returns { count: number } — total unread messages for the user.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { recipientId: userId, isRead: false },
  });

  return NextResponse.json({ count });
}
