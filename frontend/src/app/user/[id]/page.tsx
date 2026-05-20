"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { mockPosts } from "@/data/mockPosts";
import { useAuth } from "@/context/AuthContext";

const MOCK_OTHER_USER = {
  fullName: "Evelyn Harper",
  username: "Ev_Harper",
  workStatus: "Open for Work",
  bio: "Dr. Evelyn Harper is a passionate advocate for sustainable energy, with a strong focus on renewable technologies. She has written extensively on the subject and is a sought-after speaker at events promoting green energy solutions.",
  followers: "1.2k",
  following: 300,
  avatarUrl: "/avatars/avatar-2.svg",
  stats: { papers: 120, followers: "1.2K", savedPapers: 14, citedComments: 50 },
};

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [reportingUser,  setReportingUser]  = useState(false);
  const [reportDraft,    setReportDraft]    = useState({ subject: "", description: "" });
  const [reportStatus,   setReportStatus]   = useState<"idle" | "sending" | "done">("idle");

  async function submitUserReport() {
    if (!user) return;
    setReportStatus("sending");
    await fetch("/api/reports", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type:        "user",
        reportedId:  id,
        reporterId:  user.id,
        subject:     reportDraft.subject,
        reason:      reportDraft.description,
      }),
    });
    setReportStatus("done");
  }

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-6">
      {/* Banner + avatar */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="h-36 bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200" />
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-zinc-900">{MOCK_OTHER_USER.fullName}</h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>@{MOCK_OTHER_USER.username}</span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                  {MOCK_OTHER_USER.workStatus}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/user/${id}/message`}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--brand)] px-4 text-xs font-semibold text-[var(--brand)] hover:bg-blue-50"
              >
                Contact
              </Link>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg bg-[var(--brand)] px-4 text-xs font-semibold text-white hover:opacity-95"
              >
                Follow Author
              </button>
              {user && (
                <button
                  type="button"
                  onClick={() => setReportingUser(true)}
                  className="inline-flex h-9 items-center rounded-lg border border-black/[0.08] px-4 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                >
                  Report
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm text-zinc-600">{MOCK_OTHER_USER.bio}</p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">{MOCK_OTHER_USER.followers}</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">{MOCK_OTHER_USER.following}</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-zinc-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </span>
            <span className="text-zinc-400">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065ZM6.918 20.452H3.756V9h3.162v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Engagement Metrics</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(
            [
              ["Papers", MOCK_OTHER_USER.stats.papers],
              ["Followers", MOCK_OTHER_USER.stats.followers],
              ["Saved Papers", MOCK_OTHER_USER.stats.savedPapers],
              ["Cited Comments", MOCK_OTHER_USER.stats.citedComments],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--brand)]">
                <span className="text-sm font-bold">•</span>
              </div>
              <div>
                <div className="text-xs text-zinc-500">{label}</div>
                <div className="text-xl font-bold text-zinc-900">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Papers */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-4 text-sm font-semibold text-zinc-900">Papers</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockPosts.slice(0, 4).map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              <div className="h-32 bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600" />
              <div className="p-3">
                <div className="text-sm font-semibold text-zinc-900 line-clamp-2">{p.title}</div>
                <div className="mt-1 text-xs text-zinc-500 line-clamp-2">{p.description}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report User modal */}
      {reportingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[var(--shadow-md)]">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-base font-semibold text-zinc-900">Report user</div>
                <div className="mt-1 text-sm text-zinc-500">Help us understand what went wrong.</div>
              </div>
              <button
                type="button"
                onClick={() => { setReportingUser(false); setReportStatus("idle"); }}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {reportStatus === "done" ? (
              <div className="py-4 text-center">
                <div className="text-sm font-medium text-green-600">Report submitted. Thank you.</div>
                <button
                  type="button"
                  onClick={() => { setReportingUser(false); setReportStatus("idle"); setReportDraft({ subject: "", description: "" }); }}
                  className="mt-4 text-sm text-zinc-500 hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Subject</label>
                    <input
                      value={reportDraft.subject}
                      onChange={e => setReportDraft(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Short summary"
                      className="h-11 w-full rounded-xl border border-black/[0.08] px-4 text-sm outline-none focus:border-black/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700">Description</label>
                    <textarea
                      value={reportDraft.description}
                      onChange={e => setReportDraft(p => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the issue"
                      className="min-h-[110px] w-full resize-none rounded-xl border border-black/[0.08] px-4 py-3 text-sm outline-none focus:border-black/20"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setReportingUser(false)}
                    className="flex-1 h-11 rounded-xl border border-black/[0.08] text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void submitUserReport()}
                    disabled={!reportDraft.subject.trim() || !reportDraft.description.trim() || reportStatus === "sending"}
                    className="flex-1 h-11 rounded-xl bg-[var(--brand)] text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {reportStatus === "sending" ? "Sending…" : "Submit"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
