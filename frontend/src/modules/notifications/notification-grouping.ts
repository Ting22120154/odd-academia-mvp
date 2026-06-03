import type { NotificationType } from "@prisma/client";
import type { NotificationResponse } from "./types";

type RowForGroup = {
  id: string;
  type: NotificationType;
  referenceId: string | null;
  referenceType: string | null;
};

const READ_PAGE_SIZE = 5;

export { READ_PAGE_SIZE };

function resolvePaperId(
  row: RowForGroup,
  commentMap: Map<string, string>,
): string | null {
  if (!row.referenceId) return null;
  if (row.referenceType === "paper") return row.referenceId;
  if (row.referenceType === "comment") return commentMap.get(row.referenceId) ?? null;
  return null;
}

function buildGroupKey(row: RowForGroup, commentMap: Map<string, string>): string | null {
  if (row.type !== "comment" && row.type !== "reply") return null;
  const paperId = resolvePaperId(row, commentMap);
  if (!paperId) return null;
  return `${row.type}|${paperId}`;
}

/** Collapse same-type comment/reply on one paper into one row (newest first). */
export function groupNotifications(
  items: Array<{ response: NotificationResponse; row: RowForGroup }>,
  paperMap: Map<string, string>,
  commentMap: Map<string, string>,
): NotificationResponse[] {
  const result: NotificationResponse[] = [];
  const used = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const { response, row } = items[i];
    if (used.has(response.id)) continue;

    const key = buildGroupKey(row, commentMap);
    if (!key) {
      result.push(response);
      continue;
    }

    const members = items.filter(
      ({ row: r }) => buildGroupKey(r, commentMap) === key,
    );
    for (const m of members) used.add(m.response.id);

    if (members.length === 1) {
      result.push(response);
      continue;
    }

    const primary = members[0].response;
    const paperId = resolvePaperId(members[0].row, commentMap)!;
    const title = paperMap.get(paperId) ?? "your paper";
    const count = members.length;
    const others = count - 1;

    let text = primary.text;
    if (members[0].row.type === "reply") {
      text =
        others === 1
          ? `1 other person replied to your comment on ${title}`
          : `${others} others replied to your comment on ${title}`;
    } else if (members[0].row.type === "comment") {
      text = `${count} new comments on your paper: ${title}`;
    }

    result.push({
      ...primary,
      text,
      groupCount: count,
      groupedIds: members.map((m) => m.response.id),
    });
  }

  return result;
}
