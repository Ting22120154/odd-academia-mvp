"use client";

import { formatCount, type ProfileUser } from "@/lib/profile-client";

type Metric = {
  label: string;
  value: string;
  icon: "papers" | "followers" | "likes" | "engagement" | "comments" | "following";
};

export function ProfileEngagementMetrics({ stats }: { stats: ProfileUser["stats"] }) {
  const items: Metric[] = [
    { label: "Papers Published", value: String(stats.papers), icon: "papers" },
    { label: "Followers", value: formatCount(stats.followers), icon: "followers" },
    { label: "Total Likes", value: formatCount(stats.totalLikes), icon: "likes" },
    { label: "Paper Engagement", value: formatCount(stats.paperEngagement), icon: "engagement" },
    { label: "Cited Comments", value: String(stats.citedComments), icon: "comments" },
    { label: "Following", value: formatCount(stats.following), icon: "following" },
  ];

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="text-sm font-semibold text-zinc-900">Engagement Metrics</div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ label, value, icon }) => (
          <MetricCard key={label} icon={icon} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: Metric["icon"];
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
    likes: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round" />
      </svg>
    ),
    engagement: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3v18h18" strokeLinecap="round" />
        <path d="M7 16l4-6 4 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    comments: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
    following: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
        <path d="M22 11v6" strokeLinecap="round" />
        <path d="M19 14h6" strokeLinecap="round" />
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
