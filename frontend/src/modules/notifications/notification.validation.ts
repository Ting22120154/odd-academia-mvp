import type {
  ListNotificationsQuery,
  NotificationSortDir,
  NotificationSortKey,
  NotificationTab,
} from "./types";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const TABS = new Set<NotificationTab>([
  "new",
  "all",
  "papers",
  "comments",
  "contact",
  "citations",
  "moderation",
]);

const SORT_KEYS = new Set<NotificationSortKey>(["type", "date"]);
const SORT_DIRS = new Set<NotificationSortDir>(["asc", "desc"]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseListNotificationsQuery(
  searchParams: URLSearchParams,
): ParseResult<ListNotificationsQuery> {
  const tabRaw = (searchParams.get("tab") ?? "all").toLowerCase();
  const tab = TABS.has(tabRaw as NotificationTab) ? (tabRaw as NotificationTab) : "all";

  const sortRaw = (searchParams.get("sort") ?? "date").toLowerCase();
  const sort = SORT_KEYS.has(sortRaw as NotificationSortKey)
    ? (sortRaw as NotificationSortKey)
    : "date";

  const dirRaw = (searchParams.get("dir") ?? "desc").toLowerCase();
  const dir = SORT_DIRS.has(dirRaw as NotificationSortDir)
    ? (dirRaw as NotificationSortDir)
    : "desc";

  const oldLimitRaw = Number.parseInt(searchParams.get("oldLimit") ?? "5", 10);
  const oldLimit =
    Number.isFinite(oldLimitRaw) && oldLimitRaw > 0 ? Math.min(oldLimitRaw, 100) : 5;

  return { ok: true, data: { tab, sort, dir, oldLimit } };
}

export function parseNotificationIdParam(id: string): ParseResult<string> {
  if (!UUID_RE.test(id)) {
    return { ok: false, error: "notification id must be a valid UUID" };
  }
  return { ok: true, data: id };
}
