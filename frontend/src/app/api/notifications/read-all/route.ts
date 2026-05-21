import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as notificationService from "@/modules/notifications/notification.service";

/** PATCH /api/notifications/read-all */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  try {
    await notificationService.markAllNotificationsRead(auth.user.id);
    return jsonOk({ readAll: true });
  } catch {
    return jsonError("Failed to mark all notifications as read", 500);
  }
}
