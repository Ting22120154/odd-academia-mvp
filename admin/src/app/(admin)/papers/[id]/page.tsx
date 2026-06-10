"use client";

import { formatDateAU } from "@odd-academia/db/date";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  DateRangePicker,
  lastNDaysRange,
  type DateRange,
} from "@/components/DateRangePicker";
import { isPublishedInRange } from "@/lib/dateRange";

type DbPaper = {
  id: string;
  title: string;
  abstract: string | null;
  status: string;
  author: string;
  authorId: string;
  category: string;
  published: string;
  views: number;
  cited: number;
  downloaded: number;
  comments: number;
  followers: number;
  fileUrl: string | null;
};

type PaperUserRow = {
  id: string;
  name: string;
  registered: string;
  papers: number;
  following: number;
  followers: number;
  status: "Active" | "Suspended";
};

type AdminCommentReply = {
  id: string;
  author: string;
  text: string;
  isFlagged: boolean;
  badge?: "Pending Review";
};

type AdminComment = {
  id: string;
  author: string;
  text: string;
  isFlagged: boolean;
  replies: AdminCommentReply[];
};

const USER_TABS = ["Views", "Followers", "Shares", "Downloads"] as const;
const TAB_PARAM: Record<(typeof USER_TABS)[number], string> = {
  Views: "views",
  Followers: "followers",
  Shares: "shares",
  Downloads: "downloads",
};

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    Active: "text-green-600",
    Inactive: "text-gray-400",
    Suspended: "text-red-500",
  };
  return <span className={`text-xs font-medium ${colours[status] ?? "text-gray-500"}`}>{status}</span>;
}

