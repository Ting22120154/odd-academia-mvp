import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { err } from "@/lib/response";

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const users = await prisma.user.findMany({
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
  });
  return NextResponse.json(users);
}
