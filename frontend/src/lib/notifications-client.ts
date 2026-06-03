import type { NotificationSettingsResponse } from "@/modules/notifications/notification-settings.types";
import type {
  ListNotificationsResult,
  NotificationSortDir,
  NotificationSortKey,
  NotificationTab,
} from "@/modules/notifications/types";

type ApiSuccess<T> = { success: true } & T;
type ApiError = { success: false; error: string };

async function parseJson<T>(res: Response): Promise<T | ApiError> {
  return res.json() as Promise<T | ApiError>;
}

/** GET /api/notifications */
export async function fetchNotifications(opts?: {
  tab?: NotificationTab;
  sort?: NotificationSortKey;
  dir?: NotificationSortDir;
  readOffset?: number;
}): Promise<ListNotificationsResult> {
  const params = new URLSearchParams();
  if (opts?.tab) params.set("tab", opts.tab);
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.dir) params.set("dir", opts.dir);
  if (opts?.readOffset != null && opts.readOffset > 0) {
    params.set("readOffset", String(opts.readOffset));
  }

  const qs = params.toString();
  const res = await fetch(`/api/notifications${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<ListNotificationsResult>>(res);
  if (!data.success) return { notifications: [], unreadCount: 0 };
  return {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    readHasMore: data.readHasMore,
    readTotal: data.readTotal,
  };
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
  if (!data.success) {
    return { settings: null, error: data.error };
  }
  return { settings: data.settings };
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
  if (!data.success) {
    return { ok: false, error: data.error };
  }
  return { ok: true, settings: data.settings };
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
