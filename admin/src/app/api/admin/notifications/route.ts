import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

// REALTIME: Notifications must update via WebSocket/SSE, not on page load only
// TODO: If using polling, replace with WebSocket before production
// This endpoint is polled by the admin bell — returns pending report counts + preview list.

export async function GET(_req: NextRequest) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const [commentCount, paperCount, userCount, recentComments] = await Promise.all([
    prisma.commentReport.count({ where: { status: "pending" } }),
    prisma.paperReport.count({   where: { status: "pending" } }),
    prisma.userReport.count({    where: { status: "pending" } }),
    prisma.commentReport.findMany({
      where:   { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        reporter: { select: { fullName: true } },
        comment:  { select: { content: true, paper: { select: { id: true, title: true } } } },
      },
    }),
  ]);

  const pendingCount = commentCount + paperCount + userCount;

  const reports = recentComments.map(r => ({
    id:         r.id,
    type:       "comment" as const,
    text:       r.comment?.content ?? r.commentBody ?? "(comment unavailable)",
    paperTitle: r.comment?.paper?.title ?? "(unknown paper)",
    reportedBy: r.reporter.fullName,
    reason:     r.reason,
    createdAt:  r.createdAt,
  }));

  return ok({ pendingCount, commentCount, paperCount, userCount, reports });
}
