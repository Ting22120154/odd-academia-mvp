import jwt from "jsonwebtoken";
import prisma from "../../../../../packages/db/src/client";

// File uploads: POST /api/papers/upload (multipart/form-data)

const paperInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
    },
  },
  keywords: true,
  categories: true,
  contributors: true,
  references: true,
} as const;

function getBearerUserId(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId?: string;
    };
    if (typeof payload.userId === "string") return payload.userId;
    if (typeof payload.sub === "string") return payload.sub;
    return null;
  } catch {
    return null;
  }
}

function parsePublishedAt(value: unknown): Date {
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(
      50,
      parsePositiveInt(searchParams.get("limit"), 10),
    );
    const skip = (page - 1) * limit;

    const where = { status: "published" as const };

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

    return Response.json({ posts, total, page, limit });
  } catch (error) {
    console.error("GET /api/papers failed:", error);
    return Response.json(
      { error: "Failed to fetch papers" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = getBearerUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  if (typeof b.title !== "string" || !b.title.trim()) {
    return Response.json({ error: "Missing required field: title" }, { status: 400 });
  }
  if (typeof b.abstract !== "string" || !b.abstract.trim()) {
    return Response.json({ error: "Missing required field: abstract" }, { status: 400 });
  }

  const keywords = Array.isArray(b.keywords)
    ? (b.keywords.filter((x) => typeof x === "string") as string[])
    : [];
  const categories = Array.isArray(b.categories)
    ? (b.categories.filter((x) => typeof x === "string") as string[])
    : [];
  const doi = typeof b.doi === "string" ? b.doi.trim() || undefined : undefined;
  const publishedAt = parsePublishedAt(b.publishedAt);

  const contributors = Array.isArray(b.contributors)
    ? (b.contributors.filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof (x as { label?: unknown }).label === "string",
      ) as { label: string; href?: string }[])
    : [];

  const references = Array.isArray(b.references)
    ? (b.references.filter(
        (x) =>
          x &&
          typeof x === "object" &&
          typeof (x as { citationText?: unknown }).citationText === "string",
      ) as { citationText: string }[])
    : [];

  try {
    const paper = await prisma.paper.create({
      data: {
        authorId: userId,
        title: b.title.trim(),
        abstract: b.abstract.trim(),
        publishedAt,
        doi,
        status: "published",
        keywords:
          keywords.length > 0
            ? { create: keywords.map((keyword) => ({ keyword })) }
            : undefined,
        categories:
          categories.length > 0
            ? { create: categories.map((category) => ({ category })) }
            : undefined,
        contributors:
          contributors.length > 0
            ? {
                create: contributors.map((c) => ({
                  contributorName: c.label.trim(),
                })),
              }
            : undefined,
        references:
          references.length > 0
            ? {
                create: references.map((r) => ({
                  citationText: r.citationText.trim(),
                })),
              }
            : undefined,
      },
      include: paperInclude,
    });

    return Response.json(paper, { status: 201 });
  } catch (error) {
    console.error("POST /api/papers failed:", error);
    return Response.json({ error: "Failed to create paper" }, { status: 500 });
  }
}
