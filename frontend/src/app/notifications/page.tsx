"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotifications,
  markNotificationsRead,
} from "@/lib/notifications-client";
import type {
  NotificationResponse,
  NotificationSortDir,
  NotificationSortKey,
  NotificationTab,
} from "@/modules/notifications/types";

type NotifTabLabel = "New" | "All" | "Papers" | "Comments" | "Contact" | "Citations";

const TABS: NotifTabLabel[] = ["New", "All", "Papers", "Comments", "Contact", "Citations"];

const TAB_TO_API: Record<NotifTabLabel, NotificationTab> = {
  New: "new",
  All: "all",
  Papers: "papers",
  Comments: "comments",
  Contact: "contact",
  Citations: "citations",
};

const OLD_PAGE_SIZE = 5;

type SortKey = NotificationSortKey;
type SortDir = NotificationSortDir;

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotifTabLabel>("New");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [newItems, setNewItems] = useState<NotificationResponse[]>([]);
  const [oldItems, setOldItems] = useState<NotificationResponse[]>([]);
  const [oldTotal, setOldTotal] = useState(0);
  const [oldLimit, setOldLimit] = useState(OLD_PAGE_SIZE);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTabRef = useRef(activeTab);

  const isNewTab = activeTab === "New";

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isNewTab) setOldLimit(OLD_PAGE_SIZE);
  }, [isNewTab, activeTab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchNotifications({
      tab: TAB_TO_API[activeTab],
      sort: sortKey,
      dir: sortDir,
      oldLimit: isNewTab ? oldLimit : undefined,
    });
    setItems(result.notifications);
    setNewItems(result.newNotifications);
    setOldItems(result.oldNotifications);
    setOldTotal(result.oldTotal);
    setUnreadCount(result.unreadCount);
    setLoading(false);
  }, [activeTab, sortKey, sortDir, oldLimit, isNewTab]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void load();
  }, [isLoggedIn, load]);

  if (!isLoggedIn) return null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function markReadInLists(n: NotificationResponse) {
    const readRow: NotificationResponse = { ...n, isRead: true };

    if (isNewTab) {
      setNewItems((prev) => prev.filter((item) => item.id !== n.id));
      setOldItems((prev) => {
        const without = prev.filter((item) => item.id !== n.id);
        return [readRow, ...without];
      });
      setOldTotal((t) => t + 1);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === n.id ? readRow : item)),
    );
  }

  async function handleNotificationClick(n: NotificationResponse) {
    const tabAtClick = activeTab;

    if (!n.isRead) {
      const result = await markNotificationsRead(n.ids);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUnreadCount((c) => Math.max(0, c - n.ids.length));

      if (activeTabRef.current === tabAtClick) {
        markReadInLists(n);
      }
    }
    router.push(n.href);
  }

  const hasNewTabContent = newItems.length > 0 || oldItems.length > 0;
  const listEmpty = isNewTab ? !hasNewTabContent : items.length === 0;
  const canLoadMoreOld = isNewTab && oldItems.length < oldTotal;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-zinc-900">Notifications</h1>
          {unreadCount > 0 ? (
            <p className="mt-0.5 text-xs text-zinc-500">{unreadCount} unread</p>
          ) : null}
        </div>
        <Link href="/notifications/settings" className="text-zinc-400 hover:text-zinc-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={[
                "rounded-t-lg px-3 pb-2 pt-1 text-sm font-medium transition",
                activeTab === t
                  ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
                  : "text-zinc-500 hover:text-zinc-900",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-xs font-semibold text-zinc-500">
              <th className="w-8 px-4 py-3" aria-label="Status" />
              <th className="px-4 py-3">Notification</th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("type")}
                  className="inline-flex items-center gap-1 hover:text-zinc-900"
                >
                  Type
                  <SortArrow active={sortKey === "type"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("date")}
                  className="inline-flex items-center gap-1 hover:text-zinc-900"
                >
                  Date
                  <SortArrow active={sortKey === "date"} dir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  Loading notifications…
                </td>
              </tr>
            ) : isNewTab ? (
              <>
                {newItems.length > 0 ? (
                  <>
                    <tr className="bg-zinc-50/80">
                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        New
                      </td>
                    </tr>
                    {newItems.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onClick={() => void handleNotificationClick(n)}
                      />
                    ))}
                  </>
                ) : null}
                {oldItems.length > 0 ? (
                  <>
                    <tr className="bg-zinc-50/80">
                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Earlier
                      </td>
                    </tr>
                    {oldItems.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        onClick={() => void handleNotificationClick(n)}
                      />
                    ))}
                  </>
                ) : null}
                {canLoadMoreOld ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setOldLimit((l) => l + OLD_PAGE_SIZE)}
                        className="text-sm font-medium text-[var(--brand)] hover:underline"
                      >
                        Load more
                      </button>
                    </td>
                  </tr>
                ) : null}
              </>
            ) : (
              items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClick={() => void handleNotificationClick(n)}
                />
              ))
            )}
            {!loading && listEmpty ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  No notifications
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NotificationRow({
  notification: n,
  onClick,
}: {
  notification: NotificationResponse;
  onClick: () => void;
}) {
  return (
    <tr className="border-b border-black/[0.04] last:border-0">
      <td className="px-4 py-3 align-middle">
        {!n.isRead ? (
          <span
            className="mx-auto block h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500"
            aria-label="Unread"
          />
        ) : (
          <span className="block h-2.5 w-2.5" aria-hidden />
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onClick}
          className="text-left font-medium text-zinc-900 hover:text-[var(--brand)] hover:underline"
        >
          {n.text}
        </button>
      </td>
      <td className="px-4 py-3 text-zinc-500">{n.type}</td>
      <td className="px-4 py-3 text-zinc-500">{n.date}</td>
    </tr>
  );
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      className={`h-3 w-3 ${active ? "text-zinc-900" : "text-zinc-300"}`}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {dir === "asc" ? <path d="M6 2v8M3 7l3 3 3-3" /> : <path d="M6 10V2M3 5l3-3 3 3" />}
    </svg>
  );
}
