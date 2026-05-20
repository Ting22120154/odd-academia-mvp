import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const logs = await prisma.moderationLog.findMany({
    include: { admin: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ok(logs);
}
