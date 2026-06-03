"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useNotificationCount } from "@/context/NotificationContext";
import { ChatModal } from "@/components/ChatModal";
import { fetchNotifications, markNotificationRead } from "@/lib/notifications-client";
import type {
  NotificationResponse,
  NotificationSortDir,
  NotificationSortKey,
  NotificationTab,
} from "@/modules/notifications/types";

type NotifTabLabel = "New" | "All" | "Papers" | "Comments" | "Contact" | "Citations" | "Messages";

const TABS: NotifTabLabel[] = ["New", "All", "Papers", "Comments", "Contact", "Citations", "Messages"];

const TAB_TO_API: Partial<Record<NotifTabLabel, NotificationTab>> = {
  New: "new",
  All: "all",
  Papers: "papers",
  Comments: "comments",
  Contact: "contact",
  Citations: "citations",
};

interface Conversation {
  partnerId:         string;
  partnerName:       string;
  lastMessage:       string;
  lastAt:            string;
  isSent:            boolean;
  unread:            number;
  senderLastMsgRead: boolean;
}

type SortKey = NotificationSortKey;
type SortDir = NotificationSortDir;

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const { refreshUnreadCount } = useNotificationCount();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotifTabLabel>("New");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readOffset, setReadOffset] = useState(0);
  const [readHasMore, setReadHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTabRef = useRef(activeTab);
  const readOffsetRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);
  const [removedConvos, setRemovedConvos] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("notif_removed_convos");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    function fetchInbox() {
      fetch("/api/messages/inbox", { credentials: "include" })
        .then(r => r.ok ? r.json() as Promise<Conversation[]> : Promise.reject())
        .then(data => setConversations(data))
        .catch(() => {});
    }
    fetchInbox();
    intervalRef.current = setInterval(fetchInbox, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoggedIn]);

  const load = useCallback(
    async (opts?: { appendRead?: boolean }) => {
      if (activeTab === "Messages") return;
      const apiTab = TAB_TO_API[activeTab];
      if (!apiTab) return;

      const appendRead = opts?.appendRead === true && apiTab === "new";
      if (appendRead) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const offset = appendRead ? readOffsetRef.current : 0;
      const result = await fetchNotifications({
        tab: apiTab,
        sort: sortKey,
        dir: sortDir,
        readOffset: apiTab === "new" ? offset : undefined,
      });

      const newRead = result.notifications.filter((n) => n.isRead);

      if (appendRead) {
        setItems((prev) => {
          const unreadFromApi = result.notifications.filter((n) => !n.isRead);
          const prevRead = prev.filter((n) => n.isRead);
          return [...unreadFromApi, ...prevRead, ...newRead];
        });
        readOffsetRef.current = offset + newRead.length;
        setReadOffset(readOffsetRef.current);
      } else {
        setItems(result.notifications);
        readOffsetRef.current = newRead.length;
        setReadOffset(readOffsetRef.current);
      }

      setUnreadCount(result.unreadCount);
      setReadHasMore(result.readHasMore ?? false);
      if (appendRead) setLoadingMore(false);
      else setLoading(false);
    },
    [activeTab, sortKey, sortDir],
  );

  useEffect(() => {
    readOffsetRef.current = 0;
    setReadOffset(0);
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

  function removeConvo(partnerId: string) {
    setRemovedConvos(prev => {
      const next = new Set([...prev, partnerId]);
      localStorage.setItem("notif_removed_convos", JSON.stringify([...next]));
      return next;
    });
  }

  async function handleNotificationClick(n: NotificationResponse) {
    const tabAtClick = activeTab;
    const idsToMark = n.groupedIds?.length ? n.groupedIds : [n.id];

    if (!n.isRead) {
      for (const id of idsToMark) {
        const result = await markNotificationRead(id);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      setUnreadCount((c) => Math.max(0, c - idsToMark.length));
      void refreshUnreadCount();

      const idSet = new Set(idsToMark);
      setItems((prev) => {
        if (activeTabRef.current !== tabAtClick) return prev;
        return prev.map((item) =>
          idSet.has(item.id) ? { ...item, isRead: true } : item,
        );
      });
    }
    router.push(n.href);
  }

  const firstReadIdx = items.findIndex((n) => n.isRead);
  const unreadItems = firstReadIdx === -1 ? items : items.slice(0, firstReadIdx);
  const readItems = firstReadIdx === -1 ? [] : items.slice(firstReadIdx);
  const showNewSections = activeTab === "New" && !loading;

  const visibleConvos = conversations
    .filter(c => !removedConvos.has(c.partnerId))
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  const unreadMsgsBadge = visibleConvos.reduce((s, c) => s + c.unread, 0);

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
        <div className="flex items-center gap-2 overflow-x-auto border-b border-black/[0.06] px-4 pt-3">
          {TABS.map((t) => {
            const badge = t === "Messages" ? unreadMsgsBadge : 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={[
                  "relative whitespace-nowrap rounded-t-lg px-3 pb-2 pt-1 text-sm font-medium transition",
                  activeTab === t
                    ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
                    : "text-zinc-500 hover:text-zinc-900",
                ].join(" ")}
              >
                {t}
                {badge > 0 ? (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ── Messages tab ── */}
        {activeTab === "Messages" ? (
          <div>
            {visibleConvos.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-400">No messages yet.</p>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {visibleConvos.map((conv) => {
                  const unseen = conv.unread > 0;
                  return (
                    <li key={conv.partnerId} className={`group flex items-center ${unseen ? "bg-blue-50/50" : ""}`}>
                      <button
                        type="button"
                        onClick={() => setChatWith({ id: conv.partnerId, name: conv.partnerName })}
                        className="flex flex-1 items-start gap-3 px-4 py-4 text-left transition hover:bg-zinc-50/80"
                      >
                        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-sm font-bold text-white">
                          {conv.partnerName[0]}
                          {unseen ? (
                            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--brand)]" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate text-sm ${unseen ? "font-bold text-zinc-900" : "font-semibold text-zinc-700"}`}>
                              {conv.partnerName}
                            </span>
                            <span className="flex-shrink-0 text-[11px] text-zinc-400">
                              {new Date(conv.lastAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className={`mt-0.5 truncate text-sm ${unseen ? "font-medium text-zinc-800" : "text-zinc-500"}`}>
                            {conv.isSent ? "You: " : ""}{conv.lastMessage}
                          </p>
                        </div>
                        {unseen ? (
                          <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                            {conv.unread}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeConvo(conv.partnerId)}
                        className="mr-3 flex-shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Remove conversation"
                        title="Remove from list"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          /* ── All other tabs — real DB notifications ── */
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
              ) : showNewSections ? (
                <>
                  {unreadItems.length > 0 ? (
                    <>
                      <tr>
                        <td
                          colSpan={3}
                          className="bg-zinc-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          Unread
                        </td>
                      </tr>
                      {unreadItems.map((n) => (
                        <NotificationRow
                          key={n.id}
                          n={n}
                          onClick={() => void handleNotificationClick(n)}
                        />
                      ))}
                    </>
                  ) : null}
                  {readItems.length > 0 ? (
                    <>
                      <tr>
                        <td
                          colSpan={3}
                          className="bg-zinc-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                        >
                          Earlier
                        </td>
                      </tr>
                      {readItems.map((n) => (
                        <NotificationRow
                          key={n.id}
                          n={n}
                          onClick={() => void handleNotificationClick(n)}
                        />
                      ))}
                    </>
                  ) : null}
                  {readHasMore ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center">
                        <button
                          type="button"
                          disabled={loadingMore}
                          onClick={() => void load({ appendRead: true })}
                          className="text-sm font-medium text-[var(--brand)] hover:underline disabled:opacity-50"
                        >
                          {loadingMore ? "Loading…" : "Load more"}
                        </button>
                      </td>
                    </tr>
                  ) : null}
                </>
              ) : (
                items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    n={n}
                    onClick={() => void handleNotificationClick(n)}
                  />
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
        )}
      </div>

      {chatWith ? (
        <ChatModal
          recipientId={chatWith.id}
          recipientName={chatWith.name}
          onClose={() => {
            setChatWith(null);
            fetch("/api/messages/inbox", { credentials: "include" })
              .then(r => r.ok ? r.json() as Promise<Conversation[]> : Promise.reject())
              .then(data => setConversations(data))
              .catch(() => {});
          }}
        />
      ) : null}
    </section>
  );
}

function NotificationRow({
  n,
  onClick,
}: {
  n: NotificationResponse;
  onClick: () => void;
}) {
  return (
    <tr
      className={[
        "border-b border-black/[0.04] last:border-0",
        !n.isRead ? "bg-blue-50/40" : "",
      ].join(" ")}
    >
      <td className="px-4 py-3">
        <div className="flex items-start gap-2.5">
          {!n.isRead ? (
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]"
              title="Unread"
              aria-label="Unread"
            />
          ) : (
            <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
          )}
          <button
            type="button"
            onClick={onClick}
            className={[
              "text-left hover:text-[var(--brand)] hover:underline",
              n.isRead ? "font-normal text-zinc-500" : "font-semibold text-zinc-900",
            ].join(" ")}
          >
            {n.text}
          </button>
        </div>
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
