import { describe, expect, it } from "vitest";
import { parseUpdateNotificationSettingsBody } from "@/modules/notifications/notification-settings.validation";

describe("notification-settings.validation", () => {
  it("parses boolean fields", () => {
    const result = parseUpdateNotificationSettingsBody({
      followedAuthors: true,
      followedPapers: false,
    });
    expect(result).toEqual({
      ok: true,
      data: { followedAuthors: true, followedPapers: false },
    });
  });

  it("rejects non-boolean values", () => {
    const result = parseUpdateNotificationSettingsBody({ repliedTo: "yes" });
    expect(result.ok).toBe(false);
  });

  it("requires at least one field", () => {
    const result = parseUpdateNotificationSettingsBody({});
    expect(result.ok).toBe(false);
  });
});
