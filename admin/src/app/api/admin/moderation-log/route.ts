import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const logs = await prisma.moderationLog.findMany({
    include: { admin: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(logs);
}
