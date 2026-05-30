"use client";

import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  userCount:          number;
  paperCount:         number;
  bannedCount:        number;
  commentCount:       number;
  pendingReportCount: number;
}

// ── Calendar ──────────────────────────────────────────────────────────────────

const DAYS   = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function Calendar() {
  const [year,  setYear]  = useState(2025);
  const [month, setMonth] = useState(0);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">‹</button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div
            key={i}
            className={`text-xs text-center py-1 rounded ${
              day ? "text-gray-700 hover:bg-blue-50 cursor-pointer" : ""
            }`}
          >
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then(r => r.json() as Promise<{ success: boolean; data: DashboardStats }>)
      .then(j => {
        if (j.success) setStats(j.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const sections = stats
    ? [
        {
          title: "Users",
          cards: [
            { label: "Total Users",   value: stats.userCount },
            { label: "Banned Users",  value: stats.bannedCount },
          ],
        },
        {
          title: "Content",
          cards: [
            { label: "Papers",          value: stats.paperCount },
            { label: "Comments",        value: stats.commentCount },
            { label: "Pending Reports", value: stats.pendingReportCount },
          ],
        },
      ]
    : null;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        <div className="relative">
          <button
            onClick={() => setCalendarOpen(o => !o)}
            className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            15.01.2025–14.02.2025
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {calendarOpen && (
            <div className="absolute right-0 mt-2 z-50">
              <Calendar />
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          Failed to load dashboard data. Try refreshing.
        </div>
      )}

      {/* Stat sections */}
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
          sections.map(section => (
            <div key={section.title}>
              <h2 className="text-base font-semibold text-gray-800 mb-3">{section.title}</h2>
              <div className="flex flex-wrap gap-4">
                {section.cards.map(card => (
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
