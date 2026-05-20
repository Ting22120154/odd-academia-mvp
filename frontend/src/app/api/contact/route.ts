import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { senderId, recipientId, subject, body: msgBody, linkToPaper } =
    body as Record<string, unknown>;

  if (typeof senderId !== "string" || !senderId) {
    return NextResponse.json({ error: "Must be logged in to send a message." }, { status: 401 });
  }
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
      senderId,
      recipientId,
      subject:     subject.trim(),
      body:        msgBody.trim(),
      linkToPaper: typeof linkToPaper === "string" ? linkToPaper : null,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
