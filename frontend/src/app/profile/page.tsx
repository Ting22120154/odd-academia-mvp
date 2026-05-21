"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { mockUser } from "@/data/mockUser";
import { mockPosts } from "@/data/mockPosts";
import { fetchSavedPapers } from "@/lib/saved-papers-client";
import type { SavedPaperResponse } from "@/modules/saved-papers/types";

type Tab = "papers" | "saved-papers" | "cited-comments";

const MOCK_STATS = {
  papers: 120,
  followers: "1.2K",
  citedComments: 50,
};

const MOCK_CITED_COMMENTS = [
  {
    id: "cc-1",
    paperTitle: "Interesting Facts About AI",
    paperSubtitle: "How AI Is Changing the Future",
    tags: ["AI infrastructure", "Computer science"],
    author: mockUser.fullName,
    avatarUrl: mockUser.avatarUrl,
    comment:
      "I've made some comments on my own paper around ethical challenges posed by autonomous AI systems, advocating for a responsible approach to AI development that prioritises human values and societal needs. Key considerations include privacy, job displacement, and the need for regulatory frameworks to ensure AI benefits all of humanity.",
    citationRef:
      'Cited contribution 04-Ethical Implications of Autonomous AI: Balancing Innovation and Responsibility (2024)',
    replies: 2,
    likes: 21,
  },
];

export default function ProfilePage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("papers");
  const [savedCount, setSavedCount] = useState(0);
  const [savedPapers, setSavedPapers] = useState<SavedPaperResponse[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    setSavedLoading(true);
    void fetchSavedPapers().then(({ papers, count }) => {
      if (cancelled) return;
      setSavedPapers(papers);
      setSavedCount(count);
      setSavedLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)] space-y-6">
      {/* Banner + avatar header */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        <div className="h-36 bg-gradient-to-r from-indigo-900 via-blue-800 to-slate-900" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-200">
              {mockUser.avatarUrl && (
                <img src={mockUser.avatarUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-zinc-900">{mockUser.fullName}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span>@{mockUser.username}</span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                  {mockUser.workStatus}
                </span>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="inline-flex h-9 items-center rounded-lg bg-[var(--brand)] px-5 text-xs font-semibold text-white hover:opacity-95"
            >
              Edit
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-600">{mockUser.bio}</p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">3k</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">125</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <a href={`https://github.com${mockUser.github}`} className="text-zinc-500 hover:text-zinc-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z" />
              </svg>
            </a>
            <a href={`https://linkedin.com/in/${mockUser.linkedin}`} className="text-zinc-500 hover:text-zinc-900">
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
          <MetricCard icon="papers" label="Papers" value={String(MOCK_STATS.papers)} />
          <MetricCard icon="followers" label="Followers" value={MOCK_STATS.followers} />
          <MetricCard
            icon="saved"
            label="Saved Papers"
            value={savedLoading ? "…" : String(savedCount)}
          />
          <MetricCard icon="comments" label="Cited Comments" value={String(MOCK_STATS.citedComments)} />
        </div>
      </div>

      {/* Papers / Cited Comments tabs */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] pb-3">
          <TabButton active={tab === "papers"} onClick={() => setTab("papers")}>
            Papers
          </TabButton>
          <TabButton active={tab === "saved-papers"} onClick={() => setTab("saved-papers")}>
            Saved Papers
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
                image={p.image.src}
              />
            ))}
          </div>
        )}

        {tab === "saved-papers" && (
          <div className="mt-4">
            {savedLoading ? (
              <p className="text-sm text-zinc-500">Loading saved papers…</p>
            ) : savedPapers.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No saved papers yet. Save papers from the paper page to see them here.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {savedPapers.map((p) => (
                  <Link key={p.paperId} href={`/paper/${p.paperId}`} className="block">
                    <PaperCard
                      title={p.title}
                      desc={p.abstract ?? ""}
                      tags={[]}
                      image=""
                      author={p.author.fullName}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "cited-comments" && (
          <div className="mt-4 space-y-4">
            {MOCK_CITED_COMMENTS.map((cc) => (
              <div key={cc.id} className="space-y-3">
                <div>
                  <div className="text-base font-semibold text-zinc-900">{cc.paperTitle}</div>
                  <div className="text-sm text-zinc-500">{cc.paperSubtitle}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cc.tags.map((t) => (
                      <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-black/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-200" />
                    <span className="text-sm font-semibold text-zinc-900">{cc.author}</span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">{cc.comment}</p>
                  <p className="mt-2 text-sm text-[var(--brand)]">{cc.citationRef}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                    <span>{cc.replies} Reply</span>
                    <span>{cc.likes} Like</span>
                  </div>
                </div>
              </div>
            ))}
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
  image,
  author,
}: {
  title: string;
  desc: string;
  tags: string[];
  image: string;
  author?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <div className="h-32 bg-gradient-to-br from-indigo-400 via-blue-500 to-purple-600" />
      <div className="p-3">
        <div className="text-sm font-semibold text-zinc-900 line-clamp-2">{title}</div>
        {author ? (
          <div className="mt-1 text-xs font-medium text-zinc-600">{author}</div>
        ) : null}
        <div className="mt-1 text-xs text-zinc-500 line-clamp-2">{desc}</div>
        {tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
