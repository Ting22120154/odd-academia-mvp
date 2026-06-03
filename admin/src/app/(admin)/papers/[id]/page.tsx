"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockAdminPapers, mockAdminComments, mockAdminUsers, mockAdminCitations } from "@odd-academia/db";

// ---------------------------------------------------------------------------
// Inline Calendar
// ---------------------------------------------------------------------------
const DAYS   = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function Calendar() {
  const [year,  setYear]  = useState(2025);
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
        <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded text-gray-500 text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-1">{d}</div>)}
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
// Report Comment modal — shown when admin clicks a "Pending Review" badge.
// Admin can keep the comment or remove it.
// TODO: wire "Remove Comment" to DELETE /api/comments/:id
// ---------------------------------------------------------------------------
function ReportCommentModal({
  commentId,
  onKeep,
  onRemove,
}: {
  commentId: string;
  onKeep:    () => void;
  onRemove:  () => void;
}) {
  const [subject,     setSubject]     = useState("");
  const [description, setDescription] = useState("");
  const [busy,        setBusy]        = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onKeep} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Comment</h2>

        {/* Subject — filled by admin before deciding action */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="How did you like this cite in my paper."
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff]"
          />
        </div>

        {/* Description — reason for the report */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="The comment we talking about biohazards in my AI paper."
            className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff] resize-none"
          />
        </div>

        <div className="flex gap-3">
          {/* Keep Comment — dismisses the report, comment stays visible */}
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

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    Active:    "text-green-600",
    Inactive:  "text-gray-400",
    Suspended: "text-red-500",
  };
  return <span className={`text-xs font-medium ${colours[status] ?? "text-gray-500"}`}>{status}</span>;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const USER_TABS = ["Views", "Followers", "Shares", "Downloads"] as const;

