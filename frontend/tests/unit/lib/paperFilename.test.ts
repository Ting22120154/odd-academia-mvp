import { describe, expect, it } from "vitest";
import {
  paperDownloadFilename,
  paperUploadPaths,
  sanitizePaperTitle,
} from "@/lib/files/paperFilename";

describe("paperFilename", () => {
  it("sanitizes unsafe characters", () => {
    expect(sanitizePaperTitle('Bad/name?')).toBe("Badname");
  });

  it("builds download filename with pdf extension", () => {
    expect(paperDownloadFilename("My Paper")).toBe("My Paper.pdf");
    expect(paperDownloadFilename("Already.pdf")).toBe("Already.pdf");
  });

  it("builds upload paths", () => {
    const paths = paperUploadPaths("My Paper", "paper-id", ".pdf");
    expect(paths.fileUrl).toBe("/uploads/paper-id/My Paper.pdf");
    expect(paths.diskName).toBe("My Paper.pdf");
  });
});
