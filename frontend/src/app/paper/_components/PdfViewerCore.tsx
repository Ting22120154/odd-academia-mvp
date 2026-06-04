"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  bottomActionHover,
  toolbarItemHover,
} from "@/lib/ui/interactive";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Worker must match react-pdf's pdfjs API version (see pdfjs.version).
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs?v=${pdfjs.version}`;

/** Preset zoom levels; buttons also step by ZOOM_STEP between min and max. */
const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}

export type PdfViewerCoreProps = {
  fileSrc: string;
  title?: string;
  summary?: string;
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

function ZoomInIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6" strokeLinecap="round" />
      <path d="m20 20 3 3" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M8 11h6" strokeLinecap="round" />
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
  shareCount = 35,
  citationCount = 35,
  onShare,
  onCite,
}: PdfViewerCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobUrlRef = useRef<string | null>(null);
  const [docEpoch, setDocEpoch] = useState(0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [documentReady, setDocumentReady] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [pageWidth, setPageWidth] = useState(640);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const zoomPercent = Math.round(zoom * 100);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDocumentReady(false);
    setNumPages(null);
    setPageNumber(1);
    setZoom(1);
    setZoomMenuOpen(false);
    pageRefs.current = [];
    setDocEpoch((e) => e + 1);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setPdfBlobUrl(null);

    void (async () => {
      try {
        const res = await fetch(fileSrc, { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          setError(
            res.status === 404
              ? "PDF file not found on the server."
              : "Could not load this PDF.",
          );
          setLoading(false);
          return;
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (
          !contentType.includes("pdf") &&
          !contentType.includes("octet-stream")
        ) {
          setError("Could not load this PDF.");
          setLoading(false);
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        if (blob.size < 64) {
          setError("PDF file is empty or missing.");
          setLoading(false);
          return;
        }
        const objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        blobUrlRef.current = objectUrl;
        setPdfBlobUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setError("Could not load this PDF.");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileSrc]);

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
    setDocumentReady(true);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback(() => {
    setDocumentReady(false);
    setNumPages(null);
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
  }, [numPages, pageWidth, zoom, documentReady]);

  useEffect(() => {
    if (!zoomMenuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setZoomMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [zoomMenuOpen]);

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

  const applyZoom = useCallback(
    (next: number) => {
      const clamped = clampZoom(next);
      setZoom(clamped);
      requestAnimationFrame(() => scrollToPage(pageNumber));
    },
    [pageNumber, scrollToPage],
  );

  const zoomIn = () => applyZoom(zoom + ZOOM_STEP);
  const zoomOut = () => applyZoom(zoom - ZOOM_STEP);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
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

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
      {/* Fullscreen only this shell (toolbar + PDF pages), not site nav or bottom actions */}
      <div
        ref={containerRef}
        className="flex h-full min-h-0 flex-col bg-zinc-50 [&:fullscreen]:h-screen [&:fullscreen]:w-screen [&:fullscreen]:max-h-screen"
      >
        <div className="flex shrink-0 flex-wrap items-stretch divide-x divide-zinc-200 border-b border-zinc-200 bg-white">
          <TopTool>
            <BookIcon />
            <span>
              Page {pageNumber} of {numPages ?? "—"}
            </span>
          </TopTool>

          <div className="flex items-stretch divide-x divide-zinc-200">
            <TopTool onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
              <ZoomOutIcon />
              <span className="sr-only">Zoom out</span>
            </TopTool>

            <div ref={zoomMenuRef} className="relative">
              <TopTool onClick={() => setZoomMenuOpen((v) => !v)} aria-expanded={zoomMenuOpen}>
                <span>{zoomPercent}%</span>
                <svg
                  className={`h-3.5 w-3.5 text-zinc-400 transition ${zoomMenuOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </TopTool>
              {zoomMenuOpen ? (
                <div className="absolute left-0 top-full z-30 min-w-[5.5rem] rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg">
                  {ZOOM_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        applyZoom(preset);
                        setZoomMenuOpen(false);
                      }}
                      className={[
                        "block w-full px-4 py-2 text-left text-sm hover:bg-zinc-50",
                        Math.abs(zoom - preset) < 0.001
                          ? "font-semibold text-[var(--brand)]"
                          : "text-zinc-700",
                      ].join(" ")}
                    >
                      {Math.round(preset * 100)}%
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <TopTool onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
              <ZoomInIcon />
              <span className="sr-only">Zoom in</span>
            </TopTool>
          </div>

          <TopTool onClick={toggleFullscreen}>
            <FullscreenIcon />
            <span>Full-screen</span>
          </TopTool>
        </div>

        {(title || summary) && (
          <div className="shrink-0 border-b border-zinc-100 bg-white px-8 py-10">
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
          className={[
            "pdf-viewer-scroll min-h-0 flex-1 overflow-y-auto overflow-x-auto bg-zinc-50 [scrollbar-gutter:stable]",
            isFullscreen ? "max-h-none" : "max-h-[70vh] min-h-[70vh]",
          ].join(" ")}
        >
          <div
            ref={pageWrapRef}
            className="flex flex-col items-center gap-6 px-4 py-10"
          >
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : pdfBlobUrl ? (
              <div className="w-full [&_.react-pdf__Page]:shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                <Document
                  key={`${fileSrc}-${docEpoch}`}
                  file={pdfBlobUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    loading ? (
                      <p className="text-sm text-zinc-500">Loading document…</p>
                    ) : null
                  }
                  className="flex w-full flex-col items-center gap-6"
                >
                  {documentReady && numPages
                    ? Array.from({ length: numPages }, (_, index) => {
                        const page = index + 1;
                        return (
                          <div
                            key={`${docEpoch}-${page}`}
                            ref={(el) => {
                              pageRefs.current[index] = el;
                            }}
                            data-page={page}
                            className="flex w-full justify-center"
                          >
                            <Page
                              pageNumber={page}
                              width={pageWidth}
                              scale={zoom}
                              renderTextLayer
                              renderAnnotationLayer
                              className="!bg-white"
                              onRenderError={() => {
                                setDocumentReady(false);
                                setError("Could not render this PDF.");
                              }}
                            />
                          </div>
                        );
                      })
                    : null}
                </Document>
              </div>
            ) : loading ? (
              <p className="text-sm text-zinc-500">Loading document…</p>
            ) : null}
          </div>
        </div>
      </div>

      {shareCopied ? (
        <p className="border-t border-zinc-200 bg-emerald-50/80 px-6 py-2 text-center text-sm font-medium text-emerald-700">
          Link copied to clipboard
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-8 border-t border-zinc-200 bg-white px-6 py-4">
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
