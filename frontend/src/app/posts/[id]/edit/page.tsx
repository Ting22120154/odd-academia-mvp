"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PAPER_CATEGORIES as CATEGORIES, type PaperCategory as PostCategory } from "@/lib/papers/categories";

type ContributorTag = {
  label: string;
  href?: string;
};

type Attachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type PostShape = {
  id: number;
  title: string;
  content: string;
  categories?: string[];
  keywords?: string[];
  publishedDate?: string;
  doi?: string;
  references?: string[];
  contributors?: ContributorTag[];
  attachment?: Attachment;
  author?: { name: string };
};

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  const mb = Math.round((kb / 1024) * 10) / 10;
  return `${mb} MB`;
}

function isPdfFile(file: File): boolean {
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  const typeOk = file.type === "application/pdf" || file.type === "";
  return nameOk && typeOk;
}

function parseCitation(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch?.[0];

  const firstToken = trimmed.split(/\s+/)[0] ?? "";
  const lastName = firstToken.replace(/[^\p{L}\p{N}-]/gu, "");

  if (!lastName || !year) return `(${trimmed})`;
  return `(${lastName}, ${year})`;
}

export default function EditPaperPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState(0);
  const [existingAttachment, setExistingAttachment] = useState<Attachment | null>(null);

  const [title, setTitle] = useState("");
  const [published, setPublished] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [abstract, setAbstract] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [contributorsInput, setContributorsInput] = useState("");
  const [contributors, setContributors] = useState<ContributorTag[]>([]);
  const [doi, setDoi] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [references, setReferences] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const abstractCount = useMemo(() => Math.min(abstract.length, 200), [abstract]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/posts/${id}`, { cache: "no-store" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Could not load paper");
        }
        const post = (await res.json()) as PostShape;
        setTitle(post.title ?? "");
        setAbstract(post.content ?? "");
        setPublished(post.publishedDate ?? "");
        setDoi(post.doi ?? "");
        setReferences(Array.isArray(post.references) ? post.references : []);
        setContributors(Array.isArray(post.contributors) ? post.contributors : []);
        setExistingAttachment(post.attachment ?? null);
        setAnonymous(post.author?.name === "Anonymous");

        const cats = (post.categories ?? post.keywords ?? []) as string[];
        const catSet: readonly string[] = CATEGORIES;
        const valid = cats.filter((c) => catSet.includes(c)) as PostCategory[];
        setCategories(valid);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  useEffect(() => {
    if (successUrl && !isLoggedIn) setSuccessUrl(null);
  }, [isLoggedIn, successUrl]);

  const availableCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    const remaining = CATEGORIES.filter((c) => !categories.includes(c));
    if (!q) return remaining;
    return remaining.filter((c) => c.toLowerCase().includes(q));
  }, [categoryQuery, categories]);

  function pickFile() {
    inputRef.current?.click();
  }

  function onChooseFile(f: File | null) {
    if (!f) {
      setFile(null);
      setFileProgress(0);
      return;
    }
    if (!isPdfFile(f)) {
      setError("Please upload a PDF file only.");
      setFile(null);
      setFileProgress(0);
      return;
    }
    setError(null);
    setFile(f);
    setFileProgress(100);
  }

  function addCategory(cat: PostCategory) {
    setCategories((prev) => (prev.includes(cat) ? prev : [...prev, cat]));
    setCategoryQuery("");
    setCategoryOpen(false);
  }

  function removeCategory(cat: PostCategory) {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  function addReference(raw: string) {
    const citation = parseCitation(raw);
    if (!citation) return;
    setReferences((prev) => (prev.includes(citation) ? prev : [...prev, citation]));
    setReferenceInput("");
  }

  function removeReference(citation: string) {
    setReferences((prev) => prev.filter((c) => c !== citation));
  }

  function addContributor(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const tag: ContributorTag = { label: trimmed };
    setContributors((prev) =>
      prev.some((c) => c.label.toLowerCase() === tag.label.toLowerCase()) ? prev : [...prev, tag],
    );
    setContributorsInput("");
  }

  function removeContributor(label: string) {
    setContributors((prev) => prev.filter((c) => c.label !== label));
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore
    }
  }

  async function shareToSocials(url: string) {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({ title: "ODD Academia paper", url });
        return;
      }
    } catch {
      // fall through
    }
    const encoded = encodeURIComponent(url);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, "_blank", "noopener,noreferrer");
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessUrl(null);

    if (!isLoggedIn) {
      setError("Please log in to save changes.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!abstract.trim()) {
      setError("Please enter an abstract.");
      return;
    }
    if (categories.length === 0) {
      setError("Please select at least one category.");
      return;
    }

    setSaving(true);
    try {
      setFileProgress(file ? 20 : 100);
      const progressTimer = file
        ? window.setInterval(() => setFileProgress((p) => (p >= 90 ? 90 : p + 7)), 120)
        : null;

      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: abstract.trim(),
          keywords: categories,
          categories,
          publishedDate: published || undefined,
          doi: doi.trim() || undefined,
          references,
          contributors,
          author: {
            name: anonymous ? "Anonymous" : user?.fullName || "User",
          },
          attachment: file
            ? { fileName: file.name, mimeType: "application/pdf", sizeBytes: file.size }
            : existingAttachment ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not save changes");
      }

      if (progressTimer) window.clearInterval(progressTimer);
      setFileProgress(100);

      const origin = window.location.origin;
      const url = `${origin}/posts/${id}`;
      setSuccessUrl(url);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)]">
        <div className="text-sm text-zinc-600">Loading paper...</div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="mx-auto w-full max-w-[var(--page-max)]">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </section>
    );
  }

  const canSave = !saving && isLoggedIn && title.trim() && abstract.trim() && categories.length > 0;

  return (
    <section className="mx-auto w-full max-w-[var(--page-max)]">
      <button
        type="button"
        onClick={() => {
          router.push(`/posts/${id}`);
          router.refresh();
        }}
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
      >
        ← Back
      </button>

      <div className="mt-3 text-base font-semibold text-zinc-900">Edit Paper</div>

      <form
        onSubmit={onSave}
        className="mt-5 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-sm)]"
      >
        {!isLoggedIn ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            You can preview this page without logging in, but you’ll need to log in to save changes.
          </div>
        ) : null}

        <div className="text-sm font-semibold text-zinc-900">Paper</div>

        {file || existingAttachment ? (
          <div className="mt-3 rounded-2xl border border-black/[0.08] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-semibold text-red-700">
                  PDF
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900">
                    {file?.name ?? existingAttachment?.fileName}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {formatFileSize(file?.size ?? existingAttachment?.sizeBytes ?? 0)} •{" "}
                    {saving ? "Uploading..." : "Completed"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setExistingAttachment(null);
                  setFileProgress(0);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-[var(--brand)] transition-[width]"
                style={{ width: `${Math.max(0, Math.min(100, fileProgress))}%` }}
              />
            </div>
            <div className="mt-3">
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex h-9 items-center rounded-lg border border-black/[0.08] bg-white px-4 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                Replace PDF
              </button>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                accept=".pdf"
              />
            </div>
          </div>
        ) : (
          <div
            className="mt-3 flex min-h-[148px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.12] bg-zinc-50 px-6 py-6 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0] ?? null;
              onChooseFile(f);
            }}
          >
            <div className="text-xs text-zinc-500">
              Drag file here to upload or{" "}
              <button
                type="button"
                onClick={pickFile}
                className="font-medium text-zinc-900 underline underline-offset-2"
              >
                choose file
              </button>
            </div>
            <div className="mt-1 text-[11px] text-zinc-400">PDF formats, up to 3 MB.</div>
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
                accept=".pdf"
              />
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Title</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you name this title if you weren't constrained by Academic Publishing Rules"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Published</div>
            <input
              type="date"
              value={published}
              onChange={(e) => setPublished(e.target.value)}
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 outline-none focus:border-black/20"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Categories</div>
          <div className="relative">
            <input
              value={categoryQuery}
              onChange={(e) => {
                setCategoryQuery(e.target.value);
                setCategoryOpen(true);
              }}
              onFocus={() => setCategoryOpen(true)}
              onBlur={() => window.setTimeout(() => setCategoryOpen(false), 120)}
              placeholder="Select Category"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
              ▾
            </div>

            {categoryOpen ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-[0_12px_30px_rgba(0,0,0,0.10)]">
                <div className="max-h-56 overflow-auto p-1">
                  {availableCategories.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-zinc-500">No matches</div>
                  ) : (
                    availableCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCategory(cat)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-50"
                      >
                        <span>{cat}</span>
                        <span className="text-xs text-zinc-400">Add</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {categories.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="text-zinc-500 hover:text-zinc-900"
                    aria-label={`Remove ${cat}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">Abstract</div>
          <div className="rounded-2xl border border-black/[0.08] bg-white p-3">
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value.slice(0, 200))}
              placeholder="Explain your research to your audience in a simple way so anyone without assumed knowledge can understand"
              className="min-h-[164px] w-full resize-none bg-transparent px-1 py-1 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
            />
            <div className="text-right text-[11px] text-zinc-400">{abstractCount}/200</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Paper Author</div>
            <div className="flex h-11 items-center justify-between rounded-xl border border-black/[0.08] bg-white px-4">
              <div className="text-sm text-zinc-700">Publish Anonymously</div>
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
            </div>
            {!anonymous ? (
              <div className="text-xs text-zinc-500">Publishing as {user?.fullName ?? "User"}.</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Contributors</div>
            <input
              value={contributorsInput}
              onChange={(e) => setContributorsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addContributor(contributorsInput);
                }
              }}
              placeholder="Optional"
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
            />
            {contributors.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {contributors.map((c) => (
                  <span
                    key={c.label}
                    className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                  >
                    {c.href ? (
                      <a href={c.href} className="hover:underline">
                        {c.label}
                      </a>
                    ) : (
                      c.label
                    )}
                    <button
                      type="button"
                      onClick={() => removeContributor(c.label)}
                      className="text-zinc-500 hover:text-zinc-900"
                      aria-label={`Remove ${c.label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
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

        <div className="mt-6 space-y-2">
          <div className="text-sm font-semibold text-zinc-900">References</div>
          <input
            value={referenceInput}
            onChange={(e) => setReferenceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addReference(referenceInput);
              }
            }}
            placeholder="Search papers"
            className="h-11 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black/20"
          />
        </div>

        {references.length ? (
          <div className="mt-4 space-y-2">
            <div className="text-sm font-semibold text-zinc-900">Citation</div>
            <div className="space-y-2">
              {references.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-zinc-50 px-4 py-3"
                >
                  <div className="text-sm text-blue-700 underline underline-offset-2">{c}</div>
                  <button
                    type="button"
                    onClick={() => removeReference(c)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label="Remove reference"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={!canSave}
            className={[
              "inline-flex h-10 items-center rounded-xl px-10 text-sm font-medium text-white",
              canSave ? "bg-[var(--brand)] hover:opacity-95" : "bg-zinc-300 text-white/80",
            ].join(" ")}
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </div>
      </form>

      {successUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => {
                setSuccessUrl(null);
                router.push(`/posts/${id}`);
                router.refresh();
              }}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
              aria-label="Close"
            >
              ×
            </button>

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              ✓
            </div>
            <div className="mt-4 text-center text-xl font-semibold text-zinc-900">Success</div>
            <div className="mt-1 text-center text-sm text-zinc-500">Your paper has been updated!</div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <div className="min-w-0 flex-1 truncate text-sm text-zinc-700">{successUrl}</div>
              <button
                type="button"
                onClick={() => copyLink(successUrl)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                aria-label="Copy link"
              >
                ⧉
              </button>
            </div>

            <button
              type="button"
              onClick={() => shareToSocials(successUrl)}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-medium text-white hover:opacity-95"
            >
              Share to Socials
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

