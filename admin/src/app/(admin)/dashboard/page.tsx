"use client";

import { useEffect, useState } from "react";
import {
  DateRangePicker,
  lastNDaysRange,
  type DateRange,
} from "@/components/DateRangePicker";

interface DashboardStats {
  userCount:          number;
  paperCount:         number;
  bannedCount:        number;
  commentCount:       number;
  pendingReportCount: number;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg px-5 py-4 overflow-hidden flex-1 min-w-[140px]">
      <p className="text-xs text-gray-500 mb-2 leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <div
        className="absolute bottom-0 right-0 w-8 h-8"
        style={{ background: "linear-gradient(135deg, transparent 50%, #e5e7eb 50%)" }}
      />
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg px-5 py-4 overflow-hidden flex-1 min-w-[140px] animate-pulse">
      <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
      <div className="h-7 w-16 rounded bg-gray-200" />
    </div>
  );
}

export default function DashboardPage() {
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(31));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    const params = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });

    fetch(`/api/admin/dashboard?${params}`)
      .then((r) => r.json() as Promise<{ success: boolean; data: DashboardStats }>)
      .then((j) => {
        if (cancelled) return;
        if (j.success) setStats(j.data);
        else setError(true);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [range]);

  const sections = stats
    ? [
        {
          title: "Users",
          cards: [
            { label: "Total Users", value: stats.userCount },
            { label: "Banned Users", value: stats.bannedCount },
          ],
        },
        {
          title: "Content",
          cards: [
            { label: "Papers", value: stats.paperCount },
            { label: "Comments", value: stats.commentCount },
            { label: "Pending Reports", value: stats.pendingReportCount },
          ],
        },
      ]
    : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          Failed to load dashboard data. Try refreshing.
        </div>
      )}

      <div className="space-y-8">
        {loading ? (
          <>
            <div>
              <div className="h-4 w-16 rounded bg-gray-200 mb-3 animate-pulse" />
              <div className="flex flex-wrap gap-4">
                <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
              </div>
            </div>
            <div>
              <div className="h-4 w-20 rounded bg-gray-200 mb-3 animate-pulse" />
              <div className="flex flex-wrap gap-4">
                <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
              </div>
            </div>
          </>
        ) : sections ? (
          sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-gray-800 mb-3">{section.title}</h2>
              <div className="flex flex-wrap gap-4">
                {section.cards.map((card) => (
                  <StatCard key={card.label} label={card.label} value={card.value} />
                ))}
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
}
