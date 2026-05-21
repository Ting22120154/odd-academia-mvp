import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthPayload } from "@/lib/auth/require-auth";
import {
  profileInclude,
  toProfilePaper,
  toProfileUser,
  visibilityFromUi,
  workStatusFromUi,
} from "@/lib/auth/profile";
import { ok, err } from "@/lib/response";

async function loadProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: profileInclude,
  });
  if (!user) return null;

  const papers = await prisma.paper.findMany({
    where: { authorId: userId, status: "published" },
    include: { keywords: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return toProfileUser(user, papers.map(toProfilePaper), {
    viewerId: userId,
    includeEmail: true,
  });
}

export async function GET() {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const profile = await loadProfile(payload.sub);
  if (!profile) return err("User not found.", 404);

  return ok({ user: profile });
}

export async function PATCH(req: NextRequest) {
  const payload = await getAuthPayload();
  if (!payload) return err("Not authenticated.", 401);

  const body = await req.json().catch(() => null);
  if (!body) return err("Invalid request body.", 400);

  const data: Record<string, unknown> = {};

  if (body.fullName !== undefined) {
    const fullName = String(body.fullName).trim();
    if (!fullName) return err("Full name is required.", 400);
    data.fullName = fullName;
  }
  if (body.username !== undefined) {
    const username = String(body.username).trim().toLowerCase();
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return err("Username must be 3–30 characters (letters, numbers, underscore).", 400);
    }
    data.username = username;
  }
  if (body.bio !== undefined) data.bio = String(body.bio).trim() || null;
  if (body.education !== undefined) data.education = String(body.education).trim() || null;
  if (body.jobTitle !== undefined) data.jobTitle = String(body.jobTitle).trim() || null;
  if (body.github !== undefined) data.githubUrl = String(body.github).trim() || null;
  if (body.linkedin !== undefined) data.linkedinUrl = String(body.linkedin).trim() || null;
  if (body.workStatus !== undefined) {
    data.workStatus = workStatusFromUi(String(body.workStatus));
  }
  if (body.profileVisibility !== undefined) {
    data.profileVisibility = visibilityFromUi(
      String(body.profileVisibility) as "PUBLIC" | "PRIVATE"
    );
  }

  try {
    await prisma.user.update({
      where: { id: payload.sub },
      data,
    });

    if (Array.isArray(body.interests)) {
      const names = (body.interests as unknown[])
        .map((n) => String(n).trim())
        .filter(Boolean);

      await prisma.userInterest.deleteMany({ where: { userId: payload.sub } });

      for (const name of names) {
        const interest = await prisma.interest.upsert({
          where: { name },
          update: {},
          create: { name, icon: "📌" },
        });
        await prisma.userInterest.create({
          data: { userId: payload.sub, interestId: interest.id },
        });
      }
    }

    const profile = await loadProfile(payload.sub);
    if (!profile) return err("User not found.", 404);

    return ok({ user: profile });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return err("Username is already taken.", 409);
    console.error("[PATCH /api/users/me]", e);
    return err("Could not update profile.", 500);
  }
}
