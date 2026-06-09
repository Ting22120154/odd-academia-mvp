// Security posture: messages are transmitted over HTTPS (TLS in transit) and
// stored in Neon PostgreSQL which encrypts data at rest. Message bodies are
// stored as plaintext in the DB — no application-level encryption is applied.
// For true end-to-end encryption, a per-user keypair and client-side crypto
// library would be required (significant scope — not in current release).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

/** GET /api/messages?with=<otherId>
 *  Returns the full conversation thread for the session user, sorted oldest first.
 *  Also marks any unread messages sent to the session user as read.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const { searchParams } = new URL(req.url);
  const with_ = searchParams.get("with");

  if (!with_) {
    return NextResponse.json({ error: "with query param is required." }, { status: 400 });
  }

  const me = auth.payload.sub;

  await prisma.message.updateMany({
    where: { senderId: with_, recipientId: me, isRead: false },
    data:  { isRead: true },
  });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me,    recipientId: with_ },
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
 *  Body: { recipientId, body }
 *  Sender is always the session user.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  if (!checkRateLimit(`messages:${auth.payload.sub}`, 20, 60_000)) {
    return err("Too many messages. Please slow down.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { recipientId, body: msgBody } = body as Record<string, string>;

  if (!recipientId) return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
  if (!msgBody?.trim()) return NextResponse.json({ error: "body is required." }, { status: 400 });

  const recipientExists = await prisma.user.findUnique({
    where:  { id: recipientId },
    select: { id: true },
  });
  if (!recipientExists) return NextResponse.json({ error: "Recipient not found." }, { status: 404 });
  if (recipientId === auth.payload.sub) {
    return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId:    auth.payload.sub,
      recipientId,
      subject:     "",
      body:        msgBody.trim(),
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
