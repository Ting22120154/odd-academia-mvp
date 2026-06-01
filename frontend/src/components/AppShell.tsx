"use client";

/** Wraps pages with TopNav; isLoggedIn comes from AuthContext (real session, not mock). */

import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { TopNav } from "@/components/TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <TopNav isLoggedIn={isLoggedIn} />
      <main className="mx-auto w-full max-w-[var(--page-max)] px-6 py-6">{children}</main>
    </div>
  );
}
