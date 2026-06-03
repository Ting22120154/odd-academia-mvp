import { prisma } from "@/lib/prisma";
import type {
  NotificationSettingsResponse,
  UpdateNotificationSettingsBody,
} from "./notification-settings.types";

function toResponse(row: {
  followedAuthors: boolean;
  followedPapers: boolean;
  repliedTo: boolean;
}): NotificationSettingsResponse {
  return {
    followedAuthors: row.followedAuthors,
    followedPapers: row.followedPapers,
    repliedTo: row.repliedTo,
  };
}

export async function getNotificationSettings(
  userId: string,
): Promise<NotificationSettingsResponse> {
  const row = await prisma.notificationSettings.upsert({
    where: { userId },
    create: { userId },
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
