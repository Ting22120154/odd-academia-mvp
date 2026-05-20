import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { type, reporterId } = body as Record<string, string>;

  if (!reporterId) {
    return NextResponse.json({ error: "Must be logged in to report." }, { status: 401 });
  }

  if (type === "comment") {
    const { commentId, reason } = body as Record<string, string>;
    if (!commentId || !reason) {
      return NextResponse.json({ error: "commentId and reason are required." }, { status: 400 });
    }
    const report = await prisma.commentReport.create({ data: { commentId, reporterId, reason } });
    return NextResponse.json(report, { status: 201 });
  }

  if (type === "paper") {
    const { paperId, subject, reason } = body as Record<string, string>;
    if (!paperId || !subject || !reason) {
      return NextResponse.json({ error: "paperId, subject and reason are required." }, { status: 400 });
    }
    const report = await prisma.paperReport.create({ data: { paperId, reporterId, subject, reason } });
    return NextResponse.json(report, { status: 201 });
  }

  if (type === "user") {
    const { reportedId, subject, reason } = body as Record<string, string>;
    if (!reportedId || !subject || !reason) {
      return NextResponse.json({ error: "reportedId, subject and reason are required." }, { status: 400 });
    }
    const report = await prisma.userReport.create({ data: { reportedId, reporterId, subject, reason } });
    return NextResponse.json(report, { status: 201 });
  }

  return NextResponse.json({ error: "type must be 'comment', 'paper', or 'user'." }, { status: 400 });
}
