import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

/** GET /api/reports/count — returns { pending: number } for the sidebar badge */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const [comment, paper, user] = await Promise.all([
    prisma.commentReport.count({ where: { status: "pending" } }),
    prisma.paperReport.count({ where: { status: "pending" } }),
    prisma.userReport.count({ where: { status: "pending" } }),
  ]);

  return ok({ pending: comment + paper + user });
}
