import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

export async function POST(req: NextRequest) {
  const payload = await getAuthPayload();
  if (!payload) return err("Must be logged in to send a message.", 401);

  const sender = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { isBanned: true },
  });
  if (sender?.isBanned) return err("Account suspended.", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { recipientId, subject, body: msgBody, linkToPaper } =
    body as Record<string, unknown>;

  if (typeof recipientId !== "string" || !recipientId) {
    return NextResponse.json({ error: "recipientId is required." }, { status: 400 });
  }
  if (typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "subject is required." }, { status: 400 });
  }
  if (typeof msgBody !== "string" || !msgBody.trim()) {
    return NextResponse.json({ error: "body is required." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId:    payload.sub,
      recipientId,
      subject:     subject.trim(),
      body:        msgBody.trim(),
      linkToPaper: typeof linkToPaper === "string" ? linkToPaper : null,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
