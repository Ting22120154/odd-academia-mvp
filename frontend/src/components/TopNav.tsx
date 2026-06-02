"use client";

/**
 * Top navigation. When logged in, avatar menu links to /profile and calls logout API.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

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

function UserMenu({ isProfile }: { isProfile: boolean }) {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initial =
    user?.fullName?.trim().charAt(0).toUpperCase() ||
    user?.email?.trim().charAt(0).toUpperCase() ||
    "G";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-xs font-semibold transition",
          isProfile
            ? "ring-2 ring-[var(--brand)] ring-offset-2 bg-zinc-200 text-zinc-700"
            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300",
        ].join(" ")}
      >
        {user?.avatarUrl && !avatarError ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <span>{initial}</span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[140px] overflow-hidden rounded-xl border border-black/[0.08] bg-white py-1 shadow-[var(--shadow-md)]"
        >
          <Link
            href="/profile"
            role="menuitem"
            className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();

  if (pathname === "/login") return null;
  if (pathname?.startsWith("/paper")) return null;

  const isHome = pathname === "/" || pathname === "/home";
  const isFollowing = pathname?.startsWith("/following");
  const isNotifications = pathname?.startsWith("/notifications");
  const isProfile = pathname === "/profile" || pathname?.startsWith("/profile/") || pathname?.startsWith("/user/");

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
          <IconButton href="/notifications" label="Notifications" active={isNotifications}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </IconButton>
          {isLoggedIn ? (
            <UserMenu isProfile={isProfile} />
          ) : (
            <Link
              href="/login"
              aria-label="Login"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-300"
            >
              G
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
