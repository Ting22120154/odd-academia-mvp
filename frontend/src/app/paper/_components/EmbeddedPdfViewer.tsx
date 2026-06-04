"use client";

import dynamic from "next/dynamic";
import type { PdfViewerCoreProps } from "@/app/paper/_components/PdfViewerCore";

function ViewerLoading() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[var(--shadow-sm)]">
      <div className="border-b border-zinc-200 px-5 py-3.5 text-sm text-zinc-500">
        Loading document viewer…
      </div>
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Preparing PDF…</p>
      </div>
    </div>
  );
}

/** Client-only PDF viewer — avoids SSR DOMMatrix errors from pdf.js */
const PdfViewerCore = dynamic(() => import("@/app/paper/_components/PdfViewerCore"), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

export type EmbeddedPdfViewerProps = PdfViewerCoreProps;

export function EmbeddedPdfViewer(props: EmbeddedPdfViewerProps) {
  return <PdfViewerCore {...props} />;
}
