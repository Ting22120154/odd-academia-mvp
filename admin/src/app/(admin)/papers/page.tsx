"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Paper {
  id: string;
  title: string;
  status: "published" | "pending" | "removed";
  isAnonymous: boolean;
  createdAt: string;
  viewCount: number;
  author: { id: string; fullName: string; username: string } | null;
  categories: { id: string; category: string }[];
  _count: { comments: number };
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

export default function PapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [deleteTarget, setDeleteTarget] = useState<Paper | null>(null);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) p.set("search", search);
    if (statusFilter) p.set("status", statusFilter);
    const res = await fetch(`/api/papers?${p}`);
    if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
    const data = await res.json();
    if (data.success) { setPapers(data.data.papers); setTotal(data.data.total); }
    setLoading(false);
  }, [page, search, statusFilter, router]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(paperId: string, newStatus: string) {
    const res = await fetch(`/api/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setPapers((prev) =>
        prev.map((p) => (p.id === paperId ? { ...p, status: newStatus as Paper["status"] } : p))
      );
      showToast("Status updated.");
    } else {
      showToast(data.error ?? "Failed to update status.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setActing(true);
    const res = await fetch(`/api/papers/${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    setActing(false);
    setDeleteTarget(null);
    if (data.success) {
      setPapers((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      showToast("Paper deleted.");
    } else {
      showToast(data.error ?? "Failed to delete paper.");
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Papers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total papers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5 p-4 flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by title or abstract…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-1 text-gray-600"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-7 h-7 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No papers found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Author</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Views</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Submitted</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {papers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 max-w-xs">
                    <div className="font-medium text-gray-900 truncate">{p.title}</div>
                    {p.categories.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {p.categories.slice(0, 2).map((c) => c.category).join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {p.isAnonymous ? (
                      <span className="text-gray-400 italic">Anonymous</span>
                    ) : p.author ? (
                      <div>
                        <div className="font-medium text-gray-700">{p.author.fullName}</div>
                        <div className="text-xs text-gray-400">@{p.author.username}</div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0066ff] text-gray-700"
                    >
                      <option value="published">Published</option>
                      <option value="pending">Pending</option>
                      <option value="removed">Removed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5 text-center text-gray-500 text-xs">{p.viewCount.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{fmt(p.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">Previous</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs">Next</button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove Paper</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-800">&ldquo;{deleteTarget.title}&rdquo;</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={acting} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">
                {acting ? "Removing…" : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}
