import { prisma } from "@/lib/prisma";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettingsResponse,
  type UpdateNotificationSettingsBody,
} from "./notification-settings.types";

function toResponse(row: {
  followedAuthors: boolean;
  followedPapers: boolean;
  repliedTo: boolean;
}): NotificationSettingsResponse {
  return {
    followedAuthors: row.followedAuthors ?? DEFAULT_NOTIFICATION_SETTINGS.followedAuthors,
    followedPapers: row.followedPapers ?? DEFAULT_NOTIFICATION_SETTINGS.followedPapers,
    repliedTo: row.repliedTo ?? DEFAULT_NOTIFICATION_SETTINGS.repliedTo,
  };
}

const CREATE_DEFAULTS = DEFAULT_NOTIFICATION_SETTINGS;

export async function getNotificationSettings(
  userId: string,
): Promise<NotificationSettingsResponse> {
  const row = await prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId, ...CREATE_DEFAULTS },
    update: {},
    select: {
      followedAuthors: true,
      followedPapers: true,
      repliedTo: true,
    },
  });
  return toResponse(row);
}

export async function updateNotificationSettings(
  userId: string,
  patch: UpdateNotificationSettingsBody,
): Promise<NotificationSettingsResponse> {
  const row = await prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...CREATE_DEFAULTS,
      ...patch,
    },
    update: patch,
    select: {
      followedAuthors: true,
      followedPapers: true,
      repliedTo: true,
    },
  });
  return toResponse(row);
}
