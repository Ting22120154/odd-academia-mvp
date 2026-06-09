"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const NAV = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Papers",    href: "/papers"    },
  { label: "Users",     href: "/users"     },
  { label: "Reports",   href: "/reports"   },
  { label: "Log",       href: "/moderation-log" },
  { label: "Account",   href: "/account"   },
];

const POLL_INTERVAL_MS = 15_000;

export default function AdminTopNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/count");
      if (!res.ok) return;
      const json = await res.json() as { success?: boolean; data?: { pending?: number } };
      if (json.success && typeof json.data?.pending === "number") {
        setPendingCount(json.data.pending);
      }
    } catch {
      // keep stale count
    }
  }, []);

  useEffect(() => { void fetchPendingCount(); }, [fetchPendingCount]);

  useEffect(() => {
    const id = setInterval(() => { void fetchPendingCount(); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchPendingCount]);

  useEffect(() => {
    if (pathname.startsWith("/reports")) {
      localStorage.setItem("admin_reports_baseline", String(pendingCount));
    }
  }, [pathname, pendingCount]);

  const reportsBaseline = (() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("admin_reports_baseline") ?? "0");
  })();
  const reportsBadge = Math.max(0, pendingCount - reportsBaseline);

  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">
        <span className="text-lg font-bold tracking-tight select-none">
          <span style={{ color: "#0066ff" }}>odd</span>
          <span className="text-gray-900">Academia</span>
        </span>

        <nav className="flex items-center gap-1">
          {NAV.map(item => {
            const active    = pathname === item.href || pathname.startsWith(item.href + "/");
            const isReports = item.href === "/reports";
            const badge     = isReports ? reportsBadge : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-[#0066ff] text-white" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item.label}
                {badge > 0 && (
                  <span className={`min-w-[18px] h-[18px] text-[10px] font-bold rounded-full inline-flex items-center justify-center px-1 leading-none ${
                    active ? "bg-white text-[#0066ff]" : "bg-red-500 text-white"
                  }`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
