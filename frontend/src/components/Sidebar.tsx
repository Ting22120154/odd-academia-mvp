"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/", label: "Dashboard", icon: "grid" as const },
  { href: "/analytics", label: "Analytics", icon: "chart" as const },
  { href: "/papers", label: "Papers", icon: "file" as const },
  { href: "/upload", label: "Submit", icon: "upload" as const },
  { href: "/formatting", label: "Formatting Guides", icon: "book" as const },
  // Figma shows Settings selected on the profile screen.
  { href: "/profile", label: "Settings", icon: "settings" as const },
];

// Nav items guests cannot access
const AUTH_ONLY_HREFS = new Set(["/upload", "/notifications", "/profile"]);

function Icon({ name }: { name: (typeof nav)[number]["icon"] }) {
  const cls = "h-4 w-4";
  switch (name) {
    case "grid":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "chart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 19V5m0 14h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 16v-5m4 5V8m4 8v-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "file":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M14 3v5h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "upload":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V4m0 0 4 4M12 4 8 8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 20h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "book":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 4h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 17h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a8.7 8.7 0 0 0-1.6-1l-.3-2.3H10.7L10.4 8a8.7 8.7 0 0 0-1.6 1L6.5 8.4l-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 1l-2 1.2 2 3.4 2.3-.6c.5.4 1 .8 1.6 1l.3 2.3h4.6l.3-2.3c.6-.2 1.1-.6 1.6-1l2.3.6 2-3.4-2-1.2Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      );
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, isGuest, isLoggedIn, logout } = useAuth();

  const visibleNav = isGuest
    ? nav.filter((item) => !AUTH_ONLY_HREFS.has(item.href))
    : nav;

  return (
    <aside className="sticky top-0 flex h-screen w-[260px] flex-col border-r border-black/[0.06] bg-white">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-[var(--brand)]">odd</span>
          <span className="text-zinc-900">Academia</span>
        </div>
      </div>

      <nav className="px-3">
        <ul className="space-y-1">
          {visibleNav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-[rgba(0,102,255,0.08)] text-[var(--brand)]"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900",
                  ].join(" ")}
                >
                  <span className={active ? "text-[var(--brand)]" : "text-zinc-500"}>
                    <Icon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                  <span className="ml-auto text-zinc-400">›</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto border-t border-black/[0.06] px-4 py-4">
        {isLoggedIn && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-3">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-zinc-200" />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-zinc-900">
                  {user.fullName}
                </div>
                <div className="truncate text-xs text-zinc-500">{user.email}</div>
              </div>
              <span className="ml-auto text-zinc-400">›</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl border border-black/[0.06] py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Sign Out
            </button>
          </div>
        ) : isGuest ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
              Browsing as Guest
            </div>
            <Link
              href="/login"
              className="block w-full rounded-xl border border-[var(--brand)] py-2 text-center text-xs font-medium text-[var(--brand)] hover:bg-[rgba(0,102,255,0.04)]"
            >
              Sign In / Sign Up
            </Link>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

