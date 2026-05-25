import prisma from "@odd-academia/db/client";
import { paperInclude } from "@/lib/papers/constants";

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return Response.json(
        { error: "Missing search query" },
        { status: 400 },
      );
    }

    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      50,
      parsePositiveInt(searchParams.get("limit"), 10),
    );
    const skip = (page - 1) * limit;

    const where = {
      status: "published" as const,
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { abstract: { contains: q, mode: "insensitive" as const } },
        { author: { fullName: { contains: q, mode: "insensitive" as const } } },
        {
          keywords: {
            some: { keyword: { contains: q, mode: "insensitive" as const } },
          },
        },
        {
          categories: {
            some: { category: { contains: q, mode: "insensitive" as const } },
          },
        },
      ],
    };

    const [posts, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: paperInclude,
      }),
      prisma.paper.count({ where }),
    ]);

    return Response.json({ posts, total, page, limit, query: q });
  } catch (error) {
    console.error("GET /api/papers/search failed:", error);
    return Response.json(
      { error: "Failed to search papers" },
      { status: 500 },
    );
  }
}
