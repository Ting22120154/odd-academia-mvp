import { NextRequest, NextResponse } from "next/server"
import prisma from "@odd-academia/db/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  if (!q) return NextResponse.json({ error: "Missing search query" }, { status: 400 })

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")))
  const skip = (page - 1) * limit

  const where = {
    status: "published" as const,
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { abstract: { contains: q, mode: "insensitive" as const } },
      { author: { fullName: { contains: q, mode: "insensitive" as const } } },
      { keywords: { some: { keyword: { contains: q, mode: "insensitive" as const } } } },
      { categories: { some: { category: { contains: q, mode: "insensitive" as const } } } },
    ],
  }

  const [posts, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true, bio: true } },
        keywords: true,
        categories: true,
        contributors: true,
        references: true,
      },
    }),
    prisma.paper.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, limit, query: q })
}
