import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

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
