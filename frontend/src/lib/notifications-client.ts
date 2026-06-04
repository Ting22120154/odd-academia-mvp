import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsResponse,
} from "@/modules/notifications/notification-settings.types";
import type {
  ListNotificationsResult,
  NotificationSortDir,
  NotificationSortKey,
  NotificationTab,
} from "@/modules/notifications/types";

function normalizeSettings(raw: unknown): NotificationSettingsResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    followedAuthors:
      typeof o.followedAuthors === "boolean"
        ? o.followedAuthors
        : DEFAULT_NOTIFICATION_SETTINGS.followedAuthors,
    followedPapers:
      typeof o.followedPapers === "boolean"
        ? o.followedPapers
        : DEFAULT_NOTIFICATION_SETTINGS.followedPapers,
    repliedTo:
      typeof o.repliedTo === "boolean"
        ? o.repliedTo
        : DEFAULT_NOTIFICATION_SETTINGS.repliedTo,
  };
}

type ApiSuccess<T> = { success: true } & T;
type ApiError = { success: false; error: string };

async function parseJson<T>(res: Response): Promise<T | ApiError> {
  return res.json() as Promise<T | ApiError>;
}

/** GET /api/notifications */
const EMPTY_LIST: ListNotificationsResult = {
  notifications: [],
  newNotifications: [],
  oldNotifications: [],
  oldTotal: 0,
  unreadCount: 0,
};

export async function fetchNotifications(opts?: {
  tab?: NotificationTab;
  sort?: NotificationSortKey;
  dir?: NotificationSortDir;
  oldLimit?: number;
}): Promise<ListNotificationsResult> {
  const params = new URLSearchParams();
  if (opts?.tab) params.set("tab", opts.tab);
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.dir) params.set("dir", opts.dir);
  if (opts?.oldLimit != null) params.set("oldLimit", String(opts.oldLimit));

  const qs = params.toString();
  const res = await fetch(`/api/notifications${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<ListNotificationsResult>>(res);
  if (!data.success) return EMPTY_LIST;
  return {
    notifications: data.notifications ?? [],
    newNotifications: data.newNotifications ?? [],
    oldNotifications: data.oldNotifications ?? [],
    oldTotal: data.oldTotal ?? 0,
    unreadCount: data.unreadCount ?? 0,
  };
}

/** PATCH /api/notifications/mark-read — mark a grouped notification (all ids). */
export async function markNotificationsRead(
  ids: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/notifications/mark-read", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ids }),
  });
  const data = await parseJson<ApiSuccess<{ read: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true };
}

/** PATCH /api/notifications/:id */
export async function markNotificationRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await parseJson<ApiError>(res);
    return { ok: false, error: !data.success ? data.error : "Failed to mark read" };
  }
  return { ok: true };
}

/** GET /api/notifications/settings */
export async function fetchNotificationSettings(): Promise<
  { settings: NotificationSettingsResponse } | { settings: null; error: string }
> {
  const res = await fetch("/api/notifications/settings", {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<
    ApiSuccess<{ settings: NotificationSettingsResponse }>
  >(res);
  if (!res.ok || !data.success) {
    return {
      settings: null,
      error: !data.success ? data.error : "Failed to load notification settings",
    };
  }
  const settings = normalizeSettings(data.settings);
  if (!settings) {
    return { settings: null, error: "Invalid notification settings response" };
  }
  return { settings };
}

/** PATCH /api/notifications/settings */
export async function updateNotificationSettings(
  patch: Partial<NotificationSettingsResponse>,
): Promise<
  | { ok: true; settings: NotificationSettingsResponse }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/notifications/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  const data = await parseJson<
    ApiSuccess<{ settings: NotificationSettingsResponse }> | ApiError
  >(res);
  if (!res.ok || !data.success) {
    return {
      ok: false,
      error: !data.success ? data.error : "Failed to update notification settings",
    };
  }
  const settings = normalizeSettings(data.settings);
  if (!settings) {
    return { ok: false, error: "Invalid notification settings response" };
  }
  return { ok: true, settings };
}

/** PATCH /api/notifications/read-all */
export async function markAllNotificationsRead(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const res = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ readAll: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true };
}
