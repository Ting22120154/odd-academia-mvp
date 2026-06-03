import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

/** GET /api/messages/unread-count
 *  Returns { count: number } — total unread messages for the session user.
 */
export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const count = await prisma.message.count({
    where: { recipientId: auth.payload.sub, isRead: false },
  });

  return NextResponse.json({ count });
}
