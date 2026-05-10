"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGuestAccess } from "@/hooks/useGuestAccess";

type Props = { paperId: string };

export function GuestTracker({ paperId }: Props) {
  const { isGuest, hasReachedLimit, recordArticleView } = useGuestAccess();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isGuest) return;

    // Already at limit before this view → send to login immediately
    if (hasReachedLimit) {
      router.replace("/login?reason=guest_limit");
      return;
    }

    // Record this view; if it tips over the limit, show the sign-up modal
    if (recordArticleView(paperId)) {
      setShowModal(true);
    }
    // Intentionally run once on mount only — dep array is empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!showModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-limit-title"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-[var(--shadow-md)]">
        <h2
          id="guest-limit-title"
          className="text-base font-semibold text-zinc-900"
        >
          You&apos;ve used all 5 free articles
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Create a free account to keep reading unlimited papers.
        </p>
        <div className="mt-5 flex gap-3">
          <Link
            href="/login"
            className="flex-1 rounded-xl bg-[var(--brand)] py-2.5 text-center text-sm font-medium text-white hover:opacity-95"
          >
            Sign Up Now
          </Link>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex-1 rounded-xl border border-black/[0.08] py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
