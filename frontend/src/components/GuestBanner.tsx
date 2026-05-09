"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGuestAccess } from "@/hooks/useGuestAccess";

export function GuestBanner() {
  const { isGuest } = useAuth();
  const { viewedCount } = useGuestAccess();
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-sm text-amber-900">
      <span>
        You&apos;re browsing as a guest &mdash;{" "}
        <strong>{viewedCount} of 5</strong> free articles used. Sign up for
        unlimited access.
      </span>
      <div className="flex shrink-0 items-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600"
        >
          Sign Up
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="text-amber-700 hover:text-amber-900"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
