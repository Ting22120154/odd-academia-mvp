import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

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
    prisma.user.count(),
    prisma.paper.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.comment.count(),
    prisma.commentReport.count({ where: { status: "pending" } }),
    prisma.paperReport.count({ where: { status: "pending" } }),
    prisma.userReport.count({ where: { status: "pending" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, fullName: true, email: true, createdAt: true, isBanned: true },
    }),
    prisma.paper.findMany({
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
