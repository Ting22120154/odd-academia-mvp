"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type FormState = {
  fullName:   string;
  email:      string;
  username:   string;
  workStatus: string;
  jobRole:    string;
  bio:        string;
  interests:  string[];
};

const EMPTY_FORM: FormState = {
  fullName:   "",
  email:      "",
  username:   "",
  workStatus: "Open for Work",
  jobRole:    "",
  bio:        "",
  interests:  [],
};

export default function ProfileEditPage() {
  // FIX: Always derive profile subject from authenticated session, never hardcode
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();

  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
  const [formReady, setFormReady] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!user) return;
    // FIX: Always derive profile subject from authenticated session, never hardcode
    fetch(`/api/users/${user.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { fullName: string; username: string; workStatus: string; jobTitle: string | null; bio: string | null }) => {
        setForm(prev => ({
          ...prev,
          fullName:   data.fullName   ?? "",
          email:      user.email      ?? "",
          username:   data.username   ?? "",
          workStatus: data.workStatus ?? "Open for Work",
          jobRole:    data.jobTitle   ?? "",
          bio:        data.bio        ?? "",
        }));
        setFormReady(true);
      })
      .catch(() => {
        setForm(prev => ({ ...prev, email: user.email ?? "" }));
        setFormReady(true);
      });
  }, [user]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function removeInterest(interest: string) {
    set("interests", form.interests.filter(i => i !== interest));
  }

  function addInterest() {
    const val = window.prompt("Add interest");
    if (val?.trim()) set("interests", [...form.interests, val.trim()]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    await fetch(`/api/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        fullName:   form.fullName,
        username:   form.username,
        workStatus: form.workStatus,
        bio:        form.bio,
        jobTitle:   form.jobRole,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <span>←</span> Back
      </button>

      <div className="text-base font-semibold text-zinc-900">Profile</div>

      {!formReady ? (
        <div className="mt-10 text-center text-sm text-zinc-400">Loading…</div>
      ) : (
        <form
          className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]"
          onSubmit={(e) => void handleSave(e)}
        >
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-200" />
            <div>
              <div className="text-sm font-semibold text-zinc-900">Profile Image</div>
              <button
                type="button"
                className="mt-1 rounded-lg bg-[var(--brand)] px-4 py-1.5 text-xs font-medium text-white hover:opacity-95"
              >
                Change
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Full Name">
              <Input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="First & Last Name" />
            </Field>
            <Field label="Email">
              <Input value={form.email} disabled placeholder="email" className="opacity-60 cursor-not-allowed" />
            </Field>

            <Field label="Work Status">
              <select
                value={form.workStatus}
                onChange={e => set("workStatus", e.target.value)}
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
              >
                <option value="open">Open for Work</option>
                <option value="not_open">Not Looking</option>
                <option value="freelance">Freelancing</option>
                <option value="none">Student</option>
              </select>
            </Field>
            <Field label="Interests">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 overflow-x-auto">
                {form.interests.map(i => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--brand)] flex-shrink-0"
                  >
                    {i}
                    <button type="button" onClick={() => removeInterest(i)} className="ml-0.5 hover:opacity-70">×</button>
                  </span>
                ))}
                <button type="button" onClick={addInterest} className="text-zinc-400 hover:text-zinc-600 flex-shrink-0">
                  +
                </button>
              </div>
            </Field>

            <Field label="Username">
              <Input value={form.username} onChange={e => set("username", e.target.value)} placeholder="r_smith" />
            </Field>
            <Field label="Job Role">
              <Input value={form.jobRole} onChange={e => set("jobRole", e.target.value)} placeholder="AI Engineer" />
            </Field>

            <Field label="GitHub">
              <Input placeholder="/github_username" disabled className="opacity-60 cursor-not-allowed" />
            </Field>
            <Field label="LinkedIn">
              <Input placeholder="@linkedin_handle" disabled className="opacity-60 cursor-not-allowed" />
            </Field>
          </div>

          {/* Bio */}
          <div className="mt-5 space-y-2">
            <div className="text-sm font-semibold text-zinc-700">Public Bio</div>
            <textarea
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              placeholder="Write your bio here..."
              className="min-h-28 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved.</span>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 items-center rounded-xl border border-black/[0.08] px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-6 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-zinc-700">{label}</div>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
