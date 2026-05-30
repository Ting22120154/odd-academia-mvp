import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";

/** GET /api/messages/unread-count
 *  Returns { count: number } — total unread messages for the session user.
 */
export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return NextResponse.json({ count: 0 });

  const count = await prisma.message.count({
    where: { recipientId: payload.sub, isRead: false },
  });

  return NextResponse.json({ count });
}
