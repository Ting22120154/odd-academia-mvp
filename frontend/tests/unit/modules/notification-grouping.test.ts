import { describe, expect, it } from "vitest";
import { groupNotifications } from "@/modules/notifications/notification-grouping";
import type { NotificationResponse } from "@/modules/notifications/types";

const PAPER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COMMENT_ID = "660e8400-e29b-41d4-a716-446655440001";

function notif(id: string, text: string): NotificationResponse {
  return {
    id,
    type: "Comment",
    text,
    date: "Today",
    isRead: false,
    href: "/notifications",
    createdAt: new Date().toISOString(),
  };
}

describe("groupNotifications", () => {
  it("groups multiple comments on the same paper", () => {
    const items = [
      {
        response: notif("n1", "Alice commented"),
        row: { id: "n1", type: "comment" as const, referenceId: PAPER_ID, referenceType: "paper" },
      },
      {
        response: notif("n2", "Bob commented"),
        row: { id: "n2", type: "comment" as const, referenceId: PAPER_ID, referenceType: "paper" },
      },
    ];
    const grouped = groupNotifications(items, new Map([[PAPER_ID, "My Paper"]]), new Map());
    expect(grouped).toHaveLength(1);
    expect(grouped[0].groupCount).toBe(2);
    expect(grouped[0].text).toContain("2 new comments");
  });

  it("leaves unrelated notifications ungrouped", () => {
    const items = [
      {
        response: notif("n1", "Followed you"),
        row: { id: "n1", type: "follow" as const, referenceId: null, referenceType: null },
      },
    ];
    const grouped = groupNotifications(items, new Map(), new Map());
    expect(grouped).toHaveLength(1);
    expect(grouped[0].groupCount).toBeUndefined();
  });

  it("resolves comment reference to paper for replies", () => {
    const items = [
      {
        response: notif("n1", "Reply"),
        row: { id: "n1", type: "reply" as const, referenceId: COMMENT_ID, referenceType: "comment" },
      },
    ];
    const grouped = groupNotifications(
      items,
      new Map([[PAPER_ID, "Paper Title"]]),
      new Map([[COMMENT_ID, PAPER_ID]]),
    );
    expect(grouped).toHaveLength(1);
  });
});
