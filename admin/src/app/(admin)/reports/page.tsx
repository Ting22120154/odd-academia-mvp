"use client";

import { useState, useEffect, useCallback } from "react";

const PAGE_SIZE = 20;

// ── Types from the API response ───────────────────────────────────────────────
type CommentReportRow = {
  id:            string;
  reason:        string;
  status:        string;
  createdAt:     string;
  commentId:     string | null;
  commentBody:   string | null;
  commentAuthor: string | null;
  comment: {
    content: string;
    author:  { fullName: string };
    paper:   { title: string };
  } | null;
  reporter: { fullName: string };
};

type PaperReportRow = {
  id:         string;
  subject:    string;
  reason:     string;
  status:     string;
  createdAt:  string;
  paperTitle: string | null;
  paper:      { title: string } | null;
  reporter:   { fullName: string };
};

type UserReportRow = {
  id:        string;
  subject:   string;
  reason:    string;
  status:    string;
  createdAt: string;
  reported:  { fullName: string };
  reporter:  { fullName: string };
};

// Shape expected by the ReportCard component
type ReportCardData = {
  id:         string;
  author:     string;
  paperTitle: string;
  content:    string;
  reportedAt: Date;
  reportedBy: string;
  reason:     string;
  status:     string;
  commentId?: string;
};

function toCommentCardData(r: CommentReportRow): ReportCardData {
  return {
    id:         r.id,
    author:     r.comment?.author?.fullName ?? r.commentAuthor ?? "Unknown",
    paperTitle: r.comment?.paper?.title ?? "(unknown paper)",
    content:    r.comment?.content ?? r.commentBody ?? "(comment text unavailable)",
    reportedAt: new Date(r.createdAt),
    reportedBy: r.reporter.fullName,
    reason:     r.reason,
    status:     r.status,
    commentId:  r.commentId ?? undefined,
  };
}

function toPaperCardData(r: PaperReportRow): ReportCardData {
  const title = r.paper?.title ?? r.paperTitle ?? "(unknown paper)";
  return {
    id:         r.id,
    author:     title,
    paperTitle: title,
    content:    r.subject,
    reportedAt: new Date(r.createdAt),
    reportedBy: r.reporter.fullName,
    reason:     r.reason,
    status:     r.status,
  };
}

