"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications-client";
import type { NotificationSettingsResponse } from "@/modules/notifications/notification-settings.types";

type SettingKey = keyof NotificationSettingsResponse;

interface NotifSetting {
  key: SettingKey;
  title: string;
  description: string;
}

const SETTING_META: NotifSetting[] = [
  {
    key: "followedAuthors",
    title: "Followed Authors",
    description: "Receive email notifications for new papers",
  },
  {
    key: "followedPapers",
    title: "Followed Paper",
    description: "Receive email notifications for new comments",
  },
  {
    key: "repliedTo",
    title: "Replied To",
    description: "Receive email notifications for replies to comments threads",
  },
];

const DEFAULT_SETTINGS: NotificationSettingsResponse = {
  followedAuthors: true,
  followedPapers: false,
  repliedTo: true,
};

export default function NotificationSettingsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettingsResponse>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchNotificationSettings();
    if (result.settings) {
      setSettings(result.settings);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    void load();
  }, [isLoggedIn, load]);

  if (!isLoggedIn) return null;

  async function toggle(key: SettingKey) {
    const next = !settings[key];
    setSavingKey(key);
    setError(null);
    setSettings((prev) => ({ ...prev, [key]: next }));

    const result = await updateNotificationSettings({ [key]: next });
    setSavingKey(null);

    if (!result.ok) {
      setError(result.error);
      setSettings((prev) => ({ ...prev, [key]: !next }));
      return;
    }
    setSettings(result.settings);
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

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">Loading settings…</p>
        ) : (
          SETTING_META.map((s, i) => {
            const enabled = settings[s.key];
            const busy = savingKey === s.key;
            return (
              <div
                key={s.key}
                className={[
                  "flex items-center justify-between px-6 py-5",
                  i < SETTING_META.length - 1 ? "border-b border-black/[0.06]" : "",
                ].join(" ")}
              >
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{s.title}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">{s.description}</div>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggle(s.key)}
                  className={[
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-black/[0.08] p-0.5 transition disabled:opacity-50",
                    enabled ? "bg-[var(--brand)]" : "bg-zinc-200",
                  ].join(" ")}
                  aria-pressed={enabled}
                  aria-label={`${s.title} notifications ${enabled ? "on" : "off"}`}
                >
                  <span
                    className={[
                      "h-5 w-5 rounded-full bg-white shadow-sm transition",
                      enabled ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
