/** Australian date/time display helpers (en-AU, Australia/Sydney). */

export const AU_LOCALE = "en-AU" as const;
export const AU_TIME_ZONE = "Australia/Sydney";

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: AU_TIME_ZONE,
};

const DATE_LONG_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: AU_TIME_ZONE,
};

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTS,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: AU_TIME_ZONE,
};

export function parseDateInput(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** DD/MM/YYYY — e.g. 29/01/2025 */
export function formatDateAU(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const d = parseDateInput(value);
  if (!d) return fallback;
  return d.toLocaleDateString(AU_LOCALE, DATE_OPTS);
}

/** 29 January 2025 */
export function formatDateLongAU(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const d = parseDateInput(value);
  if (!d) return fallback;
  return d.toLocaleDateString(AU_LOCALE, DATE_LONG_OPTS);
}

/** DD/MM/YYYY, h:mm am/pm — e.g. 29/01/2025, 3:45 pm */
export function formatDateTimeAU(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const d = parseDateInput(value);
  if (!d) return fallback;
  return d.toLocaleString(AU_LOCALE, DATE_TIME_OPTS);
}

/** h:mm am/pm */
export function formatTimeAU(
  value: string | Date | null | undefined,
  fallback = "—",
): string {
  const d = parseDateInput(value);
  if (!d) return fallback;
  return d.toLocaleTimeString(AU_LOCALE, TIME_OPTS);
}

/** 29/01/2025–05/02/2025 */
export function formatDateRangeAU(from: Date, to: Date): string {
  return `${formatDateAU(from)}–${formatDateAU(to)}`;
}
