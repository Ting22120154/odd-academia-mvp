"use client";

/**
 * Papers list page — matches Figma design.
 * Data: GET /api/admin/papers (Neon + Prisma).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DateRangePicker,
  lastNDaysRange,
  type DateRange,
} from "@/components/DateRangePicker";

type Paper = {
  id: string;
  title: string;
  author: string;
  category: string;
  published: string;
  views: number;
  cited: number;
  downloaded: number;
  comments: number;
};

function SortIcon() {
  return (
    <svg className="inline ml-1 w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 3 18 9"/><polyline points="6 15 12 21 18 15"/>
    </svg>
  );
}

function formatPublished(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const INITIAL_ROWS = 5;

export default function PapersPage() {
  const router = useRouter();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(31));
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPapers = useCallback(async (q: string, dateRange: DateRange) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      search: q,
      page: "1",
      limit: "200",
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    });
    try {
      const res = await fetch(`/api/admin/papers?${params.toString()}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { papers: Paper[]; total: number };
        error?: string;
      };
      if (json.success && json.data) {
        setPapers(json.data.papers);
        setTotal(json.data.total);
      } else {
        setPapers([]);
        setTotal(0);
        setError(json.error ?? "Failed to load papers");
      }
    } catch {
      setPapers([]);
      setTotal(0);
      setError("Failed to load papers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setShowAll(false);
    const timer = setTimeout(() => {
      void fetchPapers(search, range);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, range, fetchPapers]);

  const visible = useMemo(
    () => (showAll ? papers : papers.slice(0, INITIAL_ROWS)),
    [papers, showAll],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">Papers</h1>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff] w-48"
            />
          </div>

          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

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
            {loading && papers.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">Loading…</td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">No papers found.</td>
              </tr>
            ) : visible.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">{p.title}</td>
                <td className="px-4 py-3 text-gray-600">{p.author}</td>
                <td className="px-4 py-3 text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{formatPublished(p.published)}</td>
                <td className="px-4 py-3 text-gray-600">{p.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600">{p.cited}</td>
                <td className="px-4 py-3 text-gray-600">{p.downloaded}</td>
                <td className="px-4 py-3 text-gray-600">{p.comments}</td>
                <td className="px-4 py-3 text-right">
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

        {papers.length > INITIAL_ROWS && (
          <div className="flex justify-end px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-sm text-[#0066ff] hover:underline font-medium"
            >
              {showAll ? "Show Less" : `Show More (${total} total)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
