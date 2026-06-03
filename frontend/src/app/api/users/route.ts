import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

export async function GET(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

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
