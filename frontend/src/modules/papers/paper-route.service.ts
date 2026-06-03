import { prisma } from "@/lib/prisma";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Seeded papers in creation order (mock route ids `1`, `2`, …). */
export async function getSeededPaperIds(): Promise<string[]> {
  const rows = await prisma.paper.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export function resolveRouteToPaperId(routeId: string, seededIds: string[]): string | null {
  if (UUID_RE.test(routeId)) {
    return seededIds.includes(routeId) ? routeId : null;
  }
  const index = Number.parseInt(routeId, 10);
  if (!Number.isInteger(index) || index < 1) return null;
  return seededIds[index - 1] ?? null;
}

export function paperIdToRouteId(paperId: string, seededIds: string[]): string | null {
  const index = seededIds.indexOf(paperId);
  if (index < 0) return null;
  return String(index + 1);
}

export async function listPaperRoutes(): Promise<{ routeId: string; paperId: string }[]> {
  const seededIds = await getSeededPaperIds();
  return seededIds.map((paperId, i) => ({
    routeId: String(i + 1),
    paperId,
  }));
}

/** Always use the real UUID — numeric mock routes are not supported by the live router. */
export function paperPathForId(paperId: string, _seededIds?: string[]): string {
  return `/paper/${paperId}`;
}
