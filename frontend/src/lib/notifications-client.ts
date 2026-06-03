import type {
  NotificationResponse,
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
}): Promise<{
  notifications: NotificationResponse[];
  unreadCount: number;
}> {
  const params = new URLSearchParams();
  if (opts?.tab) params.set("tab", opts.tab);
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.dir) params.set("dir", opts.dir);

  const qs = params.toString();
  const res = await fetch(`/api/notifications${qs ? `?${qs}` : ""}`, {
    cache: "no-store",
    credentials: "include",
  });
  const data = await parseJson<
    ApiSuccess<{ notifications: NotificationResponse[]; unreadCount: number }>
  >(res);
  if (!data.success) return { notifications: [], unreadCount: 0 };
  return { notifications: data.notifications, unreadCount: data.unreadCount };
}

/** PATCH /api/notifications/:id/read */
export async function markNotificationRead(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseJson<ApiSuccess<{ read: boolean }>>(res);
  if (!data.success) return { ok: false, error: data.error };
  return { ok: true };
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