export default function PaperDetailPage() {
  const params  = useParams();
  const id      = typeof params.id === "string" ? params.id : "1";
  const paper   = mockAdminPapers.find(p => p.id === id) ?? mockAdminPapers[0];

  // paperIndex is 0-based; mockAdminComments.paperId is also 0-based
  const paperIndex = Number(id) - 1;

  const [calendarOpen,  setCalendarOpen]  = useState(false);
  const [activeTab,     setActiveTab]     = useState<typeof USER_TABS[number]>("Views");
  const [userPage,      setUserPage]      = useState(1);

  // reportTarget holds the id of the reply whose "Pending Review" badge was clicked.
  // null means the modal is closed.
  const [reportTarget,  setReportTarget]  = useState<string | null>(null);
  const [comments,      setComments]      = useState(
    mockAdminComments.filter(c => c.paperId === paperIndex)
  );

  return (
    <div className="space-y-8">

      {/* ── Back link ── */}
      <Link href="/papers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Papers
      </Link>

      {/* ── Paper header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{paper.title}</h1>
        <p className="text-sm text-gray-500 mb-4">Exploring the latest advancements in {paper.category}.</p>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Author */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                {paper.author[0]}
              </div>
              <span className="text-sm text-gray-700">Authored by <strong>{paper.author}</strong></span>
            </div>
          </div>
        </div>

        {/* Date + category tag */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1">
            📅 {paper.published}
          </span>
          <span className="text-xs border border-gray-200 rounded px-2 py-0.5 text-gray-600 flex items-center gap-1">
            🔖 {paper.category}
          </span>
        </div>
      </div>

      {/* ── Paper Analytics ── */}
      <div className="border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-base font-semibold text-gray-800">Paper Analytics</h2>
          <div className="relative">
            <button
              onClick={() => setCalendarOpen(o => !o)}
              className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              15.01.2025–14.02.2025
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* Stat cards — 1 col mobile, 2 col sm, 3 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "👁",  label: "Views",                     value: paper.views,      pct: "+10%" },
            { icon: "👤",  label: "People Following this Paper", value: 100,              pct: "+8%"  },
            { icon: "💬",  label: "Comments",                   value: paper.comments,   pct: "+8%"  },
            { icon: "⬇",  label: "Downloads",                  value: paper.downloaded, pct: "+18%" },
            { icon: "↗",  label: "Shares",                     value: 35,               pct: "+2%"  },
            { icon: "📎",  label: "Citations",                  value: paper.cited,      pct: "+3%"  },
          ].map(stat => (
            <div key={stat.label} className="border border-gray-100 rounded-lg p-4">
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{stat.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Paper Content Viewer ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>📄 Page 1 of 235</span>
          <span>🔍 Zoom</span>
          <span>⛶ Full-screen</span>
        </div>

        {/* Content */}
        <div className="p-6 max-h-80 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{paper.title}</h3>
          <p className="text-sm text-gray-700 mb-3">
            As urban populations continue to grow, the need for sustainable energy practices in cities becomes increasingly urgent.
            Urban areas account for over 70% of global energy consumption and a significant share of greenhouse gas emissions.
          </p>
          <p className="text-sm text-gray-700 mb-4">
            However, they also offer unique opportunities to integrate innovative energy solutions that can reduce environmental impact,
            lower energy costs, and improve quality of life.
          </p>
          {/* Placeholder image */}
          <div className="w-full h-40 bg-gradient-to-b from-sky-200 to-green-100 rounded flex items-center justify-center text-gray-400 text-sm">
            [Paper figure — wind turbines]
          </div>
        </div>
      </div>

      {/* ── Abstract ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Abstract</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          This research paper thoroughly examines Sustainable Energy Practices in Urban Environments. It extensively discusses the
          challenges and opportunities associated with implementing sustainable energy systems in urban settings, taking into account
          factors like resource availability, infrastructure, and community engagement. The study showcases successful case studies and
          offers detailed recommendations for advancing sustainable energy practices in cities across the globe.
        </p>
      </div>

      {/* ── References ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-2">References</h3>
        <div className="space-y-1 text-sm">
          {[
            "Patel, R., et al. (2022). Energy storage innovations for urban resilience. Urban Landscape Transformations.",
            "Lee, A., & Johnson, M. (2022). Sustainable infrastructure in megacities: Challenges and opportunities. Urban Landscape Transformations.",
            "Nguyen, T., & Carter, J. (2022). Green transportation and city planning. Urban Landscape Transformations.",
            "Oliver, B., et al. (2022). Advancing renewable energy in urban contexts. Urban Landscape Transformations.",
          ].map((ref, i) => (
            <p key={i} className="text-[#0066ff] hover:underline cursor-pointer">{ref}</p>
          ))}
        </div>
      </div>

      {/* ── Users Section ── */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Users</h3>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {USER_TABS.map(tab => (
            <button
              key={tab}
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

        {/* Table */}
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
              {mockAdminUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.registered}</td>
                  <td className="px-4 py-3 text-gray-500">{u.papers}</td>
                  <td className="px-4 py-3 text-gray-500">{u.following}</td>
                  <td className="px-4 py-3 text-gray-500">{u.followers}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-base leading-none tracking-widest">•••</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="disabled:opacity-30">←</button>
            <span>Page {userPage} of 1</span>
            <button onClick={() => setUserPage(p => p + 1)} disabled className="disabled:opacity-30">→</button>
          </div>
        </div>
      </div>

      {/* ── Citations ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Citations</h3>
        </div>
        <div className="space-y-4">
          {mockAdminCitations.filter(c => c.paperIndex === paperIndex).map(c => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                  {c.citingAuthor[0]}
                </div>
                <span className="text-xs font-semibold text-gray-700">{c.citingAuthor}</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 mb-1">{c.citingTitle}</p>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{c.quoteText}</p>
              <button className="text-xs text-[#0066ff] hover:underline">View Paper</button>
            </div>
          ))}
          <button className="w-full text-center text-sm text-[#0066ff] hover:underline py-2">Show More</button>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="pb-8">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Comments <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 ml-1 align-middle" />
        </h3>
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                  {comment.author[0]}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-800 mb-1">{comment.author}</p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">{comment.text}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <button className="hover:text-gray-600">Reply</button>
                    <button className="hover:text-gray-600">Like</button>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies.map(reply => (
                <div key={reply.id} className="ml-11 mt-4 flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {reply.author[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-gray-800">{reply.author}</p>
                      {/* Clicking Pending Review opens the Report Comment modal */}
                      {reply.badge && (
                        <button
                          onClick={() => setReportTarget(reply.id)}
                          className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 hover:bg-orange-100"
                        >
                          {reply.badge}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">{reply.text}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <button className="hover:text-gray-600">Reply</button>
                      <button className="hover:text-gray-600">Like</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button className="w-full text-center text-sm text-[#0066ff] hover:underline py-2">Show More</button>
        </div>
      </div>

      {/* Report Comment modal — opens when admin clicks a Pending Review badge */}
      {reportTarget !== null && (
        <ReportCommentModal
          commentId={reportTarget}
          onKeep={() => setReportTarget(null)}
          onRemove={() => {
            setComments(prev => prev.map(c => ({
              ...c,
              replies: c.replies.filter(r => r.id !== reportTarget),
            })));
            setReportTarget(null);
          }}
        />
      )}

    </div>
  );
}
