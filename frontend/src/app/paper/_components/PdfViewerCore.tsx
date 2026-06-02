"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  bottomActionHover,
  toolbarItemHover,
} from "@/lib/ui/interactive";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Ensure worker matches the pdfjs version bundled by react-pdf to avoid:
// "API version X does not match the Worker version Y"
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Zoom levels for the PDF only (100% = fit width, higher = zoom in). */
const ZOOM_STEPS = [1, 1.25, 1.5, 1.75, 2] as const;

export type PdfViewerCoreProps = {
  fileSrc: string;
  title?: string;
  summary?: string;
  downloadFilename?: string;
  downloadCount?: number;
  shareCount?: number;
  citationCount?: number;
  onShare?: () => void | Promise<void>;
  onCite?: () => void | Promise<void>;
};

function BookIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 4h7a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" strokeLinejoin="round" />
      <path d="M19 4h-4a3 3 0 0 0-3 3v13h7V7a3 3 0 0 0-3-3Z" strokeLinejoin="round" />
    </svg>
  );
}

function ZoomIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6" strokeLinecap="round" />
      <path d="m20 20 3 3" strokeLinecap="round" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadCircleIcon() {
  return (
    <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20h16" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" strokeLinejoin="round" />
      <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CiteIcon() {
  return (
    <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h9" strokeLinecap="round" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function TopTool({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className = `flex items-center gap-2 px-5 py-3.5 text-sm text-zinc-700 ${toolbarItemHover}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          className,
          disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent hover:ring-0" : "",
        ].join(" ")}
      >
        {children}
      </button>
    );
  }

  return <div className={`${className} cursor-default hover:bg-transparent hover:ring-0`}>{children}</div>;
}

function BottomAction({
  icon,
  label,
  count,
  statusText,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  /** When set, replaces "Label: count" (e.g. "Link copied!"). */
  statusText?: string | null;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 text-sm text-zinc-800 ${bottomActionHover}`}
    >
      {icon}
      <span className={statusText ? "font-medium text-emerald-600" : undefined}>
        {statusText ?? (
          <>
            {label}: <span className="font-semibold text-zinc-900">{count}</span>
          </>
        )}
      </span>
    </button>
  );
}

export default function PdfViewerCore({
  fileSrc,
  title,
  summary,
  downloadFilename,
  downloadCount = 101,
  shareCount = 35,
  citationCount = 35,
  onShare,
  onCite,
}: PdfViewerCoreProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(640);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const scale = ZOOM_STEPS[zoomIndex] ?? 1;

  useEffect(() => {
    const el = pageWrapRef.current;
    if (!el) return;

    const updateWidth = () => {
      const padding = 48;
      setPageWidth(Math.min(720, Math.max(280, el.clientWidth - padding)));
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setLoading(false);
    setError("Could not load this PDF.");
  }, []);

  const scrollToPage = useCallback((page: number) => {
    const el = pageRefs.current[page - 1];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setPageNumber(page);
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best?.target) return;
        const page = Number((best.target as HTMLElement).dataset.page);
        if (page > 0) setPageNumber(page);
      },
      { root, threshold: [0.35, 0.55, 0.75] },
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages, pageWidth, zoomIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!numPages) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        scrollToPage(Math.max(1, pageNumber - 1));
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        scrollToPage(Math.min(numPages, pageNumber + 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [numPages, pageNumber, scrollToPage]);

  const zoomIn = () => {
    setZoomIndex((i) => {
      const next = Math.min(ZOOM_STEPS.length - 1, i + 1);
      if (next !== i) {
        requestAnimationFrame(() => scrollToPage(pageNumber));
      }
      return next;
    });
  };

  const zoomPercent = Math.round(scale * 100);

  const toggleFullscreen = () => {
    const el = rootRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    if (!onShare) return;
    try {
      await onShare();
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      setError("Could not copy link. Please try again.");
    }
  };

  const handleDownload = async () => {
    if (!downloadFilename) return;
    try {
      const res = await fetch(`${fileSrc}?download=1`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadFilename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed. Please try again.");
    }
  };

  return (
    <div
      ref={rootRef}
      className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)] [&:fullscreen]:min-h-screen [&:fullscreen]:bg-white"
    >
      {/* Top toolbar — Figma: Page | Zoom | Full-screen */}
      <div className="flex flex-wrap items-stretch divide-x divide-zinc-200 border-b border-zinc-200 bg-white">
        <TopTool>
          <BookIcon />
          <span>
            Page {pageNumber} of {numPages ?? "—"}
          </span>
        </TopTool>
        <TopTool
          onClick={zoomIn}
          disabled={zoomIndex >= ZOOM_STEPS.length - 1}
        >
          <ZoomIcon />
          <span>
            {zoomPercent === 100 ? "Zoom" : `${zoomPercent}%`}
          </span>
        </TopTool>
        <TopTool onClick={toggleFullscreen}>
          <FullscreenIcon />
          <span>Full-screen</span>
        </TopTool>
      </div>

      {(title || summary) && (
        <div className="border-b border-zinc-100 bg-white px-8 py-10">
          {title ? (
            <h2 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900">
              {title}
            </h2>
          ) : null}
          {summary ? (
            <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-600">{summary}</p>
          ) : null}
        </div>
      )}

      <div
        ref={scrollRef}
        className="pdf-viewer-scroll max-h-[70vh] min-h-[70vh] overflow-y-scroll overflow-x-hidden bg-zinc-50 [scrollbar-gutter:stable] [&:fullscreen]:max-h-none [&:fullscreen]:min-h-0 [&:fullscreen]:flex-1"
      >
        <div
          ref={pageWrapRef}
          className="flex flex-col items-center gap-6 px-4 py-10"
        >
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <Document
              file={fileSrc}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                loading ? (
                  <p className="text-sm text-zinc-500">Loading document…</p>
                ) : null
              }
              className="flex w-full flex-col items-center gap-6 [&_.react-pdf__Page]:shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
            >
              {numPages
                ? Array.from({ length: numPages }, (_, index) => {
                    const page = index + 1;
                    return (
                      <div
                        key={page}
                        ref={(el) => {
                          pageRefs.current[index] = el;
                        }}
                        data-page={page}
                        className="flex w-full justify-center"
                      >
                        <Page
                          pageNumber={page}
                          width={pageWidth}
                          scale={scale}
                          renderTextLayer
                          renderAnnotationLayer
                          className="!bg-white"
                          onRenderSuccess={() => {
                            if (page === 1) setLoading(false);
                          }}
                        />
                      </div>
                    );
                  })
                : null}
            </Document>
          )}
        </div>
      </div>

      {/* Bottom actions — Figma: Download | Share | Cite */}
      {shareCopied ? (
        <p className="border-t border-zinc-200 bg-emerald-50/80 px-6 py-2 text-center text-sm font-medium text-emerald-700">
          Link copied to clipboard
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-8 border-t border-zinc-200 bg-white px-6 py-4">
        <BottomAction
          icon={
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition group-hover:border-zinc-300 group-hover:bg-zinc-100 group-hover:ring-1 group-hover:ring-zinc-200/60">
              <DownloadCircleIcon />
            </span>
          }
          label="Download"
          count={downloadCount}
          onClick={() => void handleDownload()}
        />
        <BottomAction
          icon={<ShareIcon />}
          label="Share"
          count={shareCount}
          statusText={shareCopied ? "Link copied!" : null}
          onClick={() => void handleShare()}
        />
        <BottomAction
          icon={<CiteIcon />}
          label="Cite This Paper"
          count={citationCount}
          onClick={onCite}
        />
      </div>
    </div>
  );
}
