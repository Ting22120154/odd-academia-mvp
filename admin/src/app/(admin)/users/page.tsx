"use client";

import { formatDateAU } from "@odd-academia/db/date";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DateRangePicker,
  lastNDaysRange,
  type DateRange,
} from "@/components/DateRangePicker";

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
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(31));

  const fetchUsers = useCallback(async (q: string, p: number, dateRange: DateRange, append = false) => {
    setLoading(true);
    const params = new URLSearchParams({
      search: q,
      page: String(p),
      limit: String(PAGE_LIMIT),
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
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
    const timer = setTimeout(() => { void fetchUsers(search, 1, range, false); }, 300);
    return () => clearTimeout(timer);
  }, [search, range, fetchUsers]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    void fetchUsers(search, next, range, true);
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

          <DateRangePicker value={range} onChange={setRange} />
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Warnings</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">Loading…</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No users found.</td>
                </tr>
              ) : users.map(u => (
                <tr
                  key={u.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/users/${u.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateAU(u.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.papers}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.following}</td>
                  <td className="px-4 py-3 text-gray-500">{u._count.followers}</td>
                  <td className="px-4 py-3">
                    {u.warnCount > 0 ? (
                      <span className={`text-xs font-semibold ${u.warnCount >= 3 ? "text-red-500" : "text-orange-500"}`}>
                        {u.warnCount}/4
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
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
