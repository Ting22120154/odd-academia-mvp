import type { UpdateNotificationSettingsBody } from "./notification-settings.types";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

function readBool(value: unknown, field: string): ParseResult<boolean> {
  if (typeof value !== "boolean") {
    return { ok: false, error: `${field} must be a boolean` };
  }
  return { ok: true, data: value };
}

export function parseUpdateNotificationSettingsBody(
  raw: unknown,
): ParseResult<UpdateNotificationSettingsBody> {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }

  const body = raw as Record<string, unknown>;
  const data: UpdateNotificationSettingsBody = {};

  if ("followedAuthors" in body) {
    const parsed = readBool(body.followedAuthors, "followedAuthors");
    if (!parsed.ok) return parsed;
    data.followedAuthors = parsed.data;
  }
  if ("followedPapers" in body) {
    const parsed = readBool(body.followedPapers, "followedPapers");
    if (!parsed.ok) return parsed;
    data.followedPapers = parsed.data;
  }
  if ("repliedTo" in body) {
    const parsed = readBool(body.repliedTo, "repliedTo");
    if (!parsed.ok) return parsed;
    data.repliedTo = parsed.data;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "At least one setting field is required" };
  }

  return { ok: true, data };
}
