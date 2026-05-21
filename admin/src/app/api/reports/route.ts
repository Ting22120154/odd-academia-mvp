import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get("type")   ?? "all"; // paper | comment | user | all
  const status = searchParams.get("status") ?? "all"; // pending | reviewed | dismissed | all
  const page   = Math.max(1, Number(searchParams.get("page")  ?? "1"));
  const limit  = Math.max(1, Number(searchParams.get("limit") ?? "20"));
  const skip   = (page - 1) * limit;

  const statusFilter =
    status !== "all"
      ? { status: status as "pending" | "reviewed" | "dismissed" }
      : {};

  // SORT: Always ORDER BY createdAt DESC — newest reports surface first
  const [paperReports, commentReports, userReports] = await Promise.all([
    type === "all" || type === "paper"
      ? prisma.paperReport.findMany({
          where: statusFilter,
          include: {
            paper:    { select: { id: true, title: true } },
            reporter: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { createdAt: "desc" },
          skip:    type === "paper" ? skip  : 0,
          take:    type === "paper" ? limit : 1000,
        })
      : Promise.resolve([]),

    type === "all" || type === "comment"
      ? prisma.commentReport.findMany({
          where: statusFilter,
          include: {
            comment: {
              include: {
                author: { select: { id: true, fullName: true, username: true } },
                paper:  { select: { id: true, title: true } },
              },
            },
            reporter: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { createdAt: "desc" },
          skip:    type === "comment" ? skip  : 0,
          take:    type === "comment" ? limit : 1000,
        })
      : Promise.resolve([]),

    type === "all" || type === "user"
      ? prisma.userReport.findMany({
          where: statusFilter,
          include: {
            reported: { select: { id: true, fullName: true, username: true } },
            reporter: { select: { id: true, fullName: true, username: true } },
          },
          orderBy: { createdAt: "desc" },
          skip:    type === "user" ? skip  : 0,
          take:    type === "user" ? limit : 1000,
        })
      : Promise.resolve([]),
  ]);

  return ok({ paperReports, commentReports, userReports });
}
