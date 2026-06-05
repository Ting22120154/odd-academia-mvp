import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

/** GET /api/health — quick config check for Vercel admin deploy */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const hasJwtSecret = Boolean(process.env.JWT_SECRET?.trim());

  let databaseOk = false;
  let databaseError: string | undefined;

  if (hasDatabaseUrl) {
    try {
      await prisma.adminUser.count();
      databaseOk = true;
    } catch (error) {
      databaseError = error instanceof Error ? error.message : "Database query failed";
    }
  }

  return ok({
    service: "admin",
    hasDatabaseUrl,
    hasJwtSecret,
    databaseOk,
    databaseError,
    ready: hasDatabaseUrl && hasJwtSecret && databaseOk,
  });
}
