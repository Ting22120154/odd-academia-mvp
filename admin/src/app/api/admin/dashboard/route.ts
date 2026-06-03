import { ok } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

function parseRange(req: Request): { from: Date; to: Date } | null {
  const url = new URL(req.url);
  const fromRaw = url.searchParams.get("from");
  const toRaw = url.searchParams.get("to");
  if (!fromRaw || !toRaw) return null;
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return { from, to };
}

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const range = parseRange(req);
  const createdAt = range ? { gte: range.from, lte: range.to } : undefined;

  const [
    userCount,
    paperCount,
    bannedCount,
    commentCount,
    pendingCommentReports,
    pendingPaperReports,
    pendingUserReports,
    recentUsers,
    recentPapers,
  ] = await Promise.all([
    prisma.user.count({ where: createdAt ? { createdAt } : undefined }),
    prisma.paper.count({ where: createdAt ? { createdAt } : undefined }),
    prisma.user.count({ where: { isBanned: true, ...(createdAt ? { createdAt } : {}) } }),
    prisma.comment.count({ where: createdAt ? { createdAt } : undefined }),
    prisma.commentReport.count({ where: { status: "pending", ...(createdAt ? { createdAt } : {}) } }),
    prisma.paperReport.count({ where: { status: "pending", ...(createdAt ? { createdAt } : {}) } }),
    prisma.userReport.count({ where: { status: "pending", ...(createdAt ? { createdAt } : {}) } }),
    prisma.user.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, email: true, createdAt: true, isBanned: true },
    }),
    prisma.paper.findMany({
      where: createdAt ? { createdAt } : undefined,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, authorId: true, status: true },
    }),
  ]);

  const pendingReportCount = pendingCommentReports + pendingPaperReports + pendingUserReports;

  return ok({
    userCount,
    paperCount,
    bannedCount,
    commentCount,
    pendingReportCount,
    recentUsers,
    recentPapers,
  });
}
