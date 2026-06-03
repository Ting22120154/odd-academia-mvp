import { NextRequest } from "next/server";
import { ok, err } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type Tab = "views" | "followers" | "shares" | "downloads";

const VALID_TABS: Tab[] = ["views", "followers", "shares", "downloads"];

function userSelect() {
  return {
    id: true,
    fullName: true,
    createdAt: true,
    isBanned: true,
    _count: {
      select: {
        papers: { where: { status: { not: "removed" as const } } },
        following: true,
        followers: true,
      },
    },
  } as const;
}

function toRow(user: {
  id: string;
  fullName: string;
  createdAt: Date;
  isBanned: boolean;
  _count: { papers: number; following: number; followers: number };
}) {
  return {
    id: user.id,
    name: user.fullName,
    registered: user.createdAt.toISOString(),
    papers: user._count.papers,
    following: user._count.following,
    followers: user._count.followers,
    status: user.isBanned ? ("Suspended" as const) : ("Active" as const),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: paperId } = await params;
  const paper = await prisma.paper.findUnique({ where: { id: paperId }, select: { id: true } });
  if (!paper) return err("Paper not found.", 404);

  const { searchParams } = new URL(req.url);
  const tab = (searchParams.get("tab") ?? "followers") as Tab;
  if (!VALID_TABS.includes(tab)) {
    return err("tab must be views, followers, shares, or downloads.");
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") ?? "20")));
  const skip = (page - 1) * limit;

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  const hasRange =
    from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime());
  const range = hasRange ? { gte: from, lte: to } : undefined;

  if (tab === "shares" || tab === "downloads") {
    return ok({
      users: [],
      total: 0,
      page,
      limit,
      tab,
      note: "Per-user share and download tracking is not available yet.",
    });
  }

  if (tab === "followers") {
    const where = {
      paperId,
      ...(range ? { createdAt: range } : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.paperFollow.findMany({
        where,
        include: { user: { select: userSelect() } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.paperFollow.count({ where }),
    ]);
    return ok({
      users: rows.map((r) => toRow(r.user)),
      total,
      page,
      limit,
      tab,
    });
  }

  // views: users who commented on this paper (closest available signal)
  const commentWhere = {
    paperId,
    ...(range ? { createdAt: range } : {}),
  };
  const authorRows = await prisma.comment.findMany({
    where: commentWhere,
    select: { authorId: true },
    distinct: ["authorId"],
    orderBy: { createdAt: "desc" },
  });
  const authorIds = authorRows.map((r) => r.authorId);
  const total = authorIds.length;
  const pageIds = authorIds.slice(skip, skip + limit);

  if (pageIds.length === 0) {
    return ok({ users: [], total, page, limit, tab });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: pageIds } },
    select: userSelect(),
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  return ok({
    users: pageIds.map((uid) => byId[uid]).filter(Boolean).map(toRow),
    total,
    page,
    limit,
    tab,
  });
}
