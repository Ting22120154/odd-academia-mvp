"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ChatModal } from "@/components/ChatModal";

type NotifTab = "New" | "All" | "Papers" | "Comments" | "Messages" | "Citations";
const TABS: NotifTab[] = ["New", "All", "Papers", "Comments", "Messages", "Citations"];

type SortKey = "type" | "date";
type SortDir = "asc" | "desc";

interface MockNotification {
  id:   string;
  text: string;
  type: "Paper" | "Comment" | "Reply" | "Citation";
  date: string;
}

interface Conversation {
  partnerId:   string;
  partnerName: string;
  lastMessage: string;
  lastAt:      string;
  isSent:      boolean;
  unread:      number;
}

const INITIAL_MOCK: MockNotification[] = [
  { id: "n1", text: "New Paper Published: AI In Healthcare", type: "Paper",    date: "2023-10-01" },
  { id: "n2", text: "New Comment on your Post",              type: "Comment",  date: "2023-10-02" },
  { id: "n3", text: "New Reply to your Comment",             type: "Reply",    date: "2023-10-03" },
  { id: "n5", text: "Your work was cited: AI practices",     type: "Citation", date: "2023-10-05" },
];

export default function NotificationsPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  const [activeTab,     setActiveTab]     = useState<NotifTab>("New");
  const [sortKey,       setSortKey]       = useState<SortKey>("date");
  const [sortDir,       setSortDir]       = useState<SortDir>("asc");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatWith,      setChatWith]      = useState<{ id: string; name: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist deleted mock notification IDs to localStorage
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("notif_deleted_ids");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });

  // Persist dismissed message conversation partner IDs to localStorage
  const [dismissedMsgs, setDismissedMsgs] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("notif_dismissed_msgs");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });

  // Persist dismissed Messages-tab conversations to localStorage
  const [removedConvos, setRemovedConvos] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("notif_removed_convos");
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch { return new Set(); }
  });

  const mockNotifs = INITIAL_MOCK.filter(n => !deletedIds.has(n.id));

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  // Poll inbox every 5 s
  useEffect(() => {
    if (!user) return;
    function fetchInbox() {
      fetch(`/api/messages/inbox?userId=${user!.id}`)
        .then(r => r.ok ? r.json() as Promise<Conversation[]> : Promise.reject())
        .then(data => setConversations(data))
        .catch(() => {});
    }
    fetchInbox();
    intervalRef.current = setInterval(fetchInbox, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user]);

  if (!isLoggedIn) return null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function deleteMockNotif(id: string) {
    setDeletedIds(prev => {
      const next = new Set([...prev, id]);
      localStorage.setItem("notif_deleted_ids", JSON.stringify([...next]));
      return next;
    });
  }

  function dismissMsgNotif(partnerId: string) {
    setDismissedMsgs(prev => {
      const next = new Set([...prev, partnerId]);
      localStorage.setItem("notif_dismissed_msgs", JSON.stringify([...next]));
      return next;
    });
  }

  function removeConvo(partnerId: string) {
    setRemovedConvos(prev => {
      const next = new Set([...prev, partnerId]);
      localStorage.setItem("notif_removed_convos", JSON.stringify([...next]));
      return next;
    });
  }

  // "New" tab: all conversations minus dismissed ones
  const visibleMsgNotifs = conversations.filter(c => !dismissedMsgs.has(c.partnerId));
  // "Messages" tab: all conversations minus removed ones
  const visibleConvos = conversations.filter(c => !removedConvos.has(c.partnerId));

  const unreadTabBadge  = visibleMsgNotifs.filter(c => c.unread > 0).length;
  const unreadMsgsBadge = visibleConvos.reduce((s, c) => s + c.unread, 0);

  const staticFiltered = mockNotifs.filter(n => {
    if (activeTab === "All")       return true;
    if (activeTab === "New")       return true;
    if (activeTab === "Papers")    return n.type === "Paper";
    if (activeTab === "Comments")  return n.type === "Comment" || n.type === "Reply";
    if (activeTab === "Citations") return n.type === "Citation";
    return false;
  });

  // Combined rows for non-Messages tabs
  type CombinedRow =
    | { kind: "msg";    conv: Conversation; }
    | { kind: "static"; notif: MockNotification; };

  const combinedRows: CombinedRow[] =
    activeTab === "New"
      ? [
          ...visibleMsgNotifs.map(c => ({ kind: "msg" as const, conv: c })),
          ...staticFiltered.map(n  => ({ kind: "static" as const, notif: n })),
        ]
      : staticFiltered.map(n => ({ kind: "static" as const, notif: n }));

  // Sort combined rows
  const sortedRows = [...combinedRows].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    const typeA = a.kind === "msg" ? "Message" : a.notif.type;
    const typeB = b.kind === "msg" ? "Message" : b.notif.type;
    const dateA = a.kind === "msg" ? a.conv.lastAt : a.notif.date;
    const dateB = b.kind === "msg" ? b.conv.lastAt : b.notif.date;
    if (sortKey === "type") return typeA.localeCompare(typeB) * mul;
    return dateA.localeCompare(dateB) * mul;
  });

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-zinc-900">Notifications</h1>
        <Link href="/notifications/settings" className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-black/[0.06] px-4 pt-3">
          {TABS.map((t) => {
            const badge = t === "New" ? unreadTabBadge : t === "Messages" ? unreadMsgsBadge : 0;
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
                {badge > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                    {badge}
                  </span>
                )}
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
                          {unseen && (
                            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-[var(--brand)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
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
                        {unseen && (
                          <span className="flex-shrink-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </button>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeConvo(conv.partnerId)}
                        className="mr-3 flex-shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Remove conversation"
                        title="Remove from list"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          /* ── All other tabs ── */
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] text-xs font-semibold text-zinc-500">
                <th className="px-4 py-3">Notification</th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort("type")} className="inline-flex items-center gap-1 hover:text-zinc-900">
                    Type <SortArrow active={sortKey === "type"} dir={sortDir}/>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1 hover:text-zinc-900">
                    Date <SortArrow active={sortKey === "date"} dir={sortDir}/>
                  </button>
                </th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => {
                if (row.kind === "msg") {
                  const { conv } = row;
                  const unseen = conv.unread > 0;
                  return (
                    <tr
                      key={`msg-${conv.partnerId}`}
                      className={`group border-b border-black/[0.04] last:border-0 cursor-pointer transition ${unseen ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-zinc-50"}`}
                      onClick={() => setChatWith({ id: conv.partnerId, name: conv.partnerName })}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--brand)]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </span>
                          <span className={unseen ? "font-semibold text-zinc-900" : "text-zinc-600"}>
                            {conv.partnerName}:{" "}
                            <span className={unseen ? "font-normal" : "text-zinc-500"}>
                              &ldquo;{conv.lastMessage.length > 55 ? conv.lastMessage.slice(0, 55) + "…" : conv.lastMessage}&rdquo;
                            </span>
                          </span>
                          {unseen && (
                            <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-bold text-white leading-none">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{unseen ? "Message · Unseen" : "Message · Seen"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {new Date(conv.lastAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); dismissMsgNotif(conv.partnerId); }}
                          className="rounded-lg p-1 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          aria-label="Dismiss"
                          title="Dismiss notification"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                }

                const { notif } = row;
                return (
                  <tr key={notif.id} className="group border-b border-black/[0.04] last:border-0 hover:bg-zinc-50 transition">
                    <td className="px-4 py-3 text-zinc-900">{notif.text}</td>
                    <td className="px-4 py-3 text-zinc-500">{notif.type}</td>
                    <td className="px-4 py-3 text-zinc-500">{notif.date}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteMockNotif(notif.id)}
                        className="rounded-lg p-1 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">No notifications</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {chatWith && (
        <ChatModal
          recipientId={chatWith.id}
          recipientName={chatWith.name}
          onClose={() => {
            setChatWith(null);
            if (user) {
              fetch(`/api/messages/inbox?userId=${user.id}`)
                .then(r => r.ok ? r.json() as Promise<Conversation[]> : Promise.reject())
                .then(data => setConversations(data))
                .catch(() => {});
            }
          }}
        />
      )}
    </section>
  );
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`h-3 w-3 ${active ? "text-zinc-900" : "text-zinc-300"}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      {dir === "asc" ? <path d="M6 2v8M3 7l3 3 3-3"/> : <path d="M6 10V2M3 5l3-3 3 3"/>}
    </svg>
  );
}
