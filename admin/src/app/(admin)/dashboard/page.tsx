"use client";

/**
 * Dashboard page — matches Figma design.
 *
 * Layout:
 *  - "Dashboard" heading + date range filter (top right)
 *  - Calendar dropdown opens when filter is clicked
 *  - Users section:  Users (20,000) | New Users (2,000) | Users Posted (54)
 *  - Papers section: Papers (3,000) | New Papers (33) | Papers Downloaded (100) | Comments (899)
 *
 * All values are hardcoded until the database API is wired up.
 * TODO: replace each card value with the corresponding API endpoint response.
 */

import { useState } from "react";

// ---------------------------------------------------------------------------
// Hardcoded stat data matching Figma
// ---------------------------------------------------------------------------
const SECTIONS = [
  {
    title: "Users",
    cards: [
      { label: "Users",        value: "20,000" }, // TODO: GET /api/stats/users/total
      { label: "New Users",    value: "2,000"  }, // TODO: GET /api/stats/users/new
      { label: "Users Posted", value: "54"     }, // TODO: GET /api/stats/users/posted
    ],
  },
  {
    title: "Papers",
    cards: [
      { label: "Papers",            value: "3,000" }, // TODO: GET /api/stats/papers/total
      { label: "New Papers",        value: "33"    }, // TODO: GET /api/stats/papers/new
      { label: "Papers Downloaded", value: "100"   }, // TODO: GET /api/stats/papers/downloads
      { label: "Comments",          value: "899"   }, // TODO: GET /api/stats/comments/total
    ],
  },
];

// ---------------------------------------------------------------------------
// Minimal inline calendar (no external library)
// ---------------------------------------------------------------------------
const DAYS    = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS  = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function Calendar() {
  const [year,  setYear]  = useState(2025);
  const [month, setMonth] = useState(0); // 0 = January

  // First day of the month and total days
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Build grid cells (empty prefix + day numbers)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-64">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">‹</button>
        <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
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

// ---------------------------------------------------------------------------
// Stat card — white box with bold value and folded corner decoration
// ---------------------------------------------------------------------------
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg px-5 py-4 overflow-hidden flex-1 min-w-[140px]">
      <p className="text-xs text-gray-500 mb-2 leading-tight">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>

      {/* Folded corner decoration — matches Figma card style */}
      <div
        className="absolute bottom-0 right-0 w-8 h-8"
        style={{
          background: "linear-gradient(135deg, transparent 50%, #e5e7eb 50%)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Date range filter */}
        <div className="relative">
          <button
            onClick={() => setCalendarOpen(o => !o)}
            className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {/* Calendar icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            15.01.2025–14.02.2025
            {/* Dropdown chevron */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Calendar dropdown */}
          {calendarOpen && (
            <div className="absolute right-0 mt-2 z-50">
              <Calendar />
            </div>
          )}
        </div>
      </div>

      {/* Stat sections */}
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-base font-semibold text-gray-800 mb-3">{section.title}</h2>
            <div className="flex flex-wrap gap-4">
              {section.cards.map((card) => (
                <StatCard key={card.label} label={card.label} value={card.value} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
