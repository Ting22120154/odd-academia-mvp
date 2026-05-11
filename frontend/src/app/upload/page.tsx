"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Keyword =
  | "AI infrastructure"
  | "Computer science"
  | "Biohacking"
  | "Maths"
  | "Sustainability"
  | "Business";

const KEYWORDS: Keyword[] = [
  "AI infrastructure",
  "Computer science",
  "Biohacking",
  "Maths",
  "Sustainability",
  "Business",
];

export default function UploadPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState<Keyword | "">("");
  const [abstract, setAbstract] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abstractCount = useMemo(() => Math.min(abstract.length, 200), [abstract]);

  function pickFile() {
    inputRef.current?.click();
  }

  function onChooseFile(f: File | null) {
    setFile(f);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!abstract.trim()) {
      setError("Please enter an abstract.");
      return;
    }
    if (!file) {
      setError("Please attach a paper file.");
      return;
    }

    setSubmitting(true);
    try {
      const keywordList = keyword ? [keyword] : [];

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: abstract.trim(),
          keywords: keywordList,
          author: {
            name: anonymous ? "Anonymous" : author.trim() || "User",
            bio: "",
            avatar: "/avatars/profile.svg",
          },
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not upload paper");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(file) && title.trim().length > 0 && abstract.trim().length > 0;

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <div className="text-base font-semibold text-zinc-900">
        Submit New Paper
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]"
      >
        {/* Paper upload */}
        <div className="text-sm font-semibold text-zinc-900">Paper</div>
        <div
          className="mt-3 flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-zinc-50 px-6 py-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0] ?? null;
            onChooseFile(f);
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
            <span className="text-lg">☁</span>
          </div>
          <div className="mt-3 text-sm font-medium text-zinc-700">
            Choose a file or drag & drop it here.
          </div>
          <div className="mt-1 text-xs text-zinc-400">PNG,Zip or Docs formats up to 3 MB.</div>

          <div className="mt-4">
            <button
              type="button"
              onClick={pickFile}
              className="inline-flex h-9 items-center rounded-lg border border-black/[0.08] bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Browse File
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.doc,.docx,.png,.zip"
            />
          </div>

          {file ? (
            <div className="mt-3 text-xs text-zinc-500">
              Selected: <span className="font-medium text-zinc-700">{file.name}</span>
            </div>
          ) : null}
        </div>

        {/* Title + keywords */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Paper Title"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Keywords</div>
            <select
              value={keyword}
              onChange={(e) => setKeyword(e.target.value as Keyword | "")}
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            >
              <option value="">Select Keywords</option>
              {KEYWORDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Abstract */}
        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Abstract</div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value.slice(0, 200))}
              placeholder="Abstract"
              className="min-h-[164px] w-full resize-none bg-transparent px-1 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <div className="text-right text-[11px] text-zinc-400">
              {abstractCount}/200
            </div>
          </div>
        </div>

        {/* Paper author */}
        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Paper Author</div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
            <label className="flex items-center gap-3 text-sm text-zinc-700">
              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                className={[
                  "relative inline-flex h-5 w-9 items-center rounded-full border border-black/[0.08] p-0.5 transition",
                  anonymous ? "bg-[var(--brand)]" : "bg-zinc-100",
                ].join(" ")}
                aria-pressed={anonymous}
              >
                <span
                  className={[
                    "h-4 w-4 rounded-full bg-white shadow-sm transition",
                    anonymous ? "translate-x-4" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
              Submit Anonymously
            </label>

            <div className="relative">
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={anonymous}
                placeholder={anonymous ? "Anonymous" : "Author name"}
                className={[
                  "h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20",
                  anonymous ? "opacity-60" : "",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setAuthor("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                aria-label="Clear"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={[
              "inline-flex h-10 items-center rounded-xl px-10 text-sm font-medium text-white",
              canSubmit && !submitting
                ? "bg-[var(--brand)] hover:opacity-95"
                : "bg-zinc-300 text-white/80",
            ].join(" ")}
          >
            {submitting ? "Uploading..." : "Submit"}
          </button>
        </div>
      </form>
    </section>
  );
}
