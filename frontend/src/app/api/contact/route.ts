import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { err } from "@/lib/response";

export async function POST(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  if (!checkRateLimit(`contact:${auth.payload.sub}`, 10, 60_000)) {
    return err("Too many messages. Please slow down.", 429);
  }

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
      senderId:    auth.payload.sub,
      recipientId,
      subject:     subject.trim(),
      body:        msgBody.trim(),
      linkToPaper: typeof linkToPaper === "string" ? linkToPaper : null,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
