"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { OddAcademiaLogo } from "@/components/OddAcademiaLogo";

const POLL_MS = 15_000;

const navItems = [
  { href: "/",             label: "Explore",       icon: "home"   as const },
  { href: "/home",         label: "Home",           icon: "home"   as const },
  { href: "/upload",       label: "Upload paper",   icon: "upload" as const },
  { href: "/notifications",label: "Notifications",  icon: "bell"   as const },
  { href: "/profile",      label: "Profile",        icon: "user"   as const },
];

function Icon({ name }: { name: "home" | "upload" | "bell" | "user" }) {
  const common = "h-5 w-5";
  switch (name) {
    case "home":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case "upload":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4m0 0 4 4M12 4 8 8" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
            stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" />
        </svg>
      );
    case "user":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none">
          <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" />
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

export function Navbar() {
  const pathname = usePathname();
  const { user }  = useAuth();

  // REALTIME: Notifications must update via WebSocket/SSE, not on page load only
  // TODO: If using polling, replace with WebSocket before production
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res  = await fetch("/api/notifications/count", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json() as { success: boolean; count?: number };
      if (data.success) setUnreadCount(data.count ?? 0);
    } catch { /* keep stale count on network error */ }
  }, [user?.id]);

  // Fetch on mount and whenever userId changes
  useEffect(() => { void fetchUnread(); }, [fetchUnread]);

  // Poll every 15 s while user is logged in
  useEffect(() => {
    if (!user?.id) return;
    const id = setInterval(() => { void fetchUnread(); }, POLL_MS);
    return () => clearInterval(id);
  }, [user?.id, fetchUnread]);

  // BADGE: Unread count must decrement as notifications are marked read
  // Mark all as read and reset badge when user visits /notifications
  useEffect(() => {
    if (pathname !== "/notifications" || !user?.id || unreadCount === 0) return;
    setUnreadCount(0); // optimistic reset
    fetch("/api/notifications/read-all", {
      method:      "PATCH",
      credentials: "include",
    }).catch(() => null);
  }, [pathname, user?.id, unreadCount]);

  return (
    <header className="border-b border-black/10 bg-white px-4 py-3">
      <nav className="mx-auto flex w-full max-w-6xl items-center gap-4">
        <OddAcademiaLogo href="/home" variant="color" heightClass="h-7" />
        <div className="ml-auto flex items-center gap-2">
          {navItems.map((item) => {
            const active = item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
            const isBell = item.icon === "bell";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-50",
                  active ? "text-black" : "text-zinc-700 hover:text-black",
                ].join(" ")}
              >
                <span className="relative text-zinc-500">
                  <Icon name={item.icon} />
                  {/* BADGE: badge only shown to logged-in users with unread notifications */}
                  {isBell && user && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {!user && (
            <Link
              href="/login"
              className="ml-1 inline-flex items-center rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Login / Register
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
