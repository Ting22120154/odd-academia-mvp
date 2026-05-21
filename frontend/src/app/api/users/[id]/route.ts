import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id:         true,
      fullName:   true,
      username:   true,
      workStatus: true,
      jobTitle:   true,
      bio:        true,
      avatarUrl:  true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body." }, { status: 400 });

  const { fullName, username, workStatus, bio, jobTitle } =
    body as Record<string, string | undefined>;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName   !== undefined && { fullName }),
      ...(username   !== undefined && { username }),
      ...(workStatus !== undefined && { workStatus }),
      ...(bio        !== undefined && { bio }),
      ...(jobTitle   !== undefined && { jobTitle }),
    },
    select: {
      id:         true,
      fullName:   true,
      username:   true,
      workStatus: true,
      jobTitle:   true,
      bio:        true,
      avatarUrl:  true,
    },
  });

  return NextResponse.json(updated);
}
