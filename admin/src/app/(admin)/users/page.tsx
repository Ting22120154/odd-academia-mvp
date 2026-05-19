"use client";

/**
 * Users list page — matches Figma design.
 *
 * TODO (backend integration):
 *   - Replace HARDCODED_USERS with a fetch to GET /api/users?page=&limit=&search=
 *   - Wire Suspend action to PATCH /api/users/:id  { status: "suspended" }
 *   - Wire Activate action to PATCH /api/users/:id { status: "active" }
 *   - Wire Remove action to DELETE /api/users/:id
 *   - Replace client-side search filter with a debounced API query param
 *   - Replace Show More with real pagination against the API total count
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Status = "Active" | "Inactive" | "Suspended";

interface User {
  id:         string;
  name:       string;
  registered: string;
  papers:     number;
  following:  number;
  followers:  number;
  status:     Status;
}

// ---------------------------------------------------------------------------
// Hardcoded placeholder data — replace with API response once backend is ready
// ---------------------------------------------------------------------------
const HARDCODED_USERS: User[] = [
  { id: "1",  name: "Rick Smith",    registered: "29/01/2025", papers: 5, following: 500, followers: 330, status: "Active"    },
  { id: "2",  name: "Evelyn Harper", registered: "29/01/2025", papers: 1, following: 10,  followers: 298, status: "Inactive"  },
  { id: "3",  name: "James B",       registered: "29/01/2025", papers: 1, following: 999, followers: 999, status: "Suspended" },
  { id: "4",  name: "Steven Sam",    registered: "29/01/2025", papers: 2, following: 213, followers: 11,  status: "Active"    },
  { id: "5",  name: "Joe Rash",      registered: "29/01/2025", papers: 3, following: 22,  followers: 245, status: "Active"    },
  { id: "6",  name: "Will Copper",   registered: "29/01/2025", papers: 0, following: 0,   followers: 9,   status: "Inactive"  },
  { id: "7",  name: "Chris Jr",      registered: "29/01/2025", papers: 3, following: 111, followers: 45,  status: "Inactive"  },
  { id: "8",  name: "Trisha Crady",  registered: "29/01/2025", papers: 1, following: 123, followers: 67,  status: "Active"    },
  { id: "9",  name: "Reuben Max",    registered: "29/01/2025", papers: 2, following: 32,  followers: 45,  status: "Inactive"  },
  { id: "10", name: "Tanya Ross",    registered: "29/01/2025", papers: 3, following: 2,   followers: 100, status: "Active"    },
  { id: "11", name: "Betty B",       registered: "29/01/2025", papers: 2, following: 234, followers: 112, status: "Active"    },
  { id: "12", name: "Sue Lee",       registered: "29/01/2025", papers: 0, following: 0,   followers: 0,   status: "Suspended" },
];

// ---------------------------------------------------------------------------
// Inline Calendar (same pattern as Dashboard and Papers pages)
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
    Inactive:  "text-gray-400",
    Suspended: "text-red-500",
  };
  return <span className={`text-xs font-medium ${colour[status]}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const INITIAL_ROWS = 5;

export default function UsersPage() {
  const router = useRouter();

  // Users list — hardcoded data; swap for API fetch once backend is ready
  const [users]        = useState<User[]>(HARDCODED_USERS);
  const [search,       setSearch]       = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAll,      setShowAll]      = useState(false);

  // Client-side search filter — replace with API debounce once backend is ready
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_ROWS);

  return (
    <div>
      {/* ── Placeholder notice for reviewers ─────────────────────────────────
          This banner is intentional — it signals that the UI is wired up and
          ready, but live data requires the backend API (GET /api/users) and
          Prisma database to be connected. Remove this banner once the API is
          integrated.
      ────────────────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <span className="mt-0.5 text-base">🚧</span>
        <div>
          <p className="font-semibold">UI Placeholder — Backend Integration Pending</p>
          <p className="text-amber-700 mt-0.5">
            The table below uses hardcoded sample data that matches the Figma design.
            Once <code className="bg-amber-100 rounded px-1">GET /api/users</code> is connected,
            real users will appear here and all actions (Suspend, Activate, Remove) will
            persist to the database. Search and Show More will also switch to server-side pagination.
          </p>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>

        <div className="flex items-center gap-3">
          {/* Search — currently filters hardcoded data client-side */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowAll(false); }}
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff] w-48"
            />
          </div>

          {/* Date range filter — calendar is cosmetic only until backend date filtering is added */}
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
              {/* TODO: add server-side sort once API supports ?sortBy=&sortDir= */}
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
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">No users found.</td>
              </tr>
            ) : visible.map(u => (
              <tr
                key={u.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                // Clicking the row navigates to the user detail page
                onClick={() => router.push(`/users/${u.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.registered}</td>
                <td className="px-4 py-3 text-gray-500">{u.papers}</td>
                <td className="px-4 py-3 text-gray-500">{u.following}</td>
                <td className="px-4 py-3 text-gray-500">{u.followers}</td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-right">
                  {/* ••• navigates to user detail page where Suspend/Remove actions live */}
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

        {/* Show More — client-side for now, will become server-side pagination */}
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
