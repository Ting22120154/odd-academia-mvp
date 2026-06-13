/** UI labels for work status — must match lib/auth/profile.ts WORK_STATUS_DB keys */
export const WORK_STATUS_OPTIONS = [
  "Employed",
  "Seeking employment",
  "Freelancing",
  "Student",
  "Undisclosed",
] as const;

export const DEFAULT_WORK_STATUS = "Undisclosed" as const;
