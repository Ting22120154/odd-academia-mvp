import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

export async function GET(req: NextRequest) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "50")));

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { username:  { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id:         true,
      fullName:   true,
      username:   true,
      workStatus: true,
      jobTitle:   true,
      bio:        true,
      avatarUrl:  true,
    },
    orderBy: { fullName: "asc" },
    take: limit,
  });

  return NextResponse.json(users);
}
