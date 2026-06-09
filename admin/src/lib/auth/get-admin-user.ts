import type { TokenPayload } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

/** JWT `sub` is AdminUser.id (set at login). */
export async function getAdminUserFromPayload(payload: TokenPayload) {
  return prisma.adminUser.findUnique({ where: { id: payload.sub } });
}
