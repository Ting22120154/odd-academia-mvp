"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  _count: { papers: number; followers: number; following: number };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-pulse">
      {msg}
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [warnTarget, setWarnTarget] = useState<User | null>(null);
  const [warnMsg, setWarnMsg] = useState("");
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
    const res = await fetch(`/api/users?${p}`);
    if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
    const data = await res.json();
    if (data.success) { setUsers(data.data.users); setTotal(data.data.total); }
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  async function handleBan() {
    if (!banTarget) return;
    setActing(true);
    const res = await fetch(`/api/users/${banTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    setActing(false);
    setBanTarget(null);
    if (data.success) {
      setUsers((prev) => prev.filter((u) => u.id !== banTarget.id));
      setTotal((t) => t - 1);
      showToast(`${banTarget.fullName} has been banned.`);
    } else {
      showToast(data.error ?? "Failed to ban user.");
    }
  }

  async function handleWarn() {
    if (!warnTarget || !warnMsg.trim()) return;
    setActing(true);
    const res = await fetch(`/api/users/${warnTarget.id}/warn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: warnMsg }),
    });
    const data = await res.json();
    setActing(false);
    setWarnTarget(null);
    setWarnMsg("");
    showToast(data.success ? "Warning sent successfully." : (data.error ?? "Failed to send warning."));
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString()} total accounts</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-5 p-4">
        <input
          type="text"
          placeholder="Search by name, username, or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:ring-offset-1"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-7 h-7 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Papers</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Followers</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.fullName}</div>
                        <div className="text-gray-400 text-xs">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600">{u._count.papers}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600">{u._count.followers}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{fmt(u.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setWarnTarget(u); setWarnMsg(""); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-yellow-200 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                      >
                        Warn
                      </button>
                      <button
                        onClick={() => setBanTarget(u)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        Ban
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
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Ban modal */}
      {banTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ban User</h2>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to ban{" "}
              <span className="font-semibold text-gray-800">{banTarget.fullName}</span>? This
              will permanently delete their account and all their content. This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBanTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={acting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {acting ? "Banning…" : "Confirm Ban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warn modal */}
      {warnTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Warn User</h2>
            <p className="text-sm text-gray-500 mb-4">
              Send a warning message to{" "}
              <span className="font-semibold text-gray-800">{warnTarget.fullName}</span>.
            </p>
            <textarea
              value={warnMsg}
              onChange={(e) => setWarnMsg(e.target.value)}
              rows={4}
              placeholder="Describe the violation and expected behaviour…"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0066ff] mb-4 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setWarnTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWarn}
                disabled={acting || !warnMsg.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
              >
                {acting ? "Sending…" : "Send Warning"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} />}
    </div>
  );
}
