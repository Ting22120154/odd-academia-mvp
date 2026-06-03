import type { DateRange } from "@/components/DateRangePicker";

/** Parse ISO or DD/MM/YYYY or DD.MM.YYYY into a Date (local midnight). */
export function parseLooseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const d = new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const dot = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) {
    const d = new Date(Number(dot[3]), Number(dot[2]) - 1, Number(dot[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isDateInRange(date: Date, range: DateRange): boolean {
  const t = date.getTime();
  return t >= range.from.getTime() && t <= range.to.getTime();
}

export function isIsoInRange(iso: string, range: DateRange): boolean {
  const d = parseLooseDate(iso);
  return d ? isDateInRange(d, range) : false;
}

export function isPublishedInRange(published: string, range: DateRange): boolean {
  const d = parseLooseDate(published);
  return d ? isDateInRange(d, range) : true;
}
