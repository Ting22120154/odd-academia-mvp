import { describe, expect, it } from "vitest";
import {
  groupKeyForRow,
  groupedText,
  mergeNotificationGroups,
  type ResolvedNotification,
} from "@/modules/notifications/notification-grouping";

const PAPER_ID = "550e8400-e29b-41d4-a716-446655440000";
const COMMENT_ID = "660e8400-e29b-41d4-a716-446655440001";

function resolved(
  id: string,
  overrides: Partial<ResolvedNotification> = {},
): ResolvedNotification {
  return {
    id,
    ids: [id],
    text: "Single notification",
    type: "Comment",
    date: "Today",
    isRead: false,
    href: "/notifications",
    createdAt: "2026-01-02T00:00:00.000Z",
    groupCount: 1,
    groupKey: `single:${id}`,
    rawType: "comment",
    paperTitle: null,
    ...overrides,
  };
}

describe("groupKeyForRow", () => {
  it("groups comments on the same paper", () => {
    const key = groupKeyForRow(
      { id: "n1", type: "comment", referenceId: PAPER_ID, referenceType: "paper" },
      new Map(),
    );
    expect(key).toBe(`comment:${PAPER_ID}`);
  });

  it("groups replies under the same anchor comment", () => {
    const key = groupKeyForRow(
      { id: "n1", type: "reply", referenceId: COMMENT_ID, referenceType: "comment" },
      new Map([[COMMENT_ID, { paperId: PAPER_ID, parentId: null, isHidden: false }]]),
    );
    expect(key).toBe(`reply:${COMMENT_ID}`);
  });

  it("falls back to single key for follow notifications", () => {
    const key = groupKeyForRow(
      { id: "n9", type: "follow", referenceId: null, referenceType: null },
      new Map(),
    );
    expect(key).toBe("single:n9");
  });
});

describe("groupedText", () => {
  it("returns fallback for single items", () => {
    expect(groupedText("comment", 1, "Paper", "Alice commented")).toBe("Alice commented");
  });

  it("pluralizes grouped comments", () => {
    const text = groupedText("comment", 3, "My Paper", "ignored");
    expect(text).toContain("2 other people");
    expect(text).toContain("My Paper");
  });
});

describe("mergeNotificationGroups", () => {
  it("merges notifications with the same group key", () => {
    const key = `comment:${PAPER_ID}`;
    const merged = mergeNotificationGroups([
      resolved("n1", { groupKey: key, createdAt: "2026-01-02T00:00:00.000Z", paperTitle: "Paper" }),
      resolved("n2", { groupKey: key, createdAt: "2026-01-01T00:00:00.000Z", paperTitle: "Paper" }),
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].groupCount).toBe(2);
    expect(merged[0].ids).toEqual(["n1", "n2"]);
  });
});
