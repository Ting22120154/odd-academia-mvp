import { NextRequest } from "next/server";
import { ok } from "@/lib/response";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? "50")));
  const skip = (page - 1) * limit;

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  const hasRange =
    from && to && !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime());

  const searchWhere = search.trim()
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { author: { fullName: { contains: search, mode: "insensitive" as const } } },
          { author: { username: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const publishedWhere = hasRange
    ? {
        OR: [
          { publishedAt: { gte: from, lte: to } },
          { publishedAt: null, createdAt: { gte: from, lte: to } },
        ],
      }
    : {};

  const where = {
    status: { not: "removed" as const },
    ...searchWhere,
    ...publishedWhere,
  };

  const [rows, total] = await prisma.$transaction([
    prisma.paper.findMany({
      where,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        createdAt: true,
        viewCount: true,
        citationCount: true,
        author: { select: { fullName: true } },
        categories: { select: { category: true }, take: 1 },
        _count: { select: { comments: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.paper.count({ where }),
  ]);

  const papers = rows.map((p) => {
    const when = p.publishedAt ?? p.createdAt;
    return {
      id: p.id,
      title: p.title,
      author: p.author.fullName,
      category: p.categories[0]?.category ?? "—",
      published: when.toISOString(),
      views: p.viewCount,
      cited: p.citationCount,
      downloaded: 0,
      comments: p._count.comments,
    };
  });

  return ok({ papers, total, page, limit });
}
