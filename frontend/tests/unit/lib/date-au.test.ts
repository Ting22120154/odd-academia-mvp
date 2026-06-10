import { describe, expect, it } from "vitest";
import {
  formatDateAU,
  formatDateLongAU,
  formatDateRangeAU,
  formatDateTimeAU,
  formatTimeAU,
} from "@odd-academia/db/date";

describe("Australian date formatting", () => {
  const sample = new Date("2025-01-29T04:30:00.000Z");

  it("formats short dates as DD/MM/YYYY", () => {
    expect(formatDateAU(sample)).toMatch(/29\/01\/2025/);
  });

  it("formats long dates with month name", () => {
    expect(formatDateLongAU(sample)).toMatch(/29 January 2025/);
  });

  it("formats date-time in en-AU", () => {
    expect(formatDateTimeAU(sample)).toMatch(/29\/01\/2025/);
  });

  it("formats time in en-AU", () => {
    expect(formatTimeAU(sample)).toMatch(/pm|am/i);
  });

  it("formats date ranges", () => {
    const from = new Date("2025-01-29T00:00:00.000Z");
    const to = new Date("2025-02-05T00:00:00.000Z");
    expect(formatDateRangeAU(from, to)).toBe("29/01/2025–05/02/2025");
  });

  it("returns fallback for invalid input", () => {
    expect(formatDateAU("not-a-date")).toBe("—");
    expect(formatDateAU("not-a-date", "N/A")).toBe("N/A");
  });
});
