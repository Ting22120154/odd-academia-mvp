"use client";

// TODO: swap mock import for API fetch from /api/reports once DB is connected.
// TODO: MONTHLY_REPORTS and SUMMARY_STATS below should come from DB aggregation
//       queries (GROUP BY month, COUNT per type) — replace hardcoded arrays then.
import { useState } from "react";
import { mockAdminReportedComments, type AdminReportedComment } from "@odd-academia/db";

const PAGE_SIZE = 20;

// ── Mock chart data ───────────────────────────────────────────────────────────
// Replace with real aggregation query once DB is connected.
const MONTHLY_REPORTS = [
  { month: "Sep", comments: 3, papers: 1, users: 2 },
  { month: "Oct", comments: 5, papers: 2, users: 1 },
  { month: "Nov", comments: 4, papers: 3, users: 3 },
  { month: "Dec", comments: 7, papers: 2, users: 2 },
  { month: "Jan", comments: 6, papers: 4, users: 4 },
  { month: "Feb", comments: 9, papers: 3, users: 3 },
];

const SUMMARY_STATS = [
  { label: "Comment Reports", value: 34, colour: "bg-orange-400" },
  { label: "Paper Reports",   value: 15, colour: "bg-blue-400"   },
  { label: "User Reports",    value: 15, colour: "bg-red-400"    },
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
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />Comments</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400   inline-block" />Papers</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-400    inline-block" />Users</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-3 h-40">
        {MONTHLY_REPORTS.map(m => {
          const total     = m.comments + m.papers + m.users;
          const fullH     = Math.round((total / maxTotal) * 100);
          const commentH  = Math.round((m.comments / total) * fullH);
          const paperH    = Math.round((m.papers   / total) * fullH);
          const userH     = fullH - commentH - paperH;

          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              {/* Stacked bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                <div className="w-full flex flex-col rounded-t-md overflow-hidden" style={{ height: `${fullH}%` }}>
                  <div className="w-full bg-orange-400" style={{ height: `${commentH}%` }} />
                  <div className="w-full bg-blue-400"   style={{ height: `${paperH}%`   }} />
                  <div className="w-full bg-red-400"    style={{ height: `${userH}%`    }} />
                </div>
              </div>
              {/* Count + label */}
              <span className="text-[10px] font-semibold text-gray-700">{total}</span>
              <span className="text-[10px] text-gray-400">{m.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Summary stat cards ────────────────────────────────────────────────────────
function SummaryCards() {
  const total = SUMMARY_STATS.reduce((s, x) => s + x.value, 0);
  return (
    <div className="grid grid-cols-3 gap-4">
      {SUMMARY_STATS.map(s => (
        <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className={`w-8 h-1.5 rounded-full ${s.colour} mb-3`} />
          <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          {/* Mini horizontal bar showing proportion of total */}
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${s.colour}`}
              style={{ width: `${Math.round((s.value / total) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Report card ───────────────────────────────────────────────────────────────
function fmt(date: Date): string {
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function ReportCard({ comment }: { comment: AdminReportedComment }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
            Flagged
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
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [shown, setShown] = useState(PAGE_SIZE);

  const visible = mockAdminReportedComments.slice(0, shown);
  const hasMore = shown < mockAdminReportedComments.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {mockAdminReportedComments.length} reported comments
        </p>
      </div>

      {/* Analytics — mock UI, replace with DB aggregation */}
      <SummaryCards />
      <ReportsBarChart />

      {/* Reported comments list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Reported Comments</h2>
        {mockAdminReportedComments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
            No reported comments.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visible.map(c => <ReportCard key={c.id} comment={c} />)}
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
