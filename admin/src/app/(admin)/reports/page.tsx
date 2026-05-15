"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Reporter {
  id: string;
  fullName: string;
  username: string;
}

interface Report {
  id: string;
  reason: string;
  createdAt: string;
  reporter: Reporter;
}

interface ReportedComment {
  id: string;
  content: string;
  isHidden: boolean;
  isFlagged: boolean;
  createdAt: string;
  author: { id: string; fullName: string; username: string };
  paper: { id: string; title: string };
  reports: Report[];
  _count: { reports: number };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50">
      {msg}
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<ReportedComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    const res = await fetch(`/api/reports?${p}`);
    if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
    const data = await res.json();
    if (data.success) { setComments(data.data.comments); setTotal(data.data.total); }
    setLoading(false);
  }, [page, router]);

  useEffect(() => { load(); }, [load]);

  async function toggleHidden(comment: ReportedComment) {
    setActing(comment.id);
    const newVal = !comment.isHidden;
    const res = await fetch(`/api/papers/${comment.paper.id}/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: newVal }),
    });
    const data = await res.json();
    setActing(null);
    if (data.success) {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, isHidden: newVal } : c))
      );
      showToast(newVal ? "Comment hidden." : "Comment unhidden.");
    } else {
      showToast(data.error ?? "Action failed.");
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} reported comments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52">
          <div className="w-7 h-7 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
          No reported comments.
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                c.isFlagged ? "border-red-200" : "border-gray-100"
              }`}
            >
              {/* Header row */}
              <div className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {c.isFlagged && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-600 border border-red-200 uppercase tracking-wide">
                        Flagged
                      </span>
                    )}
                    {c.isHidden && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
                        Hidden
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      <span className="font-medium text-gray-700">{c.author.fullName}</span>
                      {" "}·{" "}
                      on{" "}
                      <span className="font-medium text-gray-700 truncate max-w-[200px] inline-block align-bottom">
                        {c.paper.title}
                      </span>
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{c.content}</p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{fmt(c.createdAt)}</span>
                    <span>·</span>
                    <span className="font-medium text-red-500">{c._count.reports} report{c._count.reports !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {expanded === c.id ? "Hide details" : "View reports"}
                  </button>
                  <button
                    onClick={() => toggleHidden(c)}
                    disabled={acting === c.id}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                      c.isHidden
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                        : "border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {acting === c.id ? "…" : c.isHidden ? "Unhide" : "Hide"}
                  </button>
                </div>
              </div>

              {/* Expanded reports */}
              {expanded === c.id && (
                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                    Report details
                  </p>
                  <div className="space-y-2">
                    {c.reports.map((r) => (
                      <div key={r.id} className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {r.reporter.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">{r.reporter.fullName}</span>
                          <span className="text-gray-400"> · {fmt(r.createdAt)}</span>
                          <p className="text-gray-600 mt-0.5">{r.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 mt-2">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">Next</button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}
