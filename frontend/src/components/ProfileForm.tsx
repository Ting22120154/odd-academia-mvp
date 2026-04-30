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
        "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-black/20 focus:outline-none",
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
        "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900",
        "focus:border-black/20 focus:outline-none",
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
        "min-h-28 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900",
        "placeholder:text-zinc-400",
        "focus:border-black/20 focus:outline-none",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function InlineIcon({ label }: { label: "github" | "linkedin" }) {
  const cls = "h-4 w-4";
  if (label === "github") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 19c-4 1.5-4-2-5-2m10 4v-3.1c0-.9.3-1.6.8-2-2.7-.3-5.5-1.3-5.5-5.8 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.6 11.6 0 0 1 6.2 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 3 .1 3.3.8.9 1.2 2 1.2 3.3 0 4.5-2.8 5.5-5.5 5.8.5.4.9 1.2.9 2.4V21"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 10.5V18m0-7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10.5 18v-4.2c0-1.9 1.1-3.3 2.9-3.3 1.7 0 2.6 1.2 2.6 3.1V18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M17.8 10.8v.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={[
        "relative inline-flex h-5 w-9 items-center rounded-full border border-black/[0.08] p-0.5 transition",
        on ? "bg-[var(--brand)]" : "bg-zinc-100",
      ].join(" ")}
      aria-hidden
    >
      <span
        className={[
          "h-4 w-4 rounded-full bg-white shadow-sm transition",
          on ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </span>
  );
}

export function ProfileForm({ user }: Props) {
  const initial = useMemo<FormState>(() => {
    const { id: _id, ...rest } = user;
    return rest;
  }, [user]);

  /*
   * This component intentionally owns its own form state for MVP,
   * so the UI can be reviewed in isolation before backend integration.
   *
   * Integration point later:
   * - replace `onSave` alert with an API call
   * - consider moving state into a form library if validation grows
   */
  const [form, setForm] = useState<FormState>(initial);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSave() {
    window.alert("Saved (mock)!");
  }

  return (
    <form
      className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[var(--shadow-sm)]"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-900">About Me</div>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-[var(--brand)] px-6 text-xs font-semibold text-white hover:opacity-95"
          disabled={!dirty}
        >
          Save
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white">
        <div className="px-5 py-4">
          <div className="text-sm font-medium text-zinc-900">Biography</div>
        </div>
        <div className="border-t border-black/[0.06] px-5 py-4">
          <TextArea
            value={form.bio}
            placeholder="Write your bio here..."
            onChange={(e) => set("bio", e.target.value)}
          />
          <div className="mt-2 text-right text-[11px] text-zinc-400">
            {Math.min(form.bio.length, 200)}/200
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Row label="Work Status">
          <div className="relative">
            <SelectInput
              value={form.workStatus}
              onChange={(e) =>
                set("workStatus", e.target.value as FormState["workStatus"])
              }
              className="pr-12"
            >
              <option>Open for Work</option>
              <option>Not Looking</option>
              <option>Freelancing</option>
              <option>Student</option>
            </SelectInput>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <Toggle on />
            </span>
          </div>
        </Row>

        <Row label="Profile Visibility">
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
        </Row>

        <Row label="Github">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <InlineIcon label="github" />
            </span>
            <TextInput
              value={form.github}
              placeholder="/rick_sss_03"
              onChange={(e) => set("github", e.target.value)}
              className="pl-11 pr-12"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <Toggle on />
            </span>
          </div>
        </Row>

        <Row label="Linkedin">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <InlineIcon label="linkedin" />
            </span>
            <TextInput
              value={form.linkedin}
              placeholder="@rick_s_cs"
              onChange={(e) => set("linkedin", e.target.value)}
              className="pl-11"
            />
          </div>
        </Row>
      </div>
    </form>
  );
}
