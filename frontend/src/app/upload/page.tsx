"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { PAPER_CATEGORIES, type PaperCategory } from "@/lib/papers/categories";

const CATEGORY_OPTIONS: PaperCategory[] = [...PAPER_CATEGORIES];

/** Subtle hover for clickable rows/options on this page. */
const optionHover =
  "cursor-pointer transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-inset hover:ring-zinc-200/70";

/** Hover/focus for interactive fields (e.g. date picker). */
const fieldInteractive =
  "cursor-pointer transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-zinc-200/60 active:opacity-90 active:ring-2 active:ring-zinc-200/70 focus:border-black/20 focus:ring-2 focus:ring-[var(--brand)]/20";

function UploadCompletedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500"
        aria-hidden
      >
        <svg
          className="h-2.5 w-2.5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-xs font-medium text-zinc-800">Completed</span>
    </span>
  );
}

function UploadingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-200 border-t-[var(--brand)]"
        aria-hidden
      />
      <span className="text-xs font-medium text-zinc-500">Uploading...</span>
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

const MOCK_REFERENCES = [
  {
    id: "ref-1",
    title: "Sustainable Energy Practices in Urban Environments",
    desc: "Introducing our latest paper description, exploring...",
    author: "James B.",
    tags: ["AI infrastructure", "Computer science"],
    thumb: "/thumbs/energy.jpg",
  },
  {
    id: "ref-2",
    title: "Optimising Energy Consumption in Smart Cities",
    desc: "Presenting a comprehensive study on optimising energy...",
    author: "Alex C.",
    tags: ["Smart grids", "Renewable energy sources"],
    thumb: "/thumbs/smart-city.jpg",
  },
  {
    id: "ref-3",
    title: "Sustainable Energy Practices in Urban Environments",
    desc: "Introducing our latest paper description, exploring...",
    author: "James B.",
    tags: ["AI infrastructure", "Computer science"],
    thumb: "/thumbs/energy2.jpg",
  },
];

type UploadState = "idle" | "uploading" | "completed";

interface Citation {
  id: string;
  label: string;
}

