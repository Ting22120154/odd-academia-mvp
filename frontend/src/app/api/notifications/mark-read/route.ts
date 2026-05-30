import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as notificationService from "@/modules/notifications/notification.service";

/** PATCH /api/notifications/mark-read — mark one or more notifications read */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (ids.length === 0) return jsonError("ids array is required", 400);

  try {
    await notificationService.markNotificationsRead(ids, auth.user.id);
    return jsonOk({ read: true, count: ids.length });
  } catch {
    return jsonError("Failed to mark notifications as read", 500);
  }
}
