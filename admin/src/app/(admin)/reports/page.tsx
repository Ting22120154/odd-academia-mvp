"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ReportType   = "comment" | "paper" | "user";
type ReportStatus = "pending" | "reviewed" | "dismissed";

interface Reporter {
  id:        string;
  fullName:  string;
  username:  string;
  email:     string;
  avatarUrl: string | null;
}

interface NormalizedReport {
  id:          string;
  type:        ReportType;
  status:      ReportStatus;
  createdAt:   string;
  reporter:    Reporter;
  targetId:    string | null;
  targetName:  string;
  targetDetail: string | null;
  subject:     string | null;
  reason:      string;
  fullContent: string;
  adminNote:   string | null;
  outcome:     string | null;
  commentId:   string | null;
}

// Raw API shapes
type CommentReportRow = {
  id: string; reason: string; status: string; createdAt: string;
  commentId: string | null; commentBody: string | null; commentAuthor: string | null;
  adminNote: string | null; outcome: string | null;
  comment: { content: string; author: { fullName: string }; paper: { title: string } } | null;
  reporter: Reporter;
};
type PaperReportRow = {
  id: string; subject: string; reason: string; status: string; createdAt: string;
  paperId: string | null; paperTitle: string | null;
  adminNote: string | null; outcome: string | null;
  paper: { id: string; title: string } | null;
  reporter: Reporter;
};
type UserReportRow = {
  id: string; subject: string; reason: string; status: string; createdAt: string;
  reportedId: string;
  adminNote: string | null; outcome: string | null;
  reported: { id: string; fullName: string; username: string; avatarUrl: string | null };
  reporter: Reporter;
};

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeComment(r: CommentReportRow): NormalizedReport {
  return {
    id: r.id, type: "comment", status: r.status as ReportStatus, createdAt: r.createdAt,
    reporter: r.reporter,
    targetId:    r.commentId ?? null,
    targetName:  r.comment?.author?.fullName ?? r.commentAuthor ?? "(deleted comment)",
    targetDetail: r.comment?.paper?.title ?? null,
    subject: null, reason: r.reason,
    fullContent: r.comment?.content ?? r.commentBody ?? "(unavailable)",
    adminNote: r.adminNote ?? null, outcome: r.outcome ?? null,
    commentId: r.commentId ?? null,
  };
}

function normalizePaper(r: PaperReportRow): NormalizedReport {
  return {
    id: r.id, type: "paper", status: r.status as ReportStatus, createdAt: r.createdAt,
    reporter: r.reporter,
    targetId: r.paper?.id ?? r.paperId ?? null,
    targetName: r.paper?.title ?? r.paperTitle ?? "(deleted paper)",
    targetDetail: null,
    subject: r.subject, reason: r.reason, fullContent: r.reason,
    adminNote: r.adminNote ?? null, outcome: r.outcome ?? null, commentId: null,
  };
}

function normalizeUser(r: UserReportRow): NormalizedReport {
  return {
    id: r.id, type: "user", status: r.status as ReportStatus, createdAt: r.createdAt,
    reporter: r.reporter,
    targetId: r.reportedId,
    targetName: r.reported?.fullName ?? "(deleted user)",
    targetDetail: null,
    subject: r.subject, reason: r.reason, fullContent: r.reason,
    adminNote: r.adminNote ?? null, outcome: r.outcome ?? null, commentId: null,
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ src, name, size = "8" }: { src: string | null; name: string; size?: string }) {
  const [err, setErr] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase();
  const cls = `h-${size} w-${size} rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold bg-zinc-200 text-zinc-700 overflow-hidden`;
  if (src && !err)
    return <img src={src} alt={name} className={`${cls} object-cover`} onError={() => setErr(true)} />;
  return <div className={cls}>{initial}</div>;
}

