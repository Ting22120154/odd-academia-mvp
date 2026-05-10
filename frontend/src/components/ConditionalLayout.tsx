"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { GuestBanner } from "@/components/GuestBanner";
import type { ReactNode } from "react";

const FULL_SCREEN_PREFIXES = ["/login", "/onboarding"];

export function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isFullScreen) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GuestBanner />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
