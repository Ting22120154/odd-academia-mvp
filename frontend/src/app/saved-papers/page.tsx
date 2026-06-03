"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SavedPapersList } from "@/components/SavedPapersList";

export default function SavedPapersPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Saved Papers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {count === 0 ? "Papers you bookmark appear here." : `${count} saved paper${count === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/home"
          className="text-sm font-medium text-[var(--brand)] hover:underline"
        >
          Browse papers
        </Link>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <SavedPapersList active onCountChange={setCount} />
      </div>
    </section>
  );
}
