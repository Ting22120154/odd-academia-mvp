import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAuthUser } from "@/lib/auth/session";
import * as settingsService from "@/modules/notifications/notification-settings.service";
import { parseUpdateNotificationSettingsBody } from "@/modules/notifications/notification-settings.validation";

/** GET /api/notifications/settings */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  try {
    const settings = await settingsService.getNotificationSettings(auth.user.id);
    return jsonOk({ settings });
  } catch {
    return jsonError("Failed to load notification settings", 500);
  }
}

/** PATCH /api/notifications/settings */
export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUser(req);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const raw = await req.json().catch(() => null);
  const parsed = parseUpdateNotificationSettingsBody(raw);
  if (!parsed.ok) return jsonError(parsed.error, 400);

  try {
    const settings = await settingsService.updateNotificationSettings(
      auth.user.id,
      parsed.data,
    );
    return jsonOk({ settings });
  } catch {
    return jsonError("Failed to update notification settings", 500);
  }
}
