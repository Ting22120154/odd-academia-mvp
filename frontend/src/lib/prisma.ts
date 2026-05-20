/**
 * Server-only Prisma client (API routes, server components).
 * Uses the shared client from @odd-academia/db — same DATABASE_URL as seed/studio.
 */
export { prisma as default, prisma } from "@odd-academia/db/server";
