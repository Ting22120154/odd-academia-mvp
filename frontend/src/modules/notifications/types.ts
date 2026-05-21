/** API + UI shapes for notifications (Person 3). */

export type NotificationDisplayType = "Paper" | "Comment" | "Reply" | "Contact" | "Citation";

export type NotificationTab = "new" | "all" | "papers" | "comments" | "contact" | "citations";

export type NotificationSortKey = "type" | "date";
export type NotificationSortDir = "asc" | "desc";

export type NotificationResponse = {
  id: string;
  text: string;
  type: NotificationDisplayType;
  date: string;
  isRead: boolean;
  href: string;
  createdAt: string;
};

export type ListNotificationsQuery = {
  tab: NotificationTab;
  sort: NotificationSortKey;
  dir: NotificationSortDir;
};
