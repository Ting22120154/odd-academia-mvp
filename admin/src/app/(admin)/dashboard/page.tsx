"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  newUsersMonth: number;
  totalPapers: number;
  newPapersMonth: number;
  boostedPapers: number;
}

const STAT_CARDS = (s: Stats) => [
  {
    label: "Total Users",
    value: s.totalUsers,
    sub: `+${s.newUsersMonth} joined this month`,
    accent: "#0066ff",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    label: "Total Papers",
    value: s.totalPapers,
    sub: `+${s.newPapersMonth} submitted this month`,
    accent: "#7c3aed",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
  {
    label: "New Users (Month)",
    value: s.newUsersMonth,
    sub: "new registrations",
    accent: "#059669",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    label: "Boosted Papers",
    value: s.boostedPapers,
    sub: "currently featured",
    accent: "#d97706",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
];

const QUICK_LINKS = [
  { label: "Manage Users", href: "/users", desc: "View, warn, or ban accounts", emoji: "👥" },
  { label: "Manage Papers", href: "/papers", desc: "Review and moderate papers", emoji: "📄" },
  { label: "Review Reports", href: "/reports", desc: "Handle flagged comments", emoji: "🚩" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard")
      .then((r) => {
        if (r.status === 401 || r.status === 403) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!cancelled && d?.success) { setStats(d.data); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-7">Platform overview</p>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm h-28 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-3"/>
              <div className="h-7 bg-gray-100 rounded w-1/3"/>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS(stats).map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className={`inline-flex w-9 h-9 rounded-lg ${c.bg} items-center justify-center mb-3`}>
                <span className={`text-xs font-bold ${c.text}`}>
                  {c.value > 999 ? Math.floor(c.value / 1000) + "k" : c.value}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{c.value.toLocaleString()}</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{c.label}</div>
              <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Quick access
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_LINKS.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-[#0066ff] hover:shadow-md transition-all flex gap-4 items-start"
          >
            <span className="text-2xl">{q.emoji}</span>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{q.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{q.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
