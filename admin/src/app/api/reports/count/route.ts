import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

/** GET /api/reports/count — returns { pending: number } for the sidebar badge */
export async function GET() {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const [comment, paper, user] = await Promise.all([
    prisma.commentReport.count({ where: { status: "pending" } }),
    prisma.paperReport.count({ where: { status: "pending" } }),
    prisma.userReport.count({ where: { status: "pending" } }),
  ]);

  return ok({ pending: comment + paper + user });
}
