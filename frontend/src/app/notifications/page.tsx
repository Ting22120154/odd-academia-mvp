"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotificationCount } from "@/context/NotificationContext";
import { fetchNotifications, markNotificationRead } from "@/lib/notifications-client";
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

type SortKey = NotificationSortKey;
type SortDir = NotificationSortDir;

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const { decrementUnread } = useNotificationCount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotifTabLabel>("New");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { notifications, unreadCount: count } = await fetchNotifications({
      tab: TAB_TO_API[activeTab],
      sort: sortKey,
      dir: sortDir,
    });
    setItems(notifications);
    setUnreadCount(count);
    setLoading(false);
  }, [activeTab, sortKey, sortDir]);

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

  async function handleNotificationClick(n: NotificationResponse) {
    const tabAtClick = activeTab;

    if (!n.isRead) {
      const result = await markNotificationRead(n.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUnreadCount((c) => Math.max(0, c - 1));
      decrementUnread();

      // Mark as read in the list (unbold) without removing — same behaviour on all tabs.
      setItems((prev) => {
        if (activeTabRef.current !== tabAtClick) return prev;
        return prev.map((item) =>
          item.id === n.id ? { ...item, isRead: true } : item,
        );
      });
    }
    router.push(n.href);
  }

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
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                  Loading notifications…
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr
                  key={n.id}
                  className={[
                    "border-b border-black/[0.04] last:border-0",
                    !n.isRead ? "bg-blue-50/40" : "",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void handleNotificationClick(n)}
                      className={[
                        "text-left hover:text-[var(--brand)] hover:underline",
                        n.isRead
                          ? "font-normal text-zinc-500"
                          : "font-semibold text-zinc-900",
                      ].join(" ")}
                    >
                      {n.text}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{n.type}</td>
                  <td className="px-4 py-3 text-zinc-500">{n.date}</td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
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
