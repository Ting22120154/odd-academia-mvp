"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Types matching GET /api/admin/users/:id response shape
// ---------------------------------------------------------------------------
type Category = { id: string; name: string };

type DbPaper = {
  id:         string;
  title:      string;
  status:     string;
  createdAt:  string;
  categories: Category[];
};

type DbComment = {
  id:        string;
  content:   string;
  createdAt: string;
  paper:     { id: string; title: string };
  reports:   { id: string }[];
};

type DbUser = {
  id:       string;
  fullName: string;
  email:    string;
  username: string;
  jobTitle: string | null;
  bio:      string | null;
  isBanned: boolean;
  warnCount: number;
  papers:   DbPaper[];
  comments: DbComment[];
  _count:   { followers: number; following: number; papers: number };
};

// ---------------------------------------------------------------------------
// Warn User modal
// ---------------------------------------------------------------------------
function WarnUserModal({
  userName,
  userId,
  currentWarnCount,
  onCancel,
  onDone,
}: {
  userName:         string;
  userId:           string;
  currentWarnCount: number;
  onCancel:         () => void;
  onDone:           (newCount: number, autoSuspended: boolean) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy,   setBusy]   = useState(false);
  const [done,   setDone]   = useState(false);

  const newCount        = currentWarnCount + 1;
  const willAutoSuspend = newCount >= 4;

  async function handleConfirm() {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "warn", reason: reason.trim() || undefined }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      onDone(newCount, willAutoSuspend);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {!done ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1 text-center">Issue Warning</h2>
            <p className="text-sm text-gray-500 mb-1 text-center">
              Warning{" "}
              <span className="font-semibold text-orange-500">{newCount}</span>
              {" "}of 4 for{" "}
              <span className="font-semibold text-gray-800">{userName}</span>.
            </p>
            {willAutoSuspend && (
              <p className="text-xs text-red-500 text-center font-medium mt-1">
                This will automatically suspend the account.
              </p>
            )}
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for warning (optional)…"
              rows={3}
              className="w-full mt-4 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:border-gray-400"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirm()}
                disabled={busy}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60"
              >
                {busy ? "Sending…" : willAutoSuspend ? "Warn & Suspend" : "Issue Warning"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {willAutoSuspend ? "Warned & Suspended" : "Warning Issued"}
            </h2>
            <p className="text-sm text-gray-500">
              {willAutoSuspend
                ? `${userName} has been warned (${newCount}/4) and automatically suspended.`
                : `${userName} has received warning ${newCount} of 4.`}
            </p>
            <button
              onClick={onCancel}
              className="mt-5 w-full py-2 text-sm rounded-lg bg-[#0066ff] text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remove User modal
// ---------------------------------------------------------------------------
function RemoveUserModal({
  userName,
  userId,
  onCancel,
  onConfirm,
}: {
  userName:  string;
  userId:    string;
  onCancel:  () => void;
  onConfirm: () => void;
}) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [busy,    setBusy]    = useState(false);

  async function handleConfirm() {
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "ban" }),
    });
    setBusy(false);
    onConfirm();
    setRemoved(true);
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
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove User</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you would like to remove{" "}
              <span className="font-semibold text-gray-800">{userName}</span>? This user will
              lose all access to Odd Academia and all its functionalities.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onCancel}
                className="px-5 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="px-5 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2 disabled:opacity-60"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {busy ? "Removing…" : "Remove User"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066ff" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">User has been removed</h2>
            <p className="text-sm text-gray-500 mb-6">
              User has been removed from the platform. They will no longer have access.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2 text-sm rounded-lg bg-[#0066ff] text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Calendar
// ---------------------------------------------------------------------------
const CAL_DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const CAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar() {
  const [year, setYear]   = useState(2025);
  const [month, setMonth] = useState(0);

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">‹</button>
        <span className="text-sm font-semibold text-gray-800">{CAL_MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {CAL_DAYS.map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => (
          <div key={i} className={`text-xs text-center py-1 rounded ${day ? "text-gray-700 hover:bg-blue-50 cursor-pointer" : ""}`}>
            {day ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function UserDetailPage() {
  const params = useParams();
  const id     = typeof params.id === "string" ? params.id : "";

  const [user,           setUser]           = useState<DbUser | null>(null);
  const [papers,         setPapers]         = useState<DbPaper[]>([]);
  const [comments,       setComments]       = useState<DbComment[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);
  const [actionBusy,     setActionBusy]     = useState(false);
  const [calendarOpen,   setCalendarOpen]   = useState(false);
  const [paperSearch,    setPaperSearch]    = useState("");
  const [showAllPapers,  setShowAllPapers]  = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showWarnModal,   setShowWarnModal]   = useState(false);
  const [openMenu,       setOpenMenu]       = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/users/${id}`);
      const json = await res.json() as { success: boolean; data: DbUser };
      if (!res.ok || !json.success) { setNotFound(true); return; }
      setUser(json.data);
      setPapers(json.data.papers);
      setComments(json.data.comments);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchUser(); }, [fetchUser]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(paperSearch.toLowerCase())
  );
  const visiblePapers = showAllPapers ? filteredPapers : filteredPapers.slice(0, 3);

  async function moderateUser(action: "warn" | "ban" | "unban") {
    setActionBusy(true);
    setOpenMenu(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) {
        // Reflect change optimistically
        setUser(u => u ? { ...u, isBanned: action === "ban" } : u);
      }
    } finally {
      setActionBusy(false);
    }
  }

  async function removePaper(paperId: string) {
    setOpenMenu(null);
    await fetch(`/api/admin/papers/${paperId}`, { method: "DELETE" });
    setPapers(prev => prev.filter(p => p.id !== paperId));
  }

  async function removeComment(commentId: string) {
    setOpenMenu(null);
    await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">Loading…</div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="space-y-4">
        <Link href="/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Users
        </Link>
        <p className="text-gray-500 text-sm">User not found.</p>
      </div>
    );
  }

  const isSuspended  = user.isBanned;
  const statusLabel  = isSuspended ? "Suspended" : "Active";
  const statusColour = isSuspended ? "text-red-500" : "text-green-600";

  return (
    <div className="space-y-8" ref={menuRef}>

      {/* ── Back link ── */}
      <Link href="/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Users
      </Link>

      {/* ── Profile header ── */}
      <div className="relative">
        {/* Status + action menu */}
        <div className="absolute top-0 right-0 flex items-center gap-3">
          <span className={`text-sm font-medium ${statusColour}`}>{statusLabel}</span>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(m => m === "header" ? null : "header")}
              disabled={actionBusy}
              className="text-gray-400 hover:text-gray-700 text-base leading-none tracking-widest px-1 disabled:opacity-60"
            >
              •••
            </button>
            {openMenu === "header" && (
              <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[110px] overflow-hidden">
                {isSuspended ? (
                  <button
                    onClick={() => void moderateUser("unban")}
                    className="w-full text-left px-4 py-2 text-xs text-green-600 hover:bg-gray-50 flex items-center gap-2"
                  >
                    Activate <span className="w-2 h-2 rounded-full bg-green-500 ml-auto" />
                  </button>
                ) : (
                  <button
                    onClick={() => void moderateUser("ban")}
                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2"
                  >
                    Suspend <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                  </button>
                )}
                <button
                  onClick={() => { setOpenMenu(null); setShowWarnModal(true); }}
                  className="w-full text-left px-4 py-2 text-xs text-yellow-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  Warn <span className="w-2 h-2 rounded-full bg-yellow-400 ml-auto" />
                </button>
                <button
                  onClick={() => { setOpenMenu(null); setShowRemoveModal(true); }}
                  className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                >
                  Remove <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar + identity */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {user.fullName[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-500">@{user.username}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            {user.jobTitle && <p className="text-sm text-gray-500">{user.jobTitle}</p>}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-2xl">{user.bio}</p>
        )}

        {/* Followers / following */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-700">
          <span><strong>{user._count.followers}</strong> followers</span>
          <span><strong>{user._count.following}</strong> following</span>
        </div>

        {/* Social links — cosmetic */}
        <div className="flex items-center gap-2 mt-3">
          <a href="#" className="text-gray-500 hover:text-gray-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.57V9h3.55v11.45zM22.23 0H1.77C.79 0 .77.77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46C23.21 24 24 23.23 24 22.28V1.72C24 .77 23.21 0 22.23 0z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── Engagement Metrics ── */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "📄", label: "Papers",          value: user._count.papers    },
            { icon: "👤", label: "Followers",        value: user._count.followers },
            { icon: "👁",  label: "Following",        value: user._count.following },
            { icon: "⚠️", label: "Warnings",         value: user.warnCount        },
          ].map(m => (
            <div key={m.label} className="border border-gray-100 rounded-lg p-4 flex items-center gap-3">
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Papers section ── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800">
            Papers <span className="text-gray-400 font-normal">({papers.length})</span>
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={paperSearch}
                onChange={e => setPaperSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0066ff] w-36"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setCalendarOpen(o => !o)}
                className="flex items-center gap-1.5 border border-gray-300 rounded-md px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                15.01.2025–14.02.2025
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {calendarOpen && (
                <div className="absolute right-0 mt-2 z-50">
                  <Calendar />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Papers table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Paper Name
                    <svg className="inline ml-1 w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 3 18 9"/><polyline points="6 15 12 21 18 15"/>
                    </svg>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Published</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiblePapers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400 text-xs">No papers found.</td>
                  </tr>
                ) : visiblePapers.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.categories[0]?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{p.status}</td>
                    <td className="px-4 py-3 text-right relative">
                      <button
                        onClick={() => setOpenMenu(m => m === p.id ? null : p.id)}
                        className="text-gray-400 hover:text-gray-700 px-1 text-base leading-none tracking-widest"
                      >
                        •••
                      </button>
                      {openMenu === p.id && (
                        <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[100px] overflow-hidden">
                          <button
                            onClick={() => void removePaper(p.id)}
                            className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2"
                          >
                            Remove <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPapers.length > 3 && (
            <div className="flex justify-end px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setShowAllPapers(v => !v)}
                className="text-sm text-[#0066ff] hover:underline font-medium"
              >
                {showAllPapers ? "Show Less" : "Show More"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments section ── */}
      <div className="pb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          Comments <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-1 align-middle" />
        </h2>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">No comments yet.</p>
        ) : (
          <div className="space-y-5">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {user.fullName[0]}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">{user.fullName}</span>

                    {c.reports.length > 0 && (
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5">
                        Pending Review
                      </span>
                    )}

                    <span className="text-xs text-gray-400 ml-auto">{formatDate(c.createdAt)}</span>

                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(m => m === c.id ? null : c.id)}
                        className="text-gray-400 hover:text-gray-600 text-base leading-none tracking-widest ml-1"
                      >
                        •••
                      </button>
                      {openMenu === c.id && (
                        <div className="absolute right-0 top-5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[100px] overflow-hidden">
                          <button
                            onClick={() => void removeComment(c.id)}
                            className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-gray-50 flex items-center gap-2"
                          >
                            Remove <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-1">on: {c.paper.title}</p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">{c.content}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Reply
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      Like
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Warn User modal ── */}
      {showWarnModal && (
        <WarnUserModal
          userName={user.fullName}
          userId={id}
          currentWarnCount={user.warnCount}
          onCancel={() => setShowWarnModal(false)}
          onDone={(newCount, autoSuspended) => {
            setUser(u => u ? { ...u, warnCount: newCount, isBanned: autoSuspended || u.isBanned } : u);
            setShowWarnModal(false);
          }}
        />
      )}

      {/* ── Remove User modal ── */}
      {showRemoveModal && (
        <RemoveUserModal
          userName={user.fullName}
          userId={id}
          onCancel={() => setShowRemoveModal(false)}
          onConfirm={() => setUser(u => u ? { ...u, isBanned: true } : u)}
        />
      )}

    </div>
  );
}
