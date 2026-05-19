"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) router.replace("/login");
  }, [isLoggedIn, router]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState("");
  const [published, setPublished] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<Keyword[]>([]);
  const [kwOpen, setKwOpen] = useState(false);
  const [abstract, setAbstract] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [contributors, setContributors] = useState("");
  const [doi, setDoi] = useState("");

  const [refQuery, setRefQuery] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);

  const [successOpen, setSuccessOpen] = useState(false);
  const mockLink = "https://oddacademia.com/paper/f7/mongodb-637x9287b5-cslv9";

  const abstractCount = useMemo(() => Math.min(abstract.length, 200), [abstract]);

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
    simulateUpload(f);
  }

  function removeFile() {
    setFile(null);
    setUploadState("idle");
    setUploadProgress(0);
  }

  function toggleKeyword(kw: Keyword) {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw],
    );
  }

  function removeKeyword(kw: Keyword) {
    setSelectedKeywords((prev) => prev.filter((k) => k !== kw));
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

  function onSubmit() {
    setSuccessOpen(true);
  }

  const canSubmit = Boolean(file) && uploadState === "completed" && title.trim().length > 0;

  if (!isLoggedIn) return null;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <span>←</span> Back
      </button>

      <div className="text-base font-semibold text-zinc-900">Submit New Paper</div>

      <div className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]">
        {/* ── Paper upload ── */}
        <div className="text-sm font-semibold text-zinc-900">Paper</div>

        {uploadState === "idle" ? (
          <div
            className="mt-3 flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-zinc-50 px-6 py-6 text-center"
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
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-zinc-900 underline underline-offset-2">
                choose file
              </button>
            </div>
            <div className="mt-1 text-xs text-zinc-400">PNG or Docx formats, up to 3 MB.</div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-black/[0.08] bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
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
        ) : (
          <div className="mt-3 rounded-xl border border-black/[0.08] bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                <span className="text-xs font-bold text-red-500">PDF</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-zinc-900">{file?.name}</div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {uploadState === "uploading"
                    ? `0 KB of ${file ? Math.round(file.size / 1024) : 120} KB • ⚙ Uploading...`
                    : `0 KB of ${file ? Math.round(file.size / 1024) : 120} KB • ✅ Completed`}
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
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
            <input
              type="date"
              value={published}
              onChange={(e) => setPublished(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            />
          </div>
        </div>

        {/* ── Keywords (multi-select) ── */}
        <div className="relative mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Keywords</div>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={kwOpen}
            aria-haspopup="listbox"
            onClick={() => setKwOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setKwOpen((v) => !v);
              }
            }}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4 text-sm outline-none focus:border-black/20 focus-visible:ring-2 focus-visible:ring-[var(--brand)]/25"
          >
            <span className="flex flex-wrap items-center gap-2">
              {selectedKeywords.length === 0 ? (
                <span className="text-zinc-400">Select Keyword</span>
              ) : (
                selectedKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--brand)]/10 px-3 py-0.5 text-xs font-medium text-[var(--brand)]"
                  >
                    {kw}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeKeyword(kw);
                      }}
                      className="ml-0.5 text-[var(--brand)] hover:text-[var(--brand)]/70"
                      aria-label={`Remove ${kw}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </span>
            <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          {kwOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg">
              {KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => toggleKeyword(kw)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-zinc-50 ${
                    selectedKeywords.includes(kw) ? "font-medium text-[var(--brand)]" : "text-zinc-700"
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${
                    selectedKeywords.includes(kw)
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-zinc-300"
                  }`}>
                    {selectedKeywords.includes(kw) && "✓"}
                  </span>
                  {kw}
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
            <label className="flex h-11 items-center gap-3 rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-700">
              <span className="flex-1">Submit Anonymously</span>
              <button
                type="button"
                onClick={() => setAnonymous((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-black/[0.08] p-0.5 transition ${
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
                    className="shrink-0 text-zinc-400 hover:text-zinc-600"
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
                  className="flex w-full items-start gap-3 border-b border-black/[0.04] px-4 py-3 text-left hover:bg-zinc-50 last:border-0"
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

        {/* ── Submit ── */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`inline-flex h-10 items-center rounded-xl px-10 text-sm font-medium text-white ${
              canSubmit ? "bg-[var(--brand)] hover:opacity-95" : "bg-zinc-300 text-white/80"
            }`}
          >
            Submit
          </button>
        </div>
      </div>

      {/* ── Success modal ── */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
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
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-600">{mockLink}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(mockLink)}
                className="shrink-0 text-zinc-400 hover:text-zinc-600"
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
              onClick={() => setSuccessOpen(false)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
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
