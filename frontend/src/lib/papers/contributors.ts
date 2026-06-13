/**
 * Paper contributor input/display helpers (platform user tags + free-text names).
 */
import type { PrismaClient } from "@prisma/client";
import { resolveAvatarUrl } from "@/lib/auth/user";

export type ContributorInput = {
  label: string;
  userId?: string;
};

export type PaperContributorDisplay = {
  label: string;
  userId?: string;
  avatarUrl?: string;
};

type DbContributorRow = {
  contributorName: string;
  contributorUserId: string | null;
  user?: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  } | null;
};

type PrismaLike = Pick<PrismaClient, "user">;

const MAX_CONTRIBUTORS = 20;

export function parseContributorInputs(raw: unknown): ContributorInput[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: ContributorInput[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = String(o.label ?? o.contributorName ?? "").trim();
    if (!label) continue;

    const userIdRaw = o.userId ?? o.contributorUserId;
    const userId =
      typeof userIdRaw === "string" && userIdRaw.trim() ? userIdRaw.trim() : undefined;

    const key = userId ?? label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, userId });
  }

  return out.slice(0, MAX_CONTRIBUTORS);
}

export async function resolveContributorsForSave(
  db: PrismaLike,
  raw: unknown,
): Promise<{ contributorName: string; contributorUserId: string | null }[]> {
  const parsed = parseContributorInputs(raw);
  if (parsed.length === 0) return [];

  const userIds = [...new Set(parsed.map((c) => c.userId).filter(Boolean))] as string[];
  const users =
    userIds.length > 0
      ? await db.user.findMany({
          where: {
            id: { in: userIds },
            profileVisibility: true,
            isBanned: false,
          },
          select: { id: true, fullName: true },
        })
      : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return parsed.map((c) => {
    if (c.userId && userMap.has(c.userId)) {
      return {
        contributorName: userMap.get(c.userId)!.fullName,
        contributorUserId: c.userId,
      };
    }
    return {
      contributorName: c.label,
      contributorUserId: null,
    };
  });
}

export function mapDbContributors(rows: DbContributorRow[]): PaperContributorDisplay[] {
  return rows.map((row) => ({
    label: row.contributorName,
    userId: row.contributorUserId ?? undefined,
    avatarUrl:
      row.contributorUserId && row.user
        ? resolveAvatarUrl(row.user.id, row.user.avatarUrl)
        : undefined,
  }));
}

export function mapApiContributorsToTags(raw: unknown): PaperContributorDisplay[] {
  return parseContributorInputs(raw).map((c) => ({
    label: c.label,
    userId: c.userId,
  }));
}

export function mapPrismaContributorsToTags(raw: unknown): PaperContributorDisplay[] {
  if (!Array.isArray(raw)) return [];
  return mapDbContributors(
    raw.filter((r) => r && typeof r === "object") as DbContributorRow[],
  );
}

export function mapContributorsForPostPage(
  raw: unknown,
): { label: string; userId?: string; href?: string }[] {
  if (!Array.isArray(raw)) return [];
  return mapDbContributors(raw.filter((r) => r && typeof r === "object") as DbContributorRow[]).map(
    (c) => ({
      label: c.label,
      userId: c.userId,
      href: c.userId ? `/user/${c.userId}` : undefined,
    }),
  );
}
