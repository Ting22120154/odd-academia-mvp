"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface NotifSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: NotifSetting[] = [
  { id: "followed-authors", title: "Followed Authors", description: "Receive email notifications for new papers", enabled: true },
  { id: "followed-paper", title: "Followed Paper", description: "Receive email notifications for new comments", enabled: false },
  { id: "replied-to", title: "Replied To", description: "Receive email notifications for replies to comments threads", enabled: true },
];

export default function NotificationSettingsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  function toggle(id: string) {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  }

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <span>←</span> Back
      </button>

      <h1 className="text-base font-semibold text-zinc-900">Notification Settings</h1>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        {settings.map((s, i) => (
          <div
            key={s.id}
            className={[
              "flex items-center justify-between px-6 py-5",
              i < settings.length - 1 ? "border-b border-black/[0.06]" : "",
            ].join(" ")}
          >
            <div>
              <div className="text-sm font-semibold text-zinc-900">{s.title}</div>
              <div className="mt-0.5 text-xs text-zinc-500">{s.description}</div>
            </div>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/[0.08] p-0.5 transition",
                s.enabled ? "bg-[var(--brand)]" : "bg-zinc-200",
              ].join(" ")}
              aria-pressed={s.enabled}
            >
              <span
                className={[
                  "h-5 w-5 rounded-full bg-white shadow-sm transition",
                  s.enabled ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
