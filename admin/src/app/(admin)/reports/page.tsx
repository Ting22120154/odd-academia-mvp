"use client";

import { useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 20;

// ── Types from the API response ───────────────────────────────────────────────
type CommentReportRow = {
  id:        string;
  reason:    string;
  status:    string;
  createdAt: string;
  comment: {
    content: string;
    author:  { fullName: string };
    paper:   { title: string };
  };
  reporter: { fullName: string };
};

// Shape expected by the existing ReportCard component
type ReportCardData = {
  id:         string;
  author:     string;
  paperTitle: string;
  content:    string;
  reportedAt: Date;
  reportedBy: string;
  reason:     string;
  status:     string;
};

function toCardData(r: CommentReportRow): ReportCardData {
  return {
    id:         r.id,
    author:     r.comment.author.fullName,
    paperTitle: r.comment.paper.title,
    content:    r.comment.content,
    reportedAt: new Date(r.createdAt),
    reportedBy: r.reporter.fullName,
    reason:     r.reason,
    status:     r.status,
  };
}

// ── Mock chart data (TODO: replace with DB aggregation) ───────────────────────
const MONTHLY_REPORTS = [
  { month: "Sep", comments: 3, papers: 1, users: 2 },
  { month: "Oct", comments: 5, papers: 2, users: 1 },
  { month: "Nov", comments: 4, papers: 3, users: 3 },
  { month: "Dec", comments: 7, papers: 2, users: 2 },
  { month: "Jan", comments: 6, papers: 4, users: 4 },
  { month: "Feb", comments: 9, papers: 3, users: 3 },
];

// ── Bar chart ─────────────────────────────────────────────────────────────────
function ReportsBarChart() {
  const maxTotal = Math.max(
    ...MONTHLY_REPORTS.map(m => m.comments + m.papers + m.users)
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Report Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />Comments</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400   inline-block" />Papers</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400    inline-block" />Users</span>
        </div>
      </div>

      <div className="flex items-end gap-3 h-40">
        {MONTHLY_REPORTS.map(m => {
          const total    = m.comments + m.papers + m.users;
          const fullH    = Math.round((total / maxTotal) * 100);
          const commentH = Math.round((m.comments / total) * fullH);
          const paperH   = Math.round((m.papers   / total) * fullH);
          const userH    = fullH - commentH - paperH;

          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                <div className="w-full flex flex-col rounded-t-md overflow-hidden" style={{ height: `${fullH}%` }}>
                  <div className="w-full bg-orange-400" style={{ height: `${commentH}%` }} />
                  <div className="w-full bg-blue-400"   style={{ height: `${paperH}%`   }} />
                  <div className="w-full bg-red-400"    style={{ height: `${userH}%`    }} />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-700">{total}</span>
              <span className="text-[10px] text-gray-400">{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
function fmt(date: Date): string {
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_COLOURS: Record<string, string> = {
  pending:   "bg-red-100 text-red-600 border-red-200",
  reviewed:  "bg-green-100 text-green-600 border-green-200",
  dismissed: "bg-gray-100 text-gray-500 border-gray-200",
};

function ReportCard({ comment, onAction }: { comment: ReportCardData; onAction: (id: string, action: "review" | "dismiss") => void }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide ${STATUS_COLOURS[comment.status] ?? STATUS_COLOURS.pending}`}>
            {comment.status}
          </span>
          <span className="text-xs text-gray-400">
            <span className="font-medium text-gray-700">{comment.author}</span>
            {" · on "}
            <span className="font-medium text-gray-700 truncate max-w-[200px] inline-block align-bottom">
              {comment.paperTitle}
            </span>
          </span>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mt-1">{comment.content}</p>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{fmt(comment.reportedAt)}</span>
          <span>·</span>
          <span className="font-medium text-red-500">Reported by {comment.reportedBy}</span>
        </div>

        <p className="text-xs text-gray-500 mt-1 italic">"{comment.reason}"</p>

        {comment.status === "pending" && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onAction(comment.id, "review")}
              className="px-3 py-1 text-xs font-medium rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
            >
              Mark Reviewed
            </button>
            <button
              onClick={() => onAction(comment.id, "dismiss")}
              className="px-3 py-1 text-xs font-medium rounded bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const STATUS_TABS = ["all", "pending", "reviewed", "dismissed"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports,    setReports]    = useState<ReportCardData[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [statusTab,  setStatusTab]  = useState<StatusTab>("pending");
  const [shown,      setShown]      = useState(PAGE_SIZE);

  const fetchReports = useCallback(async (status: StatusTab) => {
    setLoading(true);
    try {
      const qs  = status !== "all" ? `?type=comment&status=${status}` : "?type=comment";
      const res = await fetch(`/api/reports${qs}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json() as { success: boolean; data: { commentReports: CommentReportRow[] } };
      setReports(json.data.commentReports.map(toCardData));
      setShown(PAGE_SIZE);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(statusTab); }, [statusTab, fetchReports]);

  const handleAction = useCallback(async (id: string, action: "review" | "dismiss") => {
    await fetch(`/api/reports/comment/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action }),
    });
    void fetchReports(statusTab);
  }, [statusTab, fetchReports]);

  const visible = reports.slice(0, shown);
  const hasMore = shown < reports.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? "Loading…" : `${reports.length} comment reports`}
        </p>
      </div>

      {/* Analytics — mock chart, TODO: replace with DB aggregation */}
      <ReportsBarChart />

      {/* Reported comments list */}
      <div>
        {/* Status filter tabs */}
        <div className="flex gap-1 mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">Reported Comments</h2>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
            Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
            No reported comments.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visible.map(c => (
                <ReportCard key={c.id} comment={c} onAction={handleAction} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShown(s => s + PAGE_SIZE)}
                className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Show more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