function toUserCardData(r: UserReportRow): ReportCardData {
  return {
    id:         r.id,
    author:     r.reported.fullName,
    paperTitle: "(user account)",
    content:    r.subject,
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
// TIMEZONE: All report timestamps must render in Australia/Sydney (AEST/AEDT)
function fmt(date: Date): string {
  return date.toLocaleString("en-AU", {
    timeZone:       "Australia/Sydney",
    day:            "numeric",
    month:          "short",
    year:           "numeric",
    hour:           "numeric",
    minute:         "2-digit",
    hour12:         true,
    timeZoneName:   "short",
  });
}

const STATUS_COLOURS: Record<string, string> = {
  pending:   "bg-red-100 text-red-600 border-red-200",
  reviewed:  "bg-green-100 text-green-600 border-green-200",
  dismissed: "bg-gray-100 text-gray-500 border-gray-200",
};

const OUTCOMES = ["No Violation", "Misleading", "Hate Speech", "Spam", "Other"] as const;

function ReportCard({
  report,
  typeTab,
  onAction,
}: {
  report:   ReportCardData;
  typeTab:  TypeTab;
  onAction: (id: string, action: "review" | "dismiss" | "delete_comment", note: string, outcome: string) => void;
}) {
  const [note,    setNote]    = useState("");
  const [outcome, setOutcome] = useState("No Violation");

  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide ${STATUS_COLOURS[report.status] ?? STATUS_COLOURS.pending}`}>
            {report.status}
          </span>
          {typeTab === "comments" && (
            <span className="text-xs text-gray-400">
              <span className="font-medium text-gray-700">{report.author}</span>
              {" · on "}
              <span className="font-medium text-gray-700 truncate max-w-[200px] inline-block align-bottom">
                {report.paperTitle}
              </span>
            </span>
          )}
          {typeTab === "papers" && (
            <span className="text-xs text-gray-400">
              Paper: <span className="font-medium text-gray-700">{report.paperTitle}</span>
            </span>
          )}
          {typeTab === "users" && (
            <span className="text-xs text-gray-400">
              User: <span className="font-medium text-gray-700">{report.author}</span>
            </span>
          )}
        </div>

        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mt-1">{report.content}</p>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>{fmt(report.reportedAt)}</span>
          <span>·</span>
          <span className="font-medium text-red-500">Reported by {report.reportedBy}</span>
        </div>

        <p className="text-xs text-gray-500 mt-1 italic">"{report.reason}"</p>

        {report.status === "pending" && (
          <div className="mt-3 space-y-2">
            {/* MODERATION: Admin notes and outcome must be persisted on the report record */}
            <select
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-gray-400"
            >
              {OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Review notes (optional)…"
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 resize-none focus:outline-none focus:border-gray-400"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => onAction(report.id, "review", note, outcome)}
                className="px-3 py-1 text-xs font-medium rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
              >
                Mark Reviewed
              </button>
              <button
                onClick={() => onAction(report.id, "dismiss", note, outcome)}
                className="px-3 py-1 text-xs font-medium rounded bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Dismiss
              </button>
              {typeTab === "comments" && (
                <button
                  onClick={() => onAction(report.id, "delete_comment", note, outcome)}
                  className="px-3 py-1 text-xs font-medium rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  Delete Comment
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const TYPE_TABS   = ["comments", "papers", "users"]                    as const;
const STATUS_TABS = ["all", "pending", "reviewed", "dismissed"]        as const;
type TypeTab   = (typeof TYPE_TABS)[number];
type StatusTab = (typeof STATUS_TABS)[number];

const TYPE_LABELS: Record<TypeTab, string> = {
  comments: "Comment Reports",
  papers:   "Paper Reports",
  users:    "User Reports",
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports,   setReports]   = useState<ReportCardData[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [typeTab,   setTypeTab]   = useState<TypeTab>("comments");
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [shown,     setShown]     = useState(PAGE_SIZE);

  const fetchReports = useCallback(async (type: TypeTab, status: StatusTab) => {
    setLoading(true);
    try {
      const statusQs = status !== "all" ? `&status=${status}` : "";
      const apiType  = type === "comments" ? "comment" : type === "papers" ? "paper" : "user";
      const res = await fetch(`/api/reports?type=${apiType}${statusQs}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json() as {
        success: boolean;
        data: {
          commentReports: CommentReportRow[];
          paperReports:   PaperReportRow[];
          userReports:    UserReportRow[];
        };
      };

      if (type === "comments") {
        setReports(json.data.commentReports.map(toCommentCardData));
      } else if (type === "papers") {
        setReports(json.data.paperReports.map(toPaperCardData));
      } else {
        setReports(json.data.userReports.map(toUserCardData));
      }
      setShown(PAGE_SIZE);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(typeTab, statusTab); }, [typeTab, statusTab, fetchReports]);

  const handleAction = useCallback(async (
    id:      string,
    action:  "review" | "dismiss" | "delete_comment",
    note:    string,
    outcome: string,
  ) => {
    const apiType = typeTab === "comments" ? "comment" : typeTab === "papers" ? "paper" : "user";
    await fetch(`/api/reports/${apiType}/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, adminNote: note, outcome }),
    });
    void fetchReports(typeTab, statusTab);
  }, [typeTab, statusTab, fetchReports]);

  const visible = reports.slice(0, shown);
  const hasMore = shown < reports.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {loading ? "Loading…" : `${reports.length} ${TYPE_LABELS[typeTab].toLowerCase()}`}
        </p>
      </div>

      {/* Analytics — mock chart, TODO: replace with DB aggregation */}
      <ReportsBarChart />

      <div>
        {/* Type tabs */}
        <div className="flex gap-1 mb-3">
          {TYPE_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setTypeTab(tab); setStatusTab("pending"); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                typeTab === tab
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1 mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">{TYPE_LABELS[typeTab]}</h2>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
            Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
            No {TYPE_LABELS[typeTab].toLowerCase()}.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visible.map(r => (
                <ReportCard key={r.id} report={r} typeTab={typeTab} onAction={handleAction} />
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
