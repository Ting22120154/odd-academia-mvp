"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

const MOCK_AUTHOR = {
  fullName: "Evelyn Harper",
  username: "Ev_Harper",
  followers: "1.2k",
  following: 300,
};

export default function MessageAuthorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [linkToPaper, setLinkToPaper] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.alert("Message sent (mock)!");
    router.back();
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

      <div className="text-base font-semibold text-zinc-900">Message this Author</div>

      <form
        onSubmit={onSubmit}
        className="mt-4 rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]"
      >
        {/* Author banner card */}
        <div className="h-28 rounded-t-2xl bg-gradient-to-r from-pink-200 via-rose-200 to-amber-200" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-zinc-200" />
            <div className="pb-1">
              <div className="text-lg font-bold text-zinc-900">{MOCK_AUTHOR.fullName}</div>
              <div className="text-sm text-zinc-500">@{MOCK_AUTHOR.username}</div>
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-500">
            A message will be sent to their email
          </p>

          <div className="mt-3 flex items-center gap-4 text-sm">
            <span>
              <strong className="text-zinc-900">{MOCK_AUTHOR.followers}</strong>{" "}
              <span className="text-zinc-500">followers</span>
            </span>
            <span>
              <strong className="text-zinc-900">{MOCK_AUTHOR.following}</strong>{" "}
              <span className="text-zinc-500">following</span>
            </span>
          </div>

          {/* Form fields */}
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                className="min-h-32 w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Link To Paper</label>
              <input
                value={linkToPaper}
                onChange={(e) => setLinkToPaper(e.target.value)}
                placeholder="Enter link"
                className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-xl bg-[var(--brand)] px-8 text-sm font-medium text-white hover:opacity-95"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