function RemovePaperModal({
  paperTitle,
  paperId,
  onCancel,
}: {
  paperTitle: string;
  paperId: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmRemove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/papers/${paperId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setRemoved(true);
      return;
    }
    const json = await res.json().catch(() => null) as { error?: string } | null;
    setError(json?.error ?? `Failed to remove paper (${res.status}).`);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {!removed ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove Paper</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-800">{paperTitle}</span>? It will no longer appear on the
              platform.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void confirmRemove()}
                className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              >
                {busy ? "Removing…" : "Remove"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Paper removed</h2>
            <p className="text-sm text-gray-500 mb-5">This paper has been removed from the platform.</p>
            <button
              onClick={() => router.push("/papers")}
              className="w-full py-2 text-sm rounded-lg bg-[#0066ff] text-white hover:bg-blue-700"
            >
              Back to Papers
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ReportCommentModal({
  commentId,
  onKeep,
  onRemove,
}: {
  commentId: string;
  onKeep: () => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onKeep} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Comment</h2>
        <div className="flex gap-3">
          <button
            onClick={onKeep}
            className="flex-1 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Keep Comment
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
              setBusy(false);
              onRemove();
            }}
            className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
          >
            {busy ? "Removing…" : "Remove Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const menuRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<DbPaper | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>(() => lastNDaysRange(31));
  const [activeTab, setActiveTab] = useState<(typeof USER_TABS)[number]>("Followers");
  const [userPage, setUserPage] = useState(1);
  const [userRows, setUserRows] = useState<PaperUserRow[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersNote, setUsersNote] = useState<string | null>(null);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/papers/${id}`);
      const json = (await res.json()) as { success: boolean; data?: DbPaper; error?: string };
      if (cancelled) return;
      if (json.success && json.data) {
        setPaper(json.data);
        setLoadError(null);
      } else {
        setPaper(null);
        setLoadError(json.error ?? "Paper not found");
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/papers/${id}/comments`);
      const json = (await res.json()) as { success: boolean; data?: { comments: AdminComment[] } };
      if (!cancelled && json.success && json.data) {
        setComments(json.data.comments);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const fetchUsers = useCallback(async () => {
    if (!id) return;
    setUsersLoading(true);
    setUsersNote(null);
    const params = new URLSearchParams({
      tab: TAB_PARAM[activeTab],
      page: String(userPage),
      limit: "20",
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
    try {
      const res = await fetch(`/api/admin/papers/${id}/users?${params.toString()}`);
      const json = (await res.json()) as {
        success: boolean;
        data?: { users: PaperUserRow[]; total: number; note?: string };
      };
      if (json.success && json.data) {
        setUserRows(json.data.users);
        setUserTotal(json.data.total);
        setUsersNote(json.data.note ?? null);
      } else {
        setUserRows([]);
        setUserTotal(0);
      }
    } finally {
      setUsersLoading(false);
    }
  }, [id, activeTab, userPage, range]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setUserPage(1);
  }, [activeTab, range]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (loadError && !paper) {
    return (
      <div className="space-y-4">
        <Link href="/papers" className="text-sm text-gray-500 hover:text-gray-800">← Papers</Link>
        <p className="text-sm text-red-600">{loadError}</p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="space-y-4">
        <Link href="/papers" className="text-sm text-gray-500 hover:text-gray-800">← Papers</Link>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const publishedLabel = formatDateAU(paper.published);
  const inRange = isPublishedInRange(paper.published, range);
  const isRemoved = paper.status === "removed";
  const userPageCount = Math.max(1, Math.ceil(userTotal / 20));

  return (
    <div className="space-y-8" ref={menuRef}>
      <Link href="/papers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Papers
      </Link>

      <div className="relative">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 pr-16">{paper.title}</h1>
        <p className="text-sm text-gray-500 mb-4">Exploring the latest advancements in {paper.category}.</p>

        <div className="absolute top-0 right-0">
          {!isRemoved && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((m) => (m === "header" ? null : "header"))}
                className="text-gray-400 hover:text-gray-700 text-base leading-none tracking-widest px-1"
              >
                •••
              </button>
              {openMenu === "header" && (
                <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[110px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      setShowRemoveModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2"
                  >
                    Remove <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                  </button>
                </div>
              )}
            </div>
          )}
          {isRemoved && <span className="text-xs font-medium text-red-500">Removed</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
            {paper.author[0]}
          </div>
          <span className="text-sm text-gray-700">
            Authored by{" "}
            <Link href={`/users/${paper.authorId}`} className="font-semibold hover:underline">
              {paper.author}
            </Link>
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5">📅 {publishedLabel}</span>
          <span className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-600">🔖 {paper.category}</span>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800">Paper Analytics</h2>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(inRange
            ? [
                { icon: "👁", label: "Views", value: paper.views, pct: "—" },
                { icon: "👤", label: "People Following this Paper", value: paper.followers, pct: "—" },
                { icon: "💬", label: "Comments", value: paper.comments, pct: "—" },
                { icon: "⬇", label: "Downloads", value: paper.downloaded, pct: "—" },
                { icon: "📎", label: "Citations", value: paper.cited, pct: "—" },
              ]
            : [
                { icon: "👁", label: "Views", value: 0, pct: "—" },
                { icon: "💬", label: "Comments", value: 0, pct: "—" },
              ]
          ).map((stat) => (
            <div key={stat.label} className="border border-gray-100 rounded-lg p-4">
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{stat.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {paper.fileUrl ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <a
            href={paper.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0066ff] hover:underline"
          >
            Open uploaded PDF
          </a>
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Abstract</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {paper.abstract?.trim() || "No abstract provided."}
        </p>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Users</h3>
        <div className="flex gap-2 mb-4 flex-wrap">
          {USER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#0066ff] text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {usersNote ? <p className="text-xs text-gray-400 mb-3">{usersNote}</p> : null}

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Registered Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">No. Papers Published</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Following</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Followers</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersLoading && userRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">Loading…</td>
                  </tr>
                ) : userRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      {activeTab === "Followers"
                        ? "No users follow this paper in the selected date range."
                        : activeTab === "Views"
                          ? "No commenters for this paper in the selected date range."
                          : "No data for this tab."}
                    </td>
                  </tr>
                ) : (
                  userRows.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/users/${u.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDateAU(u.registered)}</td>
                      <td className="px-4 py-3 text-gray-500">{u.papers}</td>
                      <td className="px-4 py-3 text-gray-500">{u.following}</td>
                      <td className="px-4 py-3 text-gray-500">{u.followers}</td>
                      <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/users/${u.id}`);
                          }}
                          className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 text-base leading-none tracking-widest"
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={userPage === 1 || usersLoading}
              className="disabled:opacity-30"
            >
              ←
            </button>
            <span>
              Page {userPage} of {userPageCount} ({userTotal} users)
            </span>
            <button
              type="button"
              onClick={() => setUserPage((p) => Math.min(userPageCount, p + 1))}
              disabled={userPage >= userPageCount || usersLoading}
              className="disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="pb-8">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Comments <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-1 align-middle" />
        </h3>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments on this paper.</p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id}>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                    {comment.author[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-800 mb-1">{comment.author}</p>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{comment.text}</p>
                  </div>
                </div>
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="ml-11 mt-4 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {reply.author[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-800">{reply.author}</p>
                        {reply.badge && (
                          <button
                            type="button"
                            onClick={() => setReportTarget(reply.id)}
                            className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 hover:bg-orange-100"
                          >
                            {reply.badge}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{reply.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showRemoveModal && (
        <RemovePaperModal
          paperTitle={paper.title}
          paperId={paper.id}
          onCancel={() => setShowRemoveModal(false)}
        />
      )}

      {reportTarget !== null && (
        <ReportCommentModal
          commentId={reportTarget}
          onKeep={() => setReportTarget(null)}
          onRemove={() => {
            setComments((prev) =>
              prev.map((c) => ({
                ...c,
                replies: c.replies.filter((r) => r.id !== reportTarget),
              })),
            );
            setReportTarget(null);
          }}
        />
      )}
    </div>
  );
}
