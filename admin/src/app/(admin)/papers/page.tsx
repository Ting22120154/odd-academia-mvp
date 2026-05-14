"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Hardcoded data
// ---------------------------------------------------------------------------
const ALL_PAPERS = Array.from({ length: 10 }, (_, i) => ({
  id:        String(i + 1),
  title:     "Sustainable Energy Practices in Urban Environments",
  author:    "James B.",
  interest:  "Sustainable Energy",
  published: "29/01/2025",
  views:     3023,
  cited:     33,
}));

// ---------------------------------------------------------------------------
// Minimal inline Calendar (same pattern as dashboard)
// ---------------------------------------------------------------------------
const DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar() {
  const [year,  setYear]  = useState(2025);
  const [month, setMonth] = useState(0);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

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
        {DAYS.map(d => <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div key={i} className={`text-xs text-center py-1 rounded ${day ? "text-gray-700 hover:bg-blue-50 cursor-pointer" : ""}`}>
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sort icon
// ---------------------------------------------------------------------------
function SortIcon() {
  return (
    <svg className="inline ml-1 w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 3 18 9"/><polyline points="6 15 12 21 18 15"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PapersPage() {
  const router = useRouter();

  const [search,       setSearch]       = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAll,      setShowAll]      = useState(false);

  const INITIAL_ROWS = 5;

  const filtered = ALL_PAPERS.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase())
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_ROWS);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Papers</h1>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff] w-48"
            />
          </div>

          {/* Date range filter */}
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
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Paper Name <SortIcon /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Author <SortIcon /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Interest</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Views</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cited</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">No papers found.</td>
              </tr>
            ) : visible.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{p.title}</td>
                <td className="px-4 py-3 text-gray-600">{p.author}</td>
                <td className="px-4 py-3 text-gray-600">{p.interest}</td>
                <td className="px-4 py-3 text-gray-600">{p.published}</td>
                <td className="px-4 py-3 text-gray-600">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{p.cited}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => router.push(`/papers/${p.id}`)}
                    className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors text-base leading-none tracking-widest"
                  >
                    •••
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Show More */}
        {filtered.length > INITIAL_ROWS && (
          <div className="flex justify-end px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setShowAll(v => !v)}
              className="text-sm text-[#0066ff] hover:underline font-medium"
            >
              {showAll ? "Show Less" : "Show More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
