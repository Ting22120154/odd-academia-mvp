import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as notificationService from "@/modules/notifications/notification.service";
import { parseListNotificationsQuery } from "@/modules/notifications/notification.validation";

/** GET /api/notifications?tab=all&sort=date&dir=desc */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const parsed = parseListNotificationsQuery(req.nextUrl.searchParams);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const result = await notificationService.listNotifications(auth.user.id, parsed.data);
    return jsonOk(result);
  } catch {
    return jsonError("Failed to load notifications", 500);
  }
}
