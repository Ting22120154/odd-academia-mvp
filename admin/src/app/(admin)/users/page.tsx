"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type Status = "Active" | "Suspended";

type DbUser = {
  id:        string;
  fullName:  string;
  email:     string;
  username:  string;
  jobTitle:  string | null;
  createdAt: string;
  isBanned:  boolean;
  warnCount: number;
  role:      string;
  _count: { papers: number; followers: number; following: number };
};

// ---------------------------------------------------------------------------
// Inline Calendar
// ---------------------------------------------------------------------------
const CAL_DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar() {
  const [year, setYear]   = useState(2025);
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
        <span className="text-sm font-semibold text-gray-800">{CAL_MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {CAL_DAYS.map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>
        ))}
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
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: Status }) {
  const colour: Record<Status, string> = {
    Active:    "text-green-600",
    Suspended: "text-red-500",
  };
  return <span className={`text-xs font-medium ${colour[status]}`}>{status}</span>;
}

function toStatus(isBanned: boolean): Status {
  return isBanned ? "Suspended" : "Active";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const PAGE_LIMIT = 20;

export default function UsersPage() {
  const router = useRouter();

  const [users,        setUsers]        = useState<DbUser[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchUsers = useCallback(async (q: string, p: number, append = false) => {
    setLoading(true);
    const params = new URLSearchParams({ search: q, page: String(p), limit: String(PAGE_LIMIT) });
    try {
      const res  = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json() as { success: boolean; data: { users: DbUser[]; total: number } };
      if (json.success) {
        setUsers(prev => append ? [...prev, ...json.data.users] : json.data.users);
        setTotal(json.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search — reset to page 1 on each new query
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => { void fetchUsers(search, 1, false); }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    void fetchUsers(search, next, true);
  }

  const hasMore = users.length < total;

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>

        <div className="flex items-center gap-3">
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

          <div className="relative">
            <button
              onClick={() => setCalendarOpen(o => !o)}
              className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
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

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name <SortIcon /></th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Registered Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No. Papers Published</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Following</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Followers</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">Loading…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No users found.</td>
                </tr>
              ) : users.map(u => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/users/${u.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.papers}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.following}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.followers}</td>
                  <td className="px-4 py-3"><StatusBadge status={toStatus(u.isBanned)} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/users/${u.id}`); }}
                      className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors text-base leading-none tracking-widest"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="flex justify-end px-4 py-3 border-t border-gray-100">
            <button
              onClick={loadMore}
              disabled={loading}
              className="text-sm text-[#0066ff] hover:underline font-medium disabled:opacity-60"
            >
              {loading ? "Loading…" : "Show More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
