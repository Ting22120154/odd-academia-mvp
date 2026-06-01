"use client";

import Link from "next/link";
import { EmbeddedPdfViewer } from "@/app/paper/_components/EmbeddedPdfViewer";
import { linkHover } from "@/lib/ui/interactive";

type Props = {
  paperId: string;
  title: string;
  summary: string;
  fileSrc: string;
  downloadFilename: string;
};

export function PaperDocumentViewClient({
  paperId,
  title,
  summary,
  fileSrc,
  downloadFilename,
}: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto w-full max-w-[var(--page-max)] px-6 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link
            href={`/paper/${paperId}`}
            className={`inline-flex min-w-0 max-w-full items-center gap-2 rounded-lg py-1 pr-2 text-sm font-medium text-zinc-800 ${linkHover}`}
          >
            <span className="shrink-0 text-zinc-600" aria-hidden>
              ←
            </span>
            <span className="truncate">{title}</span>
          </Link>
        </div>
        <EmbeddedPdfViewer
          fileSrc={fileSrc}
          title={title}
          summary={summary}
          downloadFilename={downloadFilename}
        />
      </div>
    </div>
  );
}
