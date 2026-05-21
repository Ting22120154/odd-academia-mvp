import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/messages?me=<myId>&with=<otherId>
 *  Returns the full conversation thread, sorted oldest first.
 *  Also marks any unread messages sent to `me` as read.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const me   = searchParams.get("me");
  const with_ = searchParams.get("with");

  if (!me || !with_) {
    return NextResponse.json({ error: "me and with query params are required." }, { status: 400 });
  }

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: with_, recipientId: me, isRead: false },
    data:  { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me,   recipientId: with_ },
        { senderId: with_, recipientId: me   },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id:          true,
      senderId:    true,
      recipientId: true,
      body:        true,
      isRead:      true,
      createdAt:   true,
    },
  });

  return NextResponse.json(messages);
}

/** POST /api/messages
 *  Body: { senderId, recipientId, body }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { senderId, recipientId, body: msgBody } = body as Record<string, string>;

  if (!senderId)    return NextResponse.json({ error: "senderId is required." },    { status: 400 });
  if (!recipientId) return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
  if (!msgBody?.trim()) return NextResponse.json({ error: "body is required." },    { status: 400 });

  // Verify both users exist — guards against stale mock IDs in localStorage
  const [senderExists, recipientExists] = await Promise.all([
    prisma.user.findUnique({ where: { id: senderId },    select: { id: true } }),
    prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } }),
  ]);
  if (!senderExists)    return NextResponse.json({ error: "SESSION_STALE" }, { status: 401 });
  if (!recipientExists) return NextResponse.json({ error: "Recipient not found." }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId,
      subject: "",
      body: msgBody.trim(),
    },
    select: {
      id:        true,
      senderId:  true,
      body:      true,
      isRead:    true,
      createdAt: true,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
