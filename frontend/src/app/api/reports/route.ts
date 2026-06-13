import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

/**
 * POST /api/reports
 * Body for comment:  { type: "comment", commentId: string, reason: string }
 * Body for paper:    { type: "paper",   paperId: string,  subject: string, reason: string }
 * Body for user:     { type: "user",    reportedId: string, subject: string, reason: string }
 *
 * reporterId is always taken from the session — never trusted from the client.
 * Content snapshots (commentBody, paperTitle) are fetched server-side from the DB.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const ip = getClientIp(req);
  if (!checkRateLimit(`reports:${ip}`, 5, 60_000)) {
    return err("Too many reports. Please slow down.", 429);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const reporterId = auth.payload.sub;
  const { type } = body as Record<string, string>;

  if (type === "comment") {
    const { commentId, reason } = body as Record<string, string>;
    if (!commentId || !reason) {
      return NextResponse.json({ error: "commentId and reason are required." }, { status: 400 });
    }
    let comment: { content: string; authorId: string; author: { fullName: string } | null } | null = null;
    try {
      comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          content: true,
          authorId: true,
          author: { select: { fullName: true } },
        },
      });
    } catch {
      // Invalid UUID format — treat as not found
    }
    if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    if (comment.authorId === reporterId) {
      return NextResponse.json({ error: "You cannot report your own comment." }, { status: 400 });
    }

    const report = await prisma.commentReport.create({
      data: {
        commentId,
        commentBody:   comment.content,
        commentAuthor: comment.author?.fullName ?? null,
        reporterId,
        reason,
      },
    });
    return NextResponse.json(report, { status: 201 });
  }

  if (type === "paper") {
    const { paperId, subject, reason } = body as Record<string, string>;
    if (!paperId || !subject || !reason) {
      return NextResponse.json({ error: "paperId, subject and reason are required." }, { status: 400 });
    }
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: { title: true },
    }).catch(() => null);
    if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

    const report = await prisma.paperReport.create({
      data: { paperId, paperTitle: paper.title, reporterId, subject, reason },
    });
    return NextResponse.json(report, { status: 201 });
  }

  if (type === "user") {
    const { reportedId, subject, reason } = body as Record<string, string>;
    if (!reportedId || !subject || !reason) {
      return NextResponse.json({ error: "reportedId, subject and reason are required." }, { status: 400 });
    }
    const reported = await prisma.user.findUnique({
      where:  { id: reportedId },
      select: { id: true },
    });
    if (!reported) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (reportedId === reporterId) {
      return NextResponse.json({ error: "You cannot report yourself." }, { status: 400 });
    }

    const report = await prisma.userReport.create({
      data: { reportedId, reporterId, subject, reason },
    });
    return NextResponse.json(report, { status: 201 });
  }

  return NextResponse.json({ error: "type must be 'comment', 'paper', or 'user'." }, { status: 400 });
}
