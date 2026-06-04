import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/** GET /api/notifications/count — lightweight unread badge count */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const count = await prisma.notification.count({
    where: { userId: auth.user.id, isRead: false },
  });

  return jsonOk({ count });
}
