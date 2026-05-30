import type { NotificationType } from "@prisma/client";
import type { NotificationDisplayType, NotificationResponse } from "./types";

export type ResolvedNotification = NotificationResponse & {
  groupKey: string;
  rawType: NotificationType;
  paperTitle: string | null;
};

export function groupKeyForRow(
  row: {
    id: string;
    type: NotificationType;
    referenceId: string | null;
    referenceType: string | null;
  },
  commentById: Map<string, { paperId: string; parentId: string | null; isHidden: boolean }>,
): string {
  if (row.type === "reply" && row.referenceType === "comment" && row.referenceId) {
    const comment = commentById.get(row.referenceId);
    if (comment && !comment.isHidden) {
      const anchorId = comment.parentId ?? row.referenceId;
      return `reply:${anchorId}`;
    }
  }

  if (row.type === "comment") {
    if (row.referenceType === "comment" && row.referenceId) {
      const comment = commentById.get(row.referenceId);
      if (comment && !comment.isHidden) return `comment:${comment.paperId}`;
    }
    if (row.referenceType === "paper" && row.referenceId) {
      return `comment:${row.referenceId}`;
    }
  }

  if (row.type === "paper" && row.referenceType === "paper" && row.referenceId) {
    return `paper:${row.referenceId}`;
  }

  if (row.type === "citation" && row.referenceType === "paper" && row.referenceId) {
    return `citation:${row.referenceId}`;
  }

  return `single:${row.id}`;
}

export function groupedText(
  rawType: NotificationType,
  groupCount: number,
  paperTitle: string | null,
  fallbackSingleText: string,
): string {
  if (groupCount <= 1) return fallbackSingleText;

  const title = paperTitle ?? "your paper";

  if (rawType === "reply") {
    const others = groupCount - 1;
    const people = others === 1 ? "person" : "people";
    return `${others} other ${people} replied to your comment on ${title}`;
  }

  if (rawType === "comment") {
    const others = groupCount - 1;
    const people = others === 1 ? "person" : "people";
    return `${others} other ${people} commented on your paper: ${title}`;
  }

  if (rawType === "paper") {
    return `${groupCount} new papers were published`;
  }

  return fallbackSingleText;
}

export function mergeNotificationGroups(items: ResolvedNotification[]): NotificationResponse[] {
  const order: string[] = [];
  const map = new Map<string, ResolvedNotification[]>();

  for (const item of items) {
    if (!map.has(item.groupKey)) order.push(item.groupKey);
    const list = map.get(item.groupKey) ?? [];
    list.push(item);
    map.set(item.groupKey, list);
  }

  return order.map((key) => {
    const members = map.get(key)!;
    const sorted = [...members].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const primary = sorted[0];
    const groupCount = sorted.length;
    const ids = sorted.map((m) => m.id);
    const isRead = sorted.every((m) => m.isRead);

    return {
      id: primary.id,
      ids,
      text: groupedText(primary.rawType, groupCount, primary.paperTitle, primary.text),
      type: primary.type,
      date: primary.date,
      isRead,
      href: primary.href,
      createdAt: primary.createdAt,
      groupCount,
    };
  });
}
