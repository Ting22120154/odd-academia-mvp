import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