export default function UploadPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [published, setPublished] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [selectedCategories, setSelectedCategories] = useState<PaperCategory[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [abstract, setAbstract] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [contributors, setContributors] = useState("");
  const [doi, setDoi] = useState("");

  const [refQuery, setRefQuery] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const abstractCount = useMemo(() => Math.min(abstract.length, 200), [abstract]);

  const isPdfFile = useCallback((f: File) => {
    const name = f.name.toLowerCase();
    return f.type === "application/pdf" || name.endsWith(".pdf");
  }, []);

  const simulateUpload = useCallback((f: File) => {
    setFile(f);
    setUploadState("uploading");
    setUploadProgress(0);
    let progress = 0;
    const iv = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(iv);
        setUploadState("completed");
      }
      setUploadProgress(Math.min(100, Math.round(progress)));
    }, 300);
  }, []);

  function onChooseFile(f: File | null) {
    if (!f) return;
    setError(null);
    if (!isPdfFile(f)) {
      setError("Only PDF files are allowed");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    simulateUpload(f);
  }

  function removeFile() {
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
  }

  function toggleCategory(cat: PaperCategory) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  function removeCategory(cat: PaperCategory) {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  }

  const filteredRefs = MOCK_REFERENCES.filter(
    (r) => refQuery.trim() && r.title.toLowerCase().includes(refQuery.toLowerCase()),
  );

  function addCitation(ref: (typeof MOCK_REFERENCES)[number]) {
    if (citations.some((c) => c.id === ref.id)) return;
    setCitations((prev) => [
      ...prev,
      { id: ref.id, label: `${ref.author.replace(/\.$/, "")}, et al. (2022). ${ref.title}. Urban Landscape Transformations.` },
    ]);
    setRefQuery("");
    setRefOpen(false);
  }

  function removeCitation(id: string) {
    setCitations((prev) => prev.filter((c) => c.id !== id));
  }

  async function onSubmit() {
    setError(null);
    setSuccessUrl(null);

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!abstract.trim()) {
      setError("Please enter an abstract.");
      return;
    }
    if (!file || uploadState !== "completed") {
      setError("Please finish uploading your paper file.");
      return;
    }

    const contributorList = contributors
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

    const publishedDate =
      published.trim() || new Date().toISOString().split("T")[0];

    setSubmitting(true);
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          categories: selectedCategories,
          keywords: [],
          publishedAt: publishedDate,
          doi: doi.trim() || undefined,
          references: citations.map((c) => ({ citationText: c.label })),
          contributors: contributorList,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not submit paper");
      }

      const created = (await res.json()) as { id: string };

      if (!isPdfFile(file)) {
        throw new Error("Only PDF files are allowed");
      }

      const uploadMime =
        file.type === "application/pdf"
          ? "application/pdf"
          : file.name.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : "";

      if (!uploadMime) {
        throw new Error("Only PDF files are allowed");
      }

      const uploadFile =
        uploadMime !== file.type
          ? new File([file], file.name, { type: uploadMime })
          : file;

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("paperId", created.id);

      const uploadRes = await fetch("/api/papers/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) {
        const body = (await uploadRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Paper saved but file upload failed");
      }

      const url = `${window.location.origin}/paper/${created.id}`;
      setSuccessUrl(url);
      setSuccessOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit paper");
    } finally {
      setSubmitting(false);
    }
  }

  async function shareToSocials(url: string) {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share({ title: "ODD Academia paper", url });
        return;
      }
    } catch {
      // fall through
    }
    const encoded = encodeURIComponent(url);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const canSubmit = Boolean(file) && uploadState === "completed" && title.trim().length > 0;

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => router.back()}
        className={`mb-4 -ml-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 ${optionHover}`}
      >
        <span>←</span> Back
      </button>

      <div className="text-base font-semibold text-zinc-900">Submit New Paper</div>

      <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        {/* ── Paper upload ── */}
        <div className="text-sm font-semibold text-zinc-900">Paper</div>

        {uploadState === "idle" ? (
          <div
            className="mt-3 flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-zinc-50 px-6 py-6 text-center transition hover:border-black/20 hover:bg-zinc-100/90 hover:opacity-95 hover:ring-2 hover:ring-zinc-200/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onChooseFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0-4 4m4-4 4 4" />
                <path d="M4 20h16" />
              </svg>
            </div>
            <div className="mt-3 text-sm font-medium text-zinc-700">
              Drag file here to upload or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer font-semibold text-zinc-900 underline underline-offset-2 transition hover:opacity-80"
              >
                choose file
              </button>
            </div>
            <div className="mt-1 text-xs text-zinc-400">PDF files only (max 10MB).</div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex h-9 cursor-pointer items-center rounded-lg border border-black/[0.08] bg-white px-4 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-zinc-200/70"
            >
              Browse File
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
              accept=".pdf,application/pdf"
            />
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <span className="text-xs font-bold text-red-500">PDF</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900">{file?.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                  <span>
                    {(() => {
                      const totalKb = file ? Math.max(1, Math.round(file.size / 1024)) : 0;
                      if (uploadState === "completed") {
                        return `${totalKb} of ${totalKb} KB uploaded`;
                      }
                      const uploadedKb = Math.round((uploadProgress / 100) * totalKb);
                      return `${uploadedKb} of ${totalKb} KB`;
                    })()}
                  </span>
                  <span className="text-zinc-300">•</span>
                  {uploadState === "uploading" ? (
                    <UploadingBadge />
                  ) : (
                    <UploadCompletedBadge />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 hover:opacity-90 hover:ring-1 hover:ring-zinc-200/70"
                aria-label="Remove file"
              >
                {uploadState === "completed" ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                ) : (
                  <span className="text-lg">×</span>
                )}
              </button>
            </div>
            {uploadState === "uploading" && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Title + Published ── */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Published</div>
            <div className="relative">
              <input
                ref={dateInputRef}
                type="date"
                value={published}
                onChange={(e) => setPublished(e.target.value)}
                placeholder="YYYY-MM-DD"
                className={`h-11 w-full rounded-xl border border-black/[0.08] bg-white py-0 pl-4 pr-12 text-sm text-zinc-900 outline-none [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-12 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${fieldInteractive}`}
              />
              <button
                type="button"
                onClick={() => {
                  const el = dateInputRef.current;
                  if (!el) return;
                  if (typeof el.showPicker === "function") el.showPicker();
                  else el.focus();
                }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 ${optionHover} rounded-lg p-1.5 hover:text-zinc-700`}
                aria-label="Open calendar"
              >
                <CalendarIcon />
              </button>
            </div>
          </div>
        </div>

        {/* ── Categories (multi-select) ── */}
        <div className="relative mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Categories</div>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={categoryOpen}
            aria-haspopup="listbox"
            onClick={() => setCategoryOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setCategoryOpen((v) => !v);
              }
            }}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-zinc-200/60 focus:border-black/20 focus-visible:ring-2 focus-visible:ring-[var(--brand)]/25"
          >
            <span className="flex flex-wrap items-center gap-2">
              {selectedCategories.length === 0 ? (
                <span className="text-zinc-400">Select categories</span>
              ) : (
                selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-3 py-0.5 text-xs font-medium text-[var(--brand)]"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(cat);
                      }}
                      className="ml-0.5 cursor-pointer text-[var(--brand)] transition hover:text-[var(--brand)]/70 hover:opacity-80"
                      aria-label={`Remove ${cat}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </span>
            <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          {categoryOpen && (
            <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${optionHover} ${
                    selectedCategories.includes(cat) ? "font-medium text-[var(--brand)]" : "text-zinc-700"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${
                    selectedCategories.includes(cat)
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-zinc-300"
                  }`}>
                    {selectedCategories.includes(cat) && "✓"}
                  </span>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Abstract ── */}
        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Abstract</div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value.slice(0, 200))}
              placeholder="Abstract"
              className="min-h-[140px] w-full resize-none bg-transparent px-1 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <div className="text-right text-[11px] text-zinc-400">
              {abstractCount}/200
            </div>
          </div>
        </div>

        {/* ── Paper Author + Contributors + DOI ── */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Paper Author</div>
            <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:opacity-95 hover:ring-1 hover:ring-zinc-200/60">
              <span className="flex-1">Submit Anonymously</span>
              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-black/[0.08] p-0.5 transition hover:opacity-90 hover:ring-2 hover:ring-zinc-200/80 ${
                  anonymous ? "bg-[var(--brand)]" : "bg-zinc-100"
                }`}
                aria-pressed={anonymous}
              >
                <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${anonymous ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Contributors</div>
            <input
              value={contributors}
              onChange={(e) => setContributors(e.target.value)}
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">DOI</div>
            <input
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>
        </div>

        {/* ── Citation / References ── */}
        <div className="relative mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Citation</div>

          {citations.length > 0 && (
            <div className="space-y-2">
              {citations.map((c) => (
                <div key={c.id} className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5">
                  <a href="#" className="flex-1 text-sm font-medium text-[var(--brand)] hover:underline">
                    {c.label}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeCitation(c.id)}
                    className="shrink-0 cursor-pointer rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 hover:opacity-90"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              value={refQuery}
              onChange={(e) => { setRefQuery(e.target.value); setRefOpen(true); }}
              onFocus={() => refQuery.trim() && setRefOpen(true)}
              placeholder="Search papers"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>

          {refOpen && filteredRefs.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-black/[0.08] bg-white shadow-lg">
              {filteredRefs.map((ref) => (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => addCitation(ref)}
                  className={`flex w-full items-start gap-3 border-b border-black/[0.04] px-4 py-3 text-left last:border-0 ${optionHover}`}
                >
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-200" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-zinc-900">{ref.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">{ref.desc}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {ref.tags.map((t) => (
                        <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pt-1">
                    <div className="h-6 w-6 rounded-full bg-zinc-200" />
                    <span className="text-xs text-zinc-500">{ref.author}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {/* ── Submit ── */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || submitting}
            className={`inline-flex h-10 items-center rounded-xl px-10 text-sm font-medium text-white transition ${
              canSubmit && !submitting
                ? "cursor-pointer bg-[var(--brand)] hover:opacity-95 hover:ring-2 hover:ring-[var(--brand)]/30 active:opacity-90"
                : "cursor-not-allowed bg-zinc-300 text-white/80"
            }`}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* ── Success modal ── */}
      {successOpen && successUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <button
              type="button"
              onClick={() => {
                setSuccessOpen(false);
                router.push("/home");
              }}
              className={`absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 ${optionHover}`}
              aria-label="Close and go to home"
            >
              ×
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-zinc-900">Success</h2>
            <p className="mt-1 text-sm text-zinc-500">Your paper has been submitted!</p>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-black/[0.08] bg-zinc-50 px-4 py-3">
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-600">{successUrl}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(successUrl)}
                className={`shrink-0 rounded-lg p-1.5 text-zinc-400 ${optionHover}`}
                aria-label="Copy link"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={() => shareToSocials(successUrl)}
              className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white transition hover:bg-emerald-700 hover:opacity-95 hover:ring-2 hover:ring-emerald-400/40 active:opacity-90"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2" />
              </svg>
              Share to Socials
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