const STATUS_STYLES: Record<ReportStatus, string> = {
  pending:   "bg-orange-100 text-orange-700 border-orange-200",
  reviewed:  "bg-green-100  text-green-700  border-green-200",
  dismissed: "bg-gray-100   text-gray-500   border-gray-200",
};

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const TYPE_STYLES: Record<ReportType, string> = {
  comment: "bg-orange-50 text-orange-600 border-orange-200",
  paper:   "bg-blue-50   text-blue-600   border-blue-200",
  user:    "bg-red-50    text-red-600    border-red-200",
};

function TypeBadge({ type }: { type: ReportType }) {
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize ${TYPE_STYLES[type]}`}>
      {type}
    </span>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

const OUTCOMES = ["No Violation", "Misleading", "Hate Speech", "Spam", "Other"] as const;

function ReviewReportModal({
  report,
  onClose,
  onSaved,
}: {
  report:   NormalizedReport;
  onClose:  () => void;
  onSaved:  (id: string, status: ReportStatus, note: string, outcome: string | null) => void;
}) {
  const [status,  setStatus]  = useState<ReportStatus>(report.status);
  const [note,    setNote]    = useState(report.adminNote ?? "");
  const [outcome, setOutcome] = useState(report.outcome ?? "No Violation");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async (action: "review" | "dismiss" | "delete_comment") => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${report.type}/${report.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: note.trim() || undefined,
          outcome:   report.type === "comment" ? outcome : undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? "Failed to update report.");
        return;
      }
      const newStatus: ReportStatus = action === "dismiss" ? "dismissed" : "reviewed";
      onSaved(report.id, newStatus, note.trim(), report.type === "comment" ? outcome : null);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Review Report</h2>
            <TypeBadge type={report.type} />
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Reporter */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Reporter</p>
            <div className="flex items-center gap-2.5">
              <Avatar src={report.reporter.avatarUrl} name={report.reporter.fullName} />
              <div>
                <p className="text-sm font-medium text-gray-900">{report.reporter.fullName}</p>
                <p className="text-xs text-gray-400">{report.reporter.email}</p>
              </div>
            </div>
          </div>

          {/* Target */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Reported Target</p>
            <p className="text-sm font-medium text-gray-900">{report.targetName}</p>
            {report.targetDetail && (
              <p className="text-xs text-gray-400 mt-0.5">in {report.targetDetail}</p>
            )}
          </div>

          {/* Subject + Reason */}
          {report.subject && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Subject</p>
              <p className="text-sm text-gray-700">{report.subject}</p>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Reason</p>
            <p className="text-sm text-gray-700">{report.reason}</p>
          </div>

          {/* Full content (for comments) */}
          {report.type === "comment" && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Comment Content</p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 max-h-36 overflow-y-auto leading-relaxed">
                {report.fullContent}
              </div>
            </div>
          )}

          {/* Admin: outcome (comment only) */}
          {report.type === "comment" && (
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Outcome
              </label>
              <select
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
              >
                {OUTCOMES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          )}

          {/* Admin: status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ReportStatus)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed — Action taken</option>
              <option value="dismissed">Dismissed — No violation</option>
            </select>
          </div>

          {/* Admin: notes */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Reviewer Notes
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional internal notes…"
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded-lg bg-red-50 border border-red-200 px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-6 py-4 sticky bottom-0 bg-white">
          <button
            type="button"
            disabled={saving || status === "pending"}
            onClick={() => void handleSave(status === "dismissed" ? "dismiss" : "review")}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {report.type === "comment" && report.commentId && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave("delete_comment")}
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Delete Comment
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-100">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-2.5 w-32 rounded bg-gray-100" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-4 w-14 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-3 w-28 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-3 w-36 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-3 w-28 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-3 w-20 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-3 w-14 rounded bg-gray-200" /></td>
          <td className="px-4 py-3"><div className="h-7 w-16 rounded bg-gray-200" /></td>
        </tr>
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function ReportsPage() {
  const [reports,     setReports]     = useState<NormalizedReport[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(false);
  const [modalReport, setModalReport] = useState<NormalizedReport | null>(null);

  const [page, setPage] = useState(0);

  // Filters
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState<"all" | ReportType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/reports?type=all&limit=1000");
      if (!res.ok) throw new Error("bad response");
      const json = await res.json() as {
        success: boolean;
        data: {
          commentReports: CommentReportRow[];
          paperReports:   PaperReportRow[];
          userReports:    UserReportRow[];
        };
      };
      const all: NormalizedReport[] = [
        ...json.data.commentReports.map(normalizeComment),
        ...json.data.paperReports.map(normalizePaper),
        ...json.data.userReports.map(normalizeUser),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReports(all);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  const handleSaved = useCallback((
    id:      string,
    status:  ReportStatus,
    note:    string,
    outcome: string | null,
  ) => {
    setReports(prev => prev.map(r =>
      r.id === id ? { ...r, status, adminNote: note || null, outcome } : r
    ));
    // Switch to "all" so the updated row stays visible even when the
    // previous filter was "pending" (the row would otherwise disappear).
    setStatusFilter("all");
    setPage(0);
  }, []);

  // Client-side filtering
  const filtered = reports.filter(r => {
    if (typeFilter !== "all"   && r.type   !== typeFilter)   return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.reporter.fullName.toLowerCase().includes(q) &&
        !r.reporter.email.toLowerCase().includes(q) &&
        !r.targetName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === "pending").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 whenever filters change
  useEffect(() => { setPage(0); }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? "Loading…"
              : `${reports.length} total · ${pendingCount} pending`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchReports()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4.05 9A9 9 0 1 1 4 15" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {fetchError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
          Failed to load reports. Try refreshing.
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search reporter or target…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as "all" | ReportType)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="all">All Types</option>
          <option value="comment">Comment</option>
          <option value="paper">Paper</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "all" | ReportStatus)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="dismissed">Dismissed</option>
        </select>
        {(search || typeFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {!loading && !fetchError && (
        <p className="text-xs text-gray-400">
          {filtered.length === reports.length
            ? `${reports.length} reports`
            : `${filtered.length} of ${reports.length} reports`}
        </p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Reporter</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Reviewer Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M9 12h6M9 16h4M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6l-4-4Z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p className="text-sm text-gray-400">
                      {reports.length === 0 ? "No reports yet." : "No reports match your filters."}
                    </p>
                    {reports.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); }}
                        className="mt-2 text-xs text-blue-500 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((report, idx) => (
                  <tr
                    key={report.id}
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/40" : ""}`}
                  >
                    {/* Reporter */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <Avatar src={report.reporter.avatarUrl} name={report.reporter.fullName} />
                        <div>
                          <p className="font-medium text-gray-900 text-xs leading-tight">{report.reporter.fullName}</p>
                          <p className="text-[11px] text-gray-400 leading-tight">{report.reporter.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <TypeBadge type={report.type} />
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3 min-w-[120px]">
                      <p className="font-medium text-gray-800 text-xs leading-tight">{trunc(report.targetName, 40)}</p>
                      {report.targetDetail && (
                        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">in {trunc(report.targetDetail, 35)}</p>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 min-w-[100px]">
                      {report.subject && (
                        <p className="text-[11px] font-medium text-gray-700 leading-tight">{trunc(report.subject, 40)}</p>
                      )}
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{trunc(report.reason, 60)}</p>
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 min-w-[120px]">
                      <p className="text-[11px] text-gray-500 leading-tight italic">
                        {trunc(report.fullContent, 80)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ReportStatusBadge status={report.status} />
                    </td>

                    {/* Reviewer notes */}
                    <td className="px-4 py-3 min-w-[100px]">
                      {report.adminNote
                        ? <span className="text-[11px] text-gray-600">{trunc(report.adminNote, 50)}</span>
                        : <span className="text-[11px] text-gray-300">—</span>}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[11px] text-gray-400">{relativeTime(report.createdAt)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setModalReport(report)}
                        className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {`${Math.min(page * PAGE_SIZE + 1, filtered.length)}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length} report${filtered.length !== 1 ? "s" : ""}`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Prev
                </button>
                <span className="px-2 text-xs text-gray-400">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {modalReport && (
        <ReviewReportModal
          report={modalReport}
          onClose={() => setModalReport(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
