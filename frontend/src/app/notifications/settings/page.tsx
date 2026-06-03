"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications-client";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsResponse,
} from "@/modules/notifications/notification-settings.types";

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

export default function NotificationSettingsPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<NotificationSettingsResponse>(DEFAULT_NOTIFICATION_SETTINGS);
  const [draft, setDraft] = useState<NotificationSettingsResponse>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await fetchNotificationSettings();
    if (result.settings) {
      setSaved(result.settings);
      setDraft(result.settings);
    } else {
      setSaved(DEFAULT_NOTIFICATION_SETTINGS);
      setDraft(DEFAULT_NOTIFICATION_SETTINGS);
      setError(result.error ?? "Failed to load notification settings");
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

  function toggle(key: SettingKey) {
    setSuccess(null);
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await updateNotificationSettings(draft);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSaved(result.settings);
    setDraft(result.settings);
    setSuccess("Settings saved.");
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
      {success ? <p className="mt-2 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">Loading settings…</p>
        ) : (
          SETTING_META.map((s, i) => {
            const enabled = draft[s.key];
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
                  disabled={saving}
                  onClick={() => toggle(s.key)}
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

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={loading || saving || !dirty}
          onClick={() => void saveSettings()}
          className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-6 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </section>
  );
}
