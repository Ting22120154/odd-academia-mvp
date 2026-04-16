"use client";

import { useMemo, useState } from "react";
import type { MockUser } from "@/data/mockUser";

type Props = {
  user: MockUser;
};

type FormState = Omit<MockUser, "id">;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-zinc-700">{children}</div>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function ProfileForm({ user }: Props) {
  const initial = useMemo<FormState>(() => {
    const { id: _id, ...rest } = user;
    return rest;
  }, [user]);

  const [form, setForm] = useState<FormState>(initial);
  const [interestDraft, setInterestDraft] = useState("");

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addInterest(raw: string) {
    const v = raw.trim();
    if (!v) return;
    setForm((prev) => {
      const exists = prev.interests.some(
        (x) => x.toLowerCase() === v.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, interests: [...prev.interests, v] };
    });
    setInterestDraft("");
  }

  function removeInterest(value: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((x) => x !== value),
    }));
  }

  function onCancel() {
    setForm(initial);
    setInterestDraft("");
  }

  function onSave() {
    window.alert("Saved (mock)!");
  }

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-zinc-200" />
        <div>
          <div className="text-sm font-medium text-zinc-800">Profile Image</div>
          <button
            type="button"
            className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => window.alert("Image upload (mock)")}
          >
            Change
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Full Name</FieldLabel>
          <TextInput
            value={form.fullName}
            placeholder="First & Last Name"
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Email</FieldLabel>
          <TextInput
            value={form.email}
            placeholder="name@example.com"
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Work Status</FieldLabel>
          <SelectInput
            value={form.workStatus}
            onChange={(e) =>
              set(
                "workStatus",
                e.target.value as FormState["workStatus"],
              )
            }
          >
            <option>Open for Work</option>
            <option>Not Looking</option>
            <option>Freelancing</option>
            <option>Student</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <FieldLabel>Interests</FieldLabel>
          <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2">
            {form.interests.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => removeInterest(t)}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                title="Remove"
              >
                {t}
                <span className="text-blue-500">×</span>
              </button>
            ))}
            <input
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest(interestDraft);
                }
              }}
              placeholder="Type and press Enter"
              className="min-w-[160px] flex-1 bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => addInterest(interestDraft)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              title="Add interest"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>Profile Visibility</FieldLabel>
          <SelectInput
            value={form.profileVisibility}
            onChange={(e) =>
              set(
                "profileVisibility",
                e.target.value as FormState["profileVisibility"],
              )
            }
          >
            <option>Public</option>
            <option>Private</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <FieldLabel>Education</FieldLabel>
          <TextInput
            value={form.education}
            placeholder="Your degree"
            onChange={(e) => set("education", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Username</FieldLabel>
          <TextInput
            value={form.username}
            placeholder="username"
            onChange={(e) => set("username", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Job Role</FieldLabel>
          <TextInput
            value={form.jobRole}
            placeholder="e.g. AI Engineer"
            onChange={(e) => set("jobRole", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>GitHub</FieldLabel>
          <TextInput
            value={form.github}
            placeholder="/your_handle"
            onChange={(e) => set("github", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>LinkedIn</FieldLabel>
          <TextInput
            value={form.linkedin}
            placeholder="@your_linkedin"
            onChange={(e) => set("linkedin", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <FieldLabel>Public Bio</FieldLabel>
        <TextArea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={!dirty}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          disabled={!dirty}
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { MockUser } from "@/data/mockUser";

type Props = {
  user: MockUser;
};

type FormState = Omit<MockUser, "id">;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-zinc-700">{children}</div>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "min-h-28 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export function ProfileForm({ user }: Props) {
  const initial = useMemo<FormState>(() => {
    // Keep the form state isolated from the mock object so it's ready for API integration later.
    const { id: _id, ...rest } = user;
    return rest;
  }, [user]);

  const [form, setForm] = useState<FormState>(initial);
  const [interestDraft, setInterestDraft] = useState("");

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addInterest(raw: string) {
    const v = raw.trim();
    if (!v) return;
    setForm((prev) => {
      const exists = prev.interests.some(
        (x) => x.toLowerCase() === v.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, interests: [...prev.interests, v] };
    });
    setInterestDraft("");
  }

  function removeInterest(value: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((x) => x !== value),
    }));
  }

  function onCancel() {
    setForm(initial);
    setInterestDraft("");
  }

  function onSave() {
    // MVP: no backend yet. This is where we’ll POST to `/api/profile` later.
    // For now, we just keep state and show a tiny UX response.
    window.alert("Saved (mock)!");
  }

  return (
    <form
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-zinc-200" />
        <div>
          <div className="text-sm font-medium text-zinc-800">Profile Image</div>
          <button
            type="button"
            className="mt-2 inline-flex h-8 items-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => window.alert("Image upload (mock)")}
          >
            Change
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Full Name</FieldLabel>
          <TextInput
            value={form.fullName}
            placeholder="First & Last Name"
            onChange={(e) => set("fullName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Email</FieldLabel>
          <TextInput
            value={form.email}
            placeholder="name@example.com"
            onChange={(e) => set("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Work Status</FieldLabel>
          <SelectInput
            value={form.workStatus}
            onChange={(e) =>
              set(
                "workStatus",
                e.target.value as FormState["workStatus"],
              )
            }
          >
            <option>Open for Work</option>
            <option>Not Looking</option>
            <option>Freelancing</option>
            <option>Student</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <FieldLabel>Interests</FieldLabel>
          <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2">
            {form.interests.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => removeInterest(t)}
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                title="Remove"
              >
                {t}
                <span className="text-blue-500">×</span>
              </button>
            ))}
            <input
              value={interestDraft}
              onChange={(e) => setInterestDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addInterest(interestDraft);
                }
              }}
              placeholder="Type and press Enter"
              className="min-w-[160px] flex-1 bg-transparent px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => addInterest(interestDraft)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              title="Add interest"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>Profile Visibility</FieldLabel>
          <SelectInput
            value={form.profileVisibility}
            onChange={(e) =>
              set(
                "profileVisibility",
                e.target.value as FormState["profileVisibility"],
              )
            }
          >
            <option>Public</option>
            <option>Private</option>
          </SelectInput>
        </div>

        <div className="space-y-2">
          <FieldLabel>Education</FieldLabel>
          <TextInput
            value={form.education}
            placeholder="Your degree"
            onChange={(e) => set("education", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Username</FieldLabel>
          <TextInput
            value={form.username}
            placeholder="username"
            onChange={(e) => set("username", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Job Role</FieldLabel>
          <TextInput
            value={form.jobRole}
            placeholder="e.g. AI Engineer"
            onChange={(e) => set("jobRole", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>GitHub</FieldLabel>
          <TextInput
            value={form.github}
            placeholder="/your_handle"
            onChange={(e) => set("github", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>LinkedIn</FieldLabel>
          <TextInput
            value={form.linkedin}
            placeholder="@your_linkedin"
            onChange={(e) => set("linkedin", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <FieldLabel>Public Bio</FieldLabel>
        <TextArea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          disabled={!dirty}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          disabled={!dirty}
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

