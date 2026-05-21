"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Papers",    href: "/papers"    },
  { label: "Users",     href: "/users"     },
  { label: "Reports",   href: "/reports"   },
  { label: "Account",   href: "/account"   },
];

const POLL_INTERVAL_MS = 15_000;

type ReportItem = {
  id:         string;
  type:       "comment";
  text:       string;
  paperTitle: string;
  reportedBy: string;
  reason:     string;
  createdAt:  string;
};

type NotifData = {
  pendingCount:  number;
  commentCount:  number;
  paperCount:    number;
  userCount:     number;
  reports:       ReportItem[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminTopNav() {
  const pathname = usePathname();

  const [bellOpen,  setBellOpen]  = useState(false);
  const [notifData, setNotifData] = useState<NotifData | null>(null);
  // null = first fetch not yet complete; number = count at last bell open
  // BADGE: Unread count must decrement as notifications are marked read
  const [seenCount, setSeenCount] = useState<number | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // REALTIME: Notifications must update via WebSocket/SSE, not on page load only
  // TODO: If using polling, replace with WebSocket before production
  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const json = await res.json() as { success: boolean; data: NotifData };
      if (json.success) {
        setNotifData(json.data);
        // Initialise seenCount to the first fetched count so pre-existing reports
        // don't all appear as "new" — badge only lights up for reports arriving after load
        setSeenCount(prev => prev === null ? json.data.pendingCount : prev);
      }
    } catch {
      // network error — keep stale data, retry on next interval
    }
  }, []);

  // Initial fetch
  useEffect(() => { void fetchNotifs(); }, [fetchNotifs]);

  // Poll every 15 s
  useEffect(() => {
    const id = setInterval(() => { void fetchNotifs(); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const pendingCount = notifData?.pendingCount ?? 0;
  // BADGE: unread = reports that arrived after the bell was last opened (0 until first open)
  const unread = seenCount === null ? 0 : Math.max(0, pendingCount - seenCount);

  function handleBellClick() {
    setBellOpen(o => !o);
    // BADGE: Unread count must decrement as notifications are marked read
    if (!bellOpen) setSeenCount(pendingCount);
  }

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">

        {/* Logo */}
        <span className="text-lg font-bold tracking-tight select-none">
          <span style={{ color: "#0066ff" }}>odd</span>
          <span className="text-gray-900">Academia</span>
        </span>

        {/* Nav links + bell */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1">
            {NAV.map(item => {
              const active     = pathname === item.href || pathname.startsWith(item.href + "/");
              const isReports  = item.href === "/reports";
              // BADGE: Unreviewed report count must be live, not hardcoded
              const reportBadge = isReports ? pendingCount : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-[#0066ff] text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                  {reportBadge > 0 && (
                    <span className={`min-w-[18px] h-[18px] text-[10px] font-bold rounded-full inline-flex items-center justify-center px-1 leading-none ${
                      active ? "bg-white text-[#0066ff]" : "bg-red-500 text-white"
                    }`}>
                      {reportBadge > 99 ? "99+" : reportBadge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={handleBellClick}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Pending reports"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Pending Reports</p>
                  {notifData ? (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {notifData.commentCount > 0 && `${notifData.commentCount} comment${notifData.commentCount !== 1 ? "s" : ""}`}
                      {notifData.commentCount > 0 && notifData.paperCount > 0 && " · "}
                      {notifData.paperCount > 0  && `${notifData.paperCount} paper${notifData.paperCount !== 1 ? "s" : ""}`}
                      {(notifData.commentCount > 0 || notifData.paperCount > 0) && notifData.userCount > 0 && " · "}
                      {notifData.userCount > 0   && `${notifData.userCount} user${notifData.userCount !== 1 ? "s" : ""}`}
                      {pendingCount === 0         && "All clear"}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">Loading…</p>
                  )}
                </div>

                {/* Report list */}
                <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {!notifData ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">Loading…</div>
                  ) : notifData.reports.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">No pending reports.</div>
                  ) : notifData.reports.map(r => (
                    <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {r.paperTitle}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            "{r.text}"
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-red-500 font-medium">{r.reason}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">by {r.reportedBy}</span>
                            <span className="text-[10px] text-gray-300">·</span>
                            <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                          </div>
                        </div>
                        <Link
                          href="/reports"
                          onClick={() => setBellOpen(false)}
                          className="text-xs text-[#0066ff] hover:underline flex-shrink-0 mt-0.5"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {notifData && notifData.pendingCount > 8 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <Link
                      href="/reports"
                      onClick={() => setBellOpen(false)}
                      className="text-xs text-[#0066ff] hover:underline font-medium"
                    >
                      View all {notifData.pendingCount} pending reports →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
