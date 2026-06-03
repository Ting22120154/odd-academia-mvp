/** Matches Figma Notification Settings toggles + DB notification_settings. */

export type NotificationSettingsResponse = {
  followedAuthors: boolean;
  followedPapers: boolean;
  repliedTo: boolean;
};

export type UpdateNotificationSettingsBody = Partial<NotificationSettingsResponse>;
