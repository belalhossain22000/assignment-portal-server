// Notification.service: Module file for the Notification.service functionality.
//Get notifications by user ID with filtering and pagination

import prisma from "../../../shared/prisma";
import { NotificationFilters } from "./Notification.interface";

//Get notifications by user ID with filtering (no pagination)
const getNotificationsByUserId = async (
  userId: string,
  options: NotificationFilters = {}
) => {
  const {
    limit = 50,
    isRead = null,
    type = null,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = options;

  // Build where clause
  const whereClause: any = { userId };

  if (isRead !== null) {
    whereClause.isRead = isRead;
  }

  if (type) {
    whereClause.type = type;
  }

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            deadline: true,
          },
        },
        submission: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
          },
        },
      },
    }),
    prisma.notification.count({
      where: whereClause,
    }),
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),
  ]);

  return {
    totalCount,
    unreadCount,
    readCount: totalCount - unreadCount,
    notifications,
  };
};

export const NotificationService = {
  getNotificationsByUserId,
};
