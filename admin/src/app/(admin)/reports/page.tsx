"use client";

import { useState } from "react";
import {
  mockAdminReportedComments,
  mockAdminReportedPapers,
  mockAdminReportedUsers,
  mockAdminAllReports,
  type AdminReport,
} from "@odd-academia/db";

type Tab = "all" | "comments" | "papers" | "users";

const PAGE_SIZE = 20;

function fmt(date: Date): string {
  return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  comment: { label: "Comment", cls: "bg-orange-100 text-orange-700 border-orange-200" },
  paper:   { label: "Paper",   cls: "bg-blue-100 text-blue-700 border-blue-200"       },
  user:    { label: "User",    cls: "bg-red-100 text-red-700 border-red-200"           },
};

function ReportCard({ report }: { report: AdminReport }) {
  const badge = TYPE_BADGE[report.type];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-xs text-gray-400">
            Reported by{" "}
            <span className="font-medium text-gray-700">{report.reportedBy}</span>
            {" · "}
            {fmt(report.reportedAt)}
          </span>
        </div>

        {report.type === "comment" && (
          <div>
            <p className="text-sm font-medium text-gray-800">{report.author}</p>
            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{report.content}</p>
            <p className="text-xs text-gray-400 mt-1">on: {report.paperTitle}</p>
          </div>
        )}
        {report.type === "paper" && (
          <div>
            <p className="text-sm font-semibold text-gray-800">{report.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">by {report.author} · {report.category}</p>
          </div>
        )}
        {report.type === "user" && (
          <div>
            <p className="text-sm font-semibold text-gray-800">{report.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{report.email}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2 italic">"{report.reason}"</p>
      </div>
    </div>
  );
}

const TABS: { id: Tab; label: string; count: number }[] = [
  { id: "all",      label: "All",               count: mockAdminAllReports.length            },
  { id: "comments", label: "Reported Comments", count: mockAdminReportedComments.length      },
  { id: "papers",   label: "Reported Papers",   count: mockAdminReportedPapers.length        },
  { id: "users",    label: "Reported Users",    count: mockAdminReportedUsers.length         },
];

export default function ReportsPage() {
  const [tab, setTab]   = useState<Tab>("all");
  const [shown, setShown] = useState(PAGE_SIZE);

  const items =
    tab === "all"      ? mockAdminAllReports :
    tab === "comments" ? mockAdminReportedComments :
    tab === "papers"   ? mockAdminReportedPapers :
                         mockAdminReportedUsers;

  const visible = items.slice(0, shown);
  const hasMore = shown < items.length;

  function changeTab(t: Tab) {
    setTab(t);
    setShown(PAGE_SIZE);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">{mockAdminAllReports.length} reports total</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-end gap-1 border-b border-gray-200 mb-5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-[#0066ff] text-[#0066ff]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
              tab === t.id ? "bg-[#0066ff] text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400 text-sm">
          No reports.
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4">
            {visible.map(r => <ReportCard key={r.id} report={r} />)}
          </div>
          {hasMore && (
            <button
              onClick={() => setShown(s => s + PAGE_SIZE)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Show more
            </button>
          )}
        </>
      )}
    </div>
  );
}
