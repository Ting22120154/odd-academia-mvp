import { describe, expect, it } from "vitest";
import {
  parseListNotificationsQuery,
  parseNotificationIdParam,
} from "@/modules/notifications/notification.validation";

describe("notification.validation", () => {
  it("parses list query defaults", () => {
    const result = parseListNotificationsQuery(new URLSearchParams());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tab).toBe("all");
      expect(result.data.sort).toBe("date");
      expect(result.data.dir).toBe("desc");
      expect(result.data.oldLimit).toBe(5);
    }
  });

  it("clamps oldLimit to 100", () => {
    const result = parseListNotificationsQuery(new URLSearchParams("oldLimit=500"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.oldLimit).toBe(100);
  });

  it("validates notification id param", () => {
    expect(parseNotificationIdParam("550e8400-e29b-41d4-a716-446655440000").ok).toBe(true);
    expect(parseNotificationIdParam("bad").ok).toBe(false);
  });
});
