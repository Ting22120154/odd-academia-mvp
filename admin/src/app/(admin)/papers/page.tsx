"use client";

/**
 * Papers list page — matches Figma design.
 *
 * Columns: Paper Name | Author | Category | Published | Views | Cited | Downloaded | Comments | actions
 *
 * Actions:
 *  - "•••" navigates to paper detail page (/papers/[id])
 *  - "Remove" opens a confirmation modal; on confirm shows a success state
 *
 * TODO (backend integration):
 *  - Replace ALL_PAPERS with fetch to GET /api/papers?page=&limit=&search=
 *  - Wire Remove confirm to DELETE /api/papers/:id
 *  - Switch client-side search + Show More to server-side pagination
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mockAdminPapers, type AdminPaper as Paper } from "@odd-academia/db";
import {
  DateRangePicker,
  lastNDaysRange,
  type DateRange,
} from "@/components/DateRangePicker";
import { isPublishedInRange } from "@/lib/dateRange";

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
const INITIAL_ROWS = 5;

export default function PapersPage() {
  const router = useRouter();

  // TODO (backend): replace with fetch to GET /api/papers?page=&limit=&search=
  const [papers] = useState<Paper[]>(mockAdminPapers);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(31));
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(
    () =>
      papers.filter(
        (p) =>
          (p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.author.toLowerCase().includes(search.toLowerCase())) &&
          isPublishedInRange(p.published, range),
      ),
    [papers, search, range],
  );

  const visible = showAll ? filtered : filtered.slice(0, INITIAL_ROWS);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Papers</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search — client-side only; replace with API ?search= once backend is ready */}
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

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Paper Name <SortIcon /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Author <SortIcon /></th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Views</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cited</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Downloaded</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Comments</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">No papers found.</td>
              </tr>
            ) : visible.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">{p.title}</td>
                <td className="px-4 py-3 text-gray-600">{p.author}</td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{p.published}</td>
                <td className="px-4 py-3 text-gray-600">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{p.cited}</td>
                <td className="px-4 py-3 text-gray-600">{p.downloaded}</td>
                <td className="px-4 py-3 text-gray-600">{p.comments}</td>
                <td className="px-4 py-3 text-right">
                  {/* ••• navigates to the paper detail page where Remove action lives */}
                  <button
                    onClick={() => router.push(`/papers/${p.id}`)}
                    className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 text-base leading-none tracking-widest"
                  >
                    •••
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Show More — will become server-side pagination once backend is connected */}
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
