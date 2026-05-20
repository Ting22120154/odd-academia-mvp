import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("oa_admin_token")?.value;
  if (!token || !verifyToken(token)) return err("Unauthorised.", 401);

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, Number(searchParams.get("page")  ?? "1"));
  const limit  = Math.max(1, Number(searchParams.get("limit") ?? "20"));
  const skip   = (page - 1) * limit;

  const where = search.trim()
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { email:    { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id:        true,
        fullName:  true,
        email:     true,
        username:  true,
        jobTitle:  true,
        createdAt: true,
        isBanned:  true,
        warnCount: true,
        role:      true,
        _count: {
          select: {
            papers:    true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return ok({ users, total, page, limit });
}
