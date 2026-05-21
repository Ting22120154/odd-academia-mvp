"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchMyProfile, updateMyProfile } from "@/lib/profile-client";

type FormState = {
  fullName: string;
  email: string;
  username: string;
  workStatus: string;
  profileVisibility: "PUBLIC" | "PRIVATE";
  education: string;
  jobTitle: string;
  github: string;
  linkedin: string;
  bio: string;
  interests: string[];
};

export default function ProfileEditPage() {
  const { isLoggedIn, refreshSession } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      const { user, error: err } = await fetchMyProfile();
      if (cancelled) return;
      if (err || !user) {
        setError(err ?? "Could not load profile.");
        setLoading(false);
        return;
      }
      setForm({
        fullName: user.fullName,
        email: user.email ?? "",
        username: user.username,
        workStatus: user.workStatus,
        profileVisibility: user.profileVisibility,
        education: user.education ?? "",
        jobTitle: user.jobTitle ?? "",
        github: user.github ?? "",
        linkedin: user.linkedin ?? "",
        bio: user.bio ?? "",
        interests: user.interests,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function removeInterest(interest: string) {
    if (!form) return;
    set("interests", form.interests.filter((i) => i !== interest));
  }

  function addInterest() {
    const val = window.prompt("Add interest");
    if (val?.trim() && form) set("interests", [...form.interests, val.trim()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);

    const { user, error: err } = await updateMyProfile({
      fullName: form.fullName,
      username: form.username,
      workStatus: form.workStatus,
      profileVisibility: form.profileVisibility,
      education: form.education,
      jobTitle: form.jobTitle,
      github: form.github,
      linkedin: form.linkedin,
      bio: form.bio,
      interests: form.interests,
    });

    setSaving(false);
    if (err || !user) {
      setError(err ?? "Could not save profile.");
      return;
    }
    await refreshSession();
    router.push("/profile");
  }

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)] py-12 text-center text-sm text-zinc-500">
        Loading…
      </section>
    );
  }

  if (!form) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)] py-12 text-center text-sm text-red-600">
        {error ?? "Profile not found."}
      </section>
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

      <div className="text-base font-semibold text-zinc-900">Profile</div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <form
        className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-200" />
          <div>
            <div className="text-sm font-semibold text-zinc-900">Profile Image</div>
            <button
              type="button"
              disabled
              className="mt-1 rounded-lg bg-zinc-300 px-4 py-1.5 text-xs font-medium text-white"
              title="Avatar upload coming soon"
            >
              Change
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Full Name">
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="First & Last Name" />
          </Field>
          <Field label="Email">
            <Input value={form.email} readOnly className="bg-zinc-50 text-zinc-500" />
          </Field>

          <Field label="Work Status">
            <select
              value={form.workStatus}
              onChange={(e) => set("workStatus", e.target.value)}
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            >
              <option>Open for Work</option>
              <option>Not Looking</option>
              <option>Freelancing</option>
              <option>Student</option>
              <option>None</option>
            </select>
          </Field>
          <Field label="Interests">
            <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4 py-2">
              {form.interests.map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]"
                >
                  {i}
                  <button type="button" onClick={() => removeInterest(i)} className="ml-0.5 hover:opacity-70">
                    ×
                  </button>
                </span>
              ))}
              <button type="button" onClick={addInterest} className="text-zinc-400 hover:text-zinc-600">
                +
              </button>
            </div>
          </Field>

          <Field label="Profile Visibility">
            <select
              value={form.profileVisibility}
              onChange={(e) => set("profileVisibility", e.target.value as FormState["profileVisibility"])}
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </Field>
          <Field label="Education">
            <Input
              value={form.education}
              onChange={(e) => set("education", e.target.value)}
              placeholder="Bachelor's Degree in Software Engineering"
            />
          </Field>

          <Field label="Username">
            <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="r_smith" />
          </Field>
          <Field label="Job Role">
            <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="AI Engineer" />
          </Field>

          <Field label="GitHub">
            <Input value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="https://github.com/you" />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/you" />
          </Field>
        </div>

        <div className="mt-5 space-y-2">
          <div className="text-sm font-semibold text-zinc-700">Public Bio</div>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Write your bio here..."
            className="min-h-28 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
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
        props.className,
      ].join(" ")}
    />
  );
}
