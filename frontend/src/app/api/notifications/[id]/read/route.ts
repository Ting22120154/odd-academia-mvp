import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as notificationService from "@/modules/notifications/notification.service";
import { parseNotificationIdParam } from "@/modules/notifications/notification.validation";

/** PATCH /api/notifications/:id/read */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id } = await params;
  const parsed = parseNotificationIdParam(id);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    await notificationService.markNotificationRead(parsed.data, auth.user.id);
    return jsonOk({ read: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "NOT_FOUND") return jsonError("Notification not found", 404);
    return jsonError("Failed to mark notification as read", 500);
  }
}
