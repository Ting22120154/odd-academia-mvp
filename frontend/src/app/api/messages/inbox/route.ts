import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

/** GET /api/messages/inbox
 *  Returns one entry per conversation partner for the session user, most recent first.
 */
export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const userId = auth.payload.sub;

  const messages = await prisma.message.findMany({
    where: {
      OR: [{ recipientId: userId }, { senderId: userId }],
    },
    include: {
      sender:    { select: { id: true, fullName: true, avatarUrl: true } },
      recipient: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Map<string, typeof messages[number]>();
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.recipientId : msg.senderId;
    if (!seen.has(partnerId)) seen.set(partnerId, msg);
  }

  const conversations = Array.from(seen.values()).map((msg) => {
    const isSent    = msg.senderId === userId;
    const partner   = isSent ? msg.recipient : msg.sender;
    const unreadCount = messages.filter(
      (m) => m.senderId === partner.id && m.recipientId === userId && !m.isRead
    ).length;
    const senderLastMsgRead = isSent ? msg.isRead : false;
    return {
      partnerId:         partner.id,
      partnerName:       partner.fullName,
      lastMessage:       msg.body,
      lastAt:            msg.createdAt,
      isSent,
      unread:            unreadCount,
      senderLastMsgRead,
    };
  });

  return NextResponse.json(conversations);
}
