"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Props = {};

function IconButton({
  children,
  href,
  label,
  active,
}: {
  children: React.ReactNode;
  href?: string;
  label: string;
  active?: boolean;
}) {
  const cls = [
    "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
    active
      ? "border-[var(--brand)] bg-blue-50 text-[var(--brand)]"
      : "border-black/[0.06] bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} className={cls}>
      {children}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TopNav(_props: Props) {
  const pathname              = usePathname();
  const { user, isGuest, logout } = useAuth();
  const isLoggedIn            = user !== null;
  const [unread,   setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Unread message badge — poll only for real logged-in users
  useEffect(() => {
    if (!user) return;
    async function check() {
      const res = await fetch(`/api/messages/unread-count?userId=${user!.id}`);
      if (res.ok) {
        const data = await res.json() as { count: number };
        setUnread(data.count);
      }
    }
    void check();
    const interval = setInterval(() => { void check(); }, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (pathname === "/login") return null;
  if (pathname?.startsWith("/paper")) return null;

  const isHome          = pathname === "/" || pathname === "/home";
  const isFollowing     = pathname?.startsWith("/following");
  const isNotifications = pathname?.startsWith("/notifications");
  const isProfile       = pathname === "/profile" || pathname?.startsWith("/profile/") || pathname?.startsWith("/user/");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between px-6 py-4">
        <Link href="/home" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-[var(--brand)]">odd</span>
          <span className="text-zinc-900">Academia</span>
        </Link>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/upload"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95"
            >
              ⤴ Submit New Paper
            </Link>
          ) : isGuest ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.08] px-4 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Log out
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-medium text-white hover:opacity-95"
            >
              ⤴ Login/Create Account
            </Link>
          )}

          <IconButton href="/home" label="Home" active={isHome}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 19V6a2 2 0 0 1 2-2h8l4 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M12 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M8 13h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </IconButton>
          <IconButton href="/following" label="Following" active={isFollowing}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M2 21a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M22 21a5 5 0 0 0-7.5-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </IconButton>

          {/* Notifications bell with unread badge */}
          <div className="relative">
            <IconButton href="/notifications" label="Notifications" active={isNotifications}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </IconButton>
            {unread > 0 && (
              <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>

          {/* Avatar with logout dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Profile menu"
              onClick={() => setMenuOpen(o => !o)}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold transition",
                isProfile || menuOpen
                  ? "ring-2 ring-[var(--brand)] ring-offset-2 bg-zinc-200 text-zinc-700"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
              ].join(" ")}
            >
              <img
                src="/avatar-placeholder.png"
                alt=""
                className="h-full w-full rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.textContent =
                    user?.fullName?.[0]?.toUpperCase() ?? "G";
                }}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 min-w-[160px] overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-lg">
                {user && (
                  <div className="border-b border-black/[0.06] px-4 py-2.5">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                )}
                {isLoggedIn && (
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    View Profile
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
