import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import { profileInclude, toProfilePaper, toProfileUser } from "@/lib/auth/profile";
import { ok, err } from "@/lib/response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const viewer = await getAuthPayload();

  const user = await prisma.user.findUnique({
    where: { id },
    include: profileInclude,
  });

  if (!user) return err("User not found.", 404);

  const isOwnProfile = viewer?.sub === user.id;
  if (!user.profileVisibility && !isOwnProfile) {
    return err("This profile is private.", 403);
  }

  const papers = await prisma.paper.findMany({
    where: { authorId: id, status: "published" },
    include: { keywords: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const profile = toProfileUser(user, papers.map(toProfilePaper), {
    viewerId: viewer?.sub,
    includeEmail: isOwnProfile,
  });

  return ok({ user: profile });
}
