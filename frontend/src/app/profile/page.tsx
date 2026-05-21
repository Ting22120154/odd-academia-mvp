"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { mockPosts } from "@/data/mockPosts";

type Tab = "papers" | "cited-comments";

type ProfileUser = {
  id:         string;
  fullName:   string;
  username:   string;
  workStatus: string;
  jobTitle:   string | null;
  bio:        string | null;
  avatarUrl:  string | null;
};

const WORK_STATUS_LABEL: Record<string, string> = {
  open:      "Open for Work",
  freelance: "Freelance",
  not_open:  "Not Open",
  none:      "",
};

export default function ProfilePage() {
  // FIX: Always derive profile subject from authenticated session, never hardcode
  const { user, isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const [tab,          setTab]          = useState<Tab>("papers");
  const [profileUser,  setProfileUser]  = useState<ProfileUser | null>(null);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!user) return;
    setProfileError(false);
    // FIX: Always derive profile subject from authenticated session, never hardcode
    fetch(`/api/users/${user.id}`)
      .then(r => { if (!r.ok) throw new Error("not_found"); return r.json() as Promise<ProfileUser>; })
      .then(data => setProfileUser(data))
      .catch(() => setProfileError(true));
  }, [user]);

  if (!isLoggedIn) return null;

  if (profileError) return (
    <div className="py-20 text-center space-y-3">
      <p className="text-sm text-zinc-500">Could not load your profile. Your session may be outdated.</p>
      <button
        type="button"
        onClick={logout}
        className="text-sm font-medium text-[var(--brand)] hover:underline"
      >
        Log out and log in again
      </button>
    </div>
  );

  if (!profileUser) return (
    <div className="py-20 text-center text-sm text-zinc-400">Loading profile…</div>
  );

  const workStatusLabel = WORK_STATUS_LABEL[profileUser.workStatus] ?? profileUser.workStatus;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-6">
      {/* Banner + avatar header */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="h-36 bg-gradient-to-r from-indigo-900 via-blue-800 to-slate-900" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200">
              {profileUser.avatarUrl && (
                <img src={profileUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-zinc-900">{profileUser.fullName}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>@{profileUser.username}</span>
                {workStatusLabel && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                    {workStatusLabel}
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="inline-flex h-9 items-center rounded-lg bg-[var(--brand)] px-5 text-xs font-semibold text-white hover:opacity-95"
            >
              Edit
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-600">{profileUser.bio ?? "No bio provided."}</p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">—</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">—</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <a href="#" className="text-zinc-500 hover:text-zinc-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </a>
            <a href="#" className="text-zinc-500 hover:text-zinc-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065ZM6.918 20.452H3.756V9h3.162v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="text-sm font-semibold text-zinc-900">Engagement Metrics</div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <MetricCard icon="papers"    label="Papers"          value="—" />
          <MetricCard icon="followers" label="Followers"       value="—" />
          <MetricCard icon="saved"     label="Saved Papers"    value="—" />
          <MetricCard icon="comments"  label="Cited Comments"  value="—" />
        </div>
      </div>

      {/* Papers / Cited Comments tabs */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] pb-3">
          <TabButton active={tab === "papers"} onClick={() => setTab("papers")}>
            Papers
          </TabButton>
          <TabButton active={tab === "cited-comments"} onClick={() => setTab("cited-comments")}>
            Your Cited Comments
          </TabButton>
        </div>

        {tab === "papers" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockPosts.slice(0, 4).map((p) => (
              <PaperCard
                key={p.id}
                title={p.title}
                desc={p.description}
                tags={p.tags}
              />
            ))}
          </div>
        )}

        {tab === "cited-comments" && (
          <div className="mt-4 py-8 text-center text-sm text-zinc-400">
            No cited comments yet.
          </div>
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg px-4 py-1.5 text-sm font-medium transition",
        active ? "bg-[rgba(0,102,255,0.12)] text-[var(--brand)]" : "text-zinc-500 hover:text-zinc-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: "papers" | "followers" | "saved" | "comments";
  label: string;
  value: string;
}) {
  const iconMap = {
    papers: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
        <path d="M14 3v5h5" strokeLinejoin="round" />
      </svg>
    ),
    followers: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      </svg>
    ),
    saved: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
    comments: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[var(--brand)]">
        {iconMap[icon]}
      </div>
      <div>
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-xl font-bold text-zinc-900">{value}</div>
      </div>
    </div>
  );
}

function PaperCard({
  title,
  desc,
  tags,
}: {
  title: string;
  desc: string;
  tags: string[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <div className="h-32 bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600" />
      <div className="p-3">
        <div className="text-sm font-semibold text-zinc-900 line-clamp-2">{title}</div>
        <div className="mt-1 text-xs text-zinc-500 line-clamp-2">{desc}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
