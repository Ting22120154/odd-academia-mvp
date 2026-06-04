/** Matches Figma Notification Settings toggles + DB notification_settings. */

export type NotificationSettingsResponse = {
  followedAuthors: boolean;
  followedPapers: boolean;
  repliedTo: boolean;
};

export type UpdateNotificationSettingsBody = Partial<NotificationSettingsResponse>;

/** DB defaults when a user has no row yet (schema + Figma). */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsResponse = {
  followedAuthors: true,
  followedPapers: false,
  repliedTo: true,
};
