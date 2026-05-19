"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type NotifTab = "New" | "All" | "Papers" | "Comments" | "Contact" | "Citations";

const TABS: NotifTab[] = ["New", "All", "Papers", "Comments", "Contact", "Citations"];

type SortKey = "type" | "date";
type SortDir = "asc" | "desc";

interface Notification {
  id: string;
  text: string;
  type: "Paper" | "Comment" | "Reply" | "Contact" | "Citation";
  date: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", text: "New Paper Published: AI In Healthcare", type: "Paper", date: "2023-10-01" },
  { id: "n2", text: "New Comment on your Post", type: "Comment", date: "2023-10-02" },
  { id: "n3", text: "New Reply to your Comment", type: "Reply", date: "2023-10-03" },
  { id: "n4", text: "Someone contacted you, check your email", type: "Contact", date: "2023-10-04" },
  { id: "n5", text: "Your work was cited: AI practices", type: "Citation", date: "2023-10-05" },
];

export default function NotificationsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotifTab>("New");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (activeTab === "New" || activeTab === "All") return true;
    if (activeTab === "Papers") return n.type === "Paper";
    if (activeTab === "Comments") return n.type === "Comment" || n.type === "Reply";
    if (activeTab === "Contact") return n.type === "Contact";
    if (activeTab === "Citations") return n.type === "Citation";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "type") return a.type.localeCompare(b.type) * mul;
    return a.date.localeCompare(b.date) * mul;
  });

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-zinc-900">Notifications</h1>
        <Link href="/notifications/settings" className="text-zinc-400 hover:text-zinc-600">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-black/[0.06] px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={[
                "rounded-t-lg px-3 pb-2 pt-1 text-sm font-medium transition",
                activeTab === t
                  ? "border-b-2 border-[var(--brand)] text-[var(--brand)]"
                  : "text-zinc-500 hover:text-zinc-900",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] text-xs font-semibold text-zinc-500">
              <th className="px-4 py-3">Notification</th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("type")} className="inline-flex items-center gap-1 hover:text-zinc-900">
                  Type
                  <SortArrow active={sortKey === "type"} dir={sortDir} />
                </button>
              </th>
              <th className="px-4 py-3">
                <button type="button" onClick={() => toggleSort("date")} className="inline-flex items-center gap-1 hover:text-zinc-900">
                  Date
                  <SortArrow active={sortKey === "date"} dir={sortDir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((n) => (
              <tr key={n.id} className="border-b border-black/[0.04] last:border-0">
                <td className="px-4 py-3 text-zinc-900">{n.text}</td>
                <td className="px-4 py-3 text-zinc-500">{n.type}</td>
                <td className="px-4 py-3 text-zinc-500">{n.date}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-400">
                  No notifications
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`h-3 w-3 ${active ? "text-zinc-900" : "text-zinc-300"}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
      {dir === "asc" ? <path d="M6 2v8M3 7l3 3 3-3" /> : <path d="M6 10V2M3 5l3-3 3 3" />}
    </svg>
  );
}
