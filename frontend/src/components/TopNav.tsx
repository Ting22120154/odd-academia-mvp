"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  /**
   * In this frontend-only MVP we don't have a real session provider on main yet.
   * The nav stays usable with a boolean flag so it can be wired to AuthContext later.
   */
  isLoggedIn?: boolean;
};

function IconButton({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href?: string;
  label: string;
}) {
  const cls =
    "inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700";

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

export function TopNav({ isLoggedIn }: Props) {
  const pathname = usePathname();

  // Full-screen auth pages should not show the app chrome.
  if (pathname === "/login") return null;

  // Paper viewer renders its own layout; we keep only one top bar to match Figma.
  // If you want the top bar in the viewer too, remove this guard and delete the viewer header.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (pathname?.startsWith("/paper")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[var(--page-max)] items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
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

          {/* Icon set matches the Figma top-right chrome (stub actions for now). */}
          <IconButton label="Reader">
            <span aria-hidden>📖</span>
          </IconButton>
          <IconButton label="Following">
            <span aria-hidden>👥</span>
          </IconButton>
          <IconButton label="Notifications">
            <span aria-hidden>🔔</span>
          </IconButton>
          {/* Figma shows a profile image here; use a text badge until the asset is available. */}
          <Link
            href="/profile"
            aria-label="Profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.06] bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            title="Profile"
          >
            RT
          </Link>
        </div>
      </div>
    </header>
  );
}

