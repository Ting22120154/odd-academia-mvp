/**
 * GET /api/users/search?q=seon&limit=8
 * Search public platform users by username or full name (auth required).
 */
import { getRouteUserId } from "@/lib/auth/require-auth";
import { resolveAvatarUrl } from "@/lib/auth/user";
import { ok, err } from "@/lib/response";
import { prisma } from "@/lib/prisma";

function parseLimit(value: string | null): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n <= 0) return 8;
  return Math.min(n, 20);
}

export async function GET(req: Request) {
  const viewerId = await getRouteUserId(req);
  if (!viewerId) return err("Not authenticated.", 401);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = parseLimit(searchParams.get("limit"));

  if (q.length < 1) {
    return ok({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      profileVisibility: true,
      isBanned: false,
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      username: true,
      avatarUrl: true,
    },
    orderBy: [{ username: "asc" }],
    take: limit,
  });

  return ok({
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      username: u.username,
      avatarUrl: resolveAvatarUrl(u.id, u.avatarUrl),
    })),
  });
}
