import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page")  ?? "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? "20"));
  const skip  = (page - 1) * limit;

  const where = { reports: { some: {} } };

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where,
      include: {
        author:  { select: { id: true, fullName: true, username: true } },
        paper:   { select: { id: true, title: true } },
        reports: {
          include: { reporter: { select: { id: true, fullName: true, username: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return ok({ comments, total });
}
