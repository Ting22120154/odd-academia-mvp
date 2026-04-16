"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, PlusIcon } from "@/components/icons";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="text-lg font-semibold tracking-tight text-zinc-900">
        OddAcademia
      </div>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const onProfilePage = pathname?.startsWith("/profile");
  const onHomePage = pathname === "/";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Logo />

        {onHomePage ? (
          <div className="hidden text-sm font-medium text-zinc-700 sm:block">
            Welcome to OddAcademia!
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}

        <div className="flex items-center gap-3">
          {onProfilePage ? (
            <>
              <Link
                href="/upload"
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4" />
                Submit New Paper
              </Link>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <Link
                href="/profile"
                className="relative h-9 w-9 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100"
                aria-label="Profile"
              >
                <Image
                  src="/avatars/profile.svg"
                  alt="Profile"
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Login/Create Account
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

