/** API + UI shapes for notifications (Person 3). */

export type NotificationDisplayType =
  | "Paper"
  | "Comment"
  | "Reply"
  | "Message"
  | "Follow"
  | "Citation";

export type NotificationTab = "new" | "all" | "papers" | "comments" | "contact" | "citations";

export type NotificationSortKey = "type" | "date";
export type NotificationSortDir = "asc" | "desc";

export type NotificationResponse = {
  id: string;
  /** All notification row ids merged into this group (for mark-read). */
  ids: string[];
  text: string;
  type: NotificationDisplayType;
  date: string;
  isRead: boolean;
  href: string;
  createdAt: string;
  groupCount: number;
};

export type ListNotificationsQuery = {
  tab: NotificationTab;
  sort: NotificationSortKey;
  dir: NotificationSortDir;
  /** Read notifications cap on the New tab (default 5). */
  oldLimit: number;
};

export type ListNotificationsResult = {
  notifications: NotificationResponse[];
  newNotifications: NotificationResponse[];
  oldNotifications: NotificationResponse[];
  oldTotal: number;
  unreadCount: number;
};
