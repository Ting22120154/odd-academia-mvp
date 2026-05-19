"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockUser, type MockUser } from "@/data/mockUser";

type FormState = Omit<MockUser, "id">;

export default function ProfileEditPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const [form, setForm] = useState<FormState>(() => {
    const { id: _id, ...rest } = mockUser;
    return rest;
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function removeInterest(interest: string) {
    set("interests", form.interests.filter((i) => i !== interest));
  }

  function addInterest() {
    const val = window.prompt("Add interest");
    if (val?.trim()) set("interests", [...form.interests, val.trim()]);
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

      <form
        className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]"
        onSubmit={(e) => {
          e.preventDefault();
          window.alert("Saved (mock)!");
        }}
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
            <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="First & Last Name" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="rick.s@example.com" />
          </Field>

          <Field label="Work Status">
            <select
              value={form.workStatus}
              onChange={(e) => set("workStatus", e.target.value as FormState["workStatus"])}
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            >
              <option>Open for Work</option>
              <option>Not Looking</option>
              <option>Freelancing</option>
              <option>Student</option>
            </select>
          </Field>
          <Field label="Interests">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-4">
              {form.interests.map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--brand)]"
                >
                  {i}
                  <button type="button" onClick={() => removeInterest(i)} className="ml-0.5 hover:opacity-70">×</button>
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
              <option>Public</option>
              <option>Private</option>
            </select>
          </Field>
          <Field label="Education">
            <Input value={form.education} onChange={(e) => set("education", e.target.value)} placeholder="Bachelor's Degree in Software Engineering" />
          </Field>

          <Field label="Username">
            <Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="r_smith" />
          </Field>
          <Field label="Job Role">
            <Input value={form.jobRole} onChange={(e) => set("jobRole", e.target.value)} placeholder="AI Engineer" />
          </Field>

          <Field label="GitHub">
            <Input value={form.github} onChange={(e) => set("github", e.target.value)} placeholder="/rick_ss_03" />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="@rick_u_cl" />
          </Field>
        </div>

        {/* Bio */}
        <div className="mt-5 space-y-2">
          <div className="text-sm font-semibold text-zinc-700">Public Bio</div>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Write your bio here..."
            className="min-h-28 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
          />
        </div>

        {/* Actions */}
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
            className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-6 text-sm font-medium text-white hover:opacity-95"
          >
            Save Changes
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
      className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
    />
  );
}
