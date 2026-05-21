import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/messages/inbox?userId=<id>
 *  Returns one entry per conversation partner, showing the latest message.
 *  Ordered by most recent message first.
 */
export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

  // Get all messages involving this user
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

  // Group by conversation partner, keep only the latest message per partner
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
    // true when the recipient has opened the conversation (GET fires isRead=true on our sent msg)
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
