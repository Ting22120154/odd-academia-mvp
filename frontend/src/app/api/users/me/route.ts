/**
 * GET  /api/users/me — full profile for the logged-in user (includes email).
 * PATCH /api/users/me — update profile fields + replace interest tags.
 * Auth: JWT required (401 if missing).
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthPayload } from "@/lib/auth/require-auth";
import { loadProfile } from "@/lib/auth/load-profile";
import { visibilityFromUi, workStatusFromUi } from "@/lib/auth/profile";
import { interestIcon, normalizeProfileInterests } from "@/lib/interests";
import { ok, err } from "@/lib/response";

export async function GET() {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);

  const profile = await loadProfile(auth.payload.sub, {
    viewerId: auth.payload.sub,
    includeEmail: true,
  });
  if (!profile) return err("User not found.", 404);

  return ok({ user: profile });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthPayload();
  if (!auth.ok) return err(auth.error, auth.status);
  const payload = auth.payload;

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
    await prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.user.update({
          where: { id: payload.sub },
          data,
        });
      }

      if (Array.isArray(body.interests)) {
        const names = normalizeProfileInterests(body.interests);

        await tx.userInterest.deleteMany({ where: { userId: payload.sub } });

        for (const name of names) {
          const interest = await tx.interest.upsert({
            where: { name },
            update: { icon: interestIcon(name) },
            create: { name, icon: interestIcon(name) },
          });
          await tx.userInterest.create({
            data: { userId: payload.sub, interestId: interest.id },
          });
        }
      }
    });

    const profile = await loadProfile(payload.sub, {
      viewerId: payload.sub,
      includeEmail: true,
    });
    if (!profile) return err("User not found.", 404);

    return ok({ user: profile });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return err("Username is already taken.", 409);
    console.error("[PATCH /api/users/me]", e);
    return err("Could not update profile.", 500);
  }
}
