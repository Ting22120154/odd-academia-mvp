"use client";

import { formatCount, type ProfileUser } from "@/lib/profile-client";

type Metric = {
  label: string;
  description: string;
  value: string;
  icon: "papers" | "followers" | "paperViews" | "paperFollows" | "comments" | "followedPapers";
};

export function ProfileEngagementMetrics({ stats }: { stats: ProfileUser["stats"] }) {
  const items: Metric[] = [
    {
      label: "Published papers",
      description: "Papers you have published",
      value: formatCount(stats.papers),
      icon: "papers",
    },
    {
      label: "Followers",
      description: "People following your profile",
      value: formatCount(stats.followers),
      icon: "followers",
    },
    {
      label: "Views on your papers",
      description: "Times your papers were opened",
      value: formatCount(stats.paperViews),
      icon: "paperViews",
    },
    {
      label: "Follows on your papers",
      description: "People following your papers",
      value: formatCount(stats.paperFollows),
      icon: "paperFollows",
    },
    {
      label: "Comments on your papers",
      description: "Comments from other users",
      value: formatCount(stats.commentsOnPapers),
      icon: "comments",
    },
    {
      label: "Papers you follow",
      description: "Published papers you follow",
      value: formatCount(stats.followedPapers),
      icon: "followedPapers",
    },
  ];

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="text-sm font-semibold text-zinc-900">Engagement Metrics</div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(({ label, description, value, icon }) => (
          <MetricCard
            key={label}
            icon={icon}
            label={label}
            description={description}
            value={value}
          />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  description,
  value,
}: {
  icon: Metric["icon"];
  label: string;
  description: string;
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
    paperViews: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    paperFollows: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
        <path d="M14 3v5h5" strokeLinejoin="round" />
        <path d="M12 11v6M9 14h6" strokeLinecap="round" />
      </svg>
    ),
    comments: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
    followedPapers: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white p-4"
      title={description}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--brand)]">
        {iconMap[icon]}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium leading-snug text-zinc-700">{label}</div>
        <div className="mt-0.5 text-[11px] leading-snug text-zinc-400">{description}</div>
        <div className="mt-1 text-xl font-bold text-zinc-900">{value}</div>
      </div>
    </div>
  );
}
