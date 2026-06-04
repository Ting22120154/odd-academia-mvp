import prisma from "@odd-academia/db/client";
import { paperInclude } from "@/lib/papers/constants";
import { getCategoryDbAliases, normalizeCategory } from "@/lib/papers/categories";

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const raw = decodeURIComponent(id).trim();

    if (!raw) {
      return Response.json({ error: "Missing category" }, { status: 400 });
    }

    const canonical = normalizeCategory(raw);
    const category = canonical ?? raw;

    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      50,
      parsePositiveInt(searchParams.get("limit"), 10),
    );
    const skip = (page - 1) * limit;

    const aliasValues = canonical ? getCategoryDbAliases(canonical) : [category];

    const where = {
      status: "published" as const,
      OR: aliasValues.flatMap((value) => [
        {
          categories: {
            some: { category: { equals: value, mode: "insensitive" as const } },
          },
        },
        {
          keywords: {
            some: { keyword: { equals: value, mode: "insensitive" as const } },
          },
        },
      ]),
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

    return Response.json({ posts, total, page, limit, category });
  } catch (error) {
    console.error("GET /api/papers/category/[id] failed:", error);
    return Response.json(
      { error: "Failed to fetch papers by category" },
      { status: 500 },
    );
  }
}
