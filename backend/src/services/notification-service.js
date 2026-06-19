const { prisma } = require("../lib/prisma");

async function createNotification({ type, title, message, userId, requestId }) {
  return prisma.notification.create({
    data: {
      type,
      title,
      message,
      userId: userId || null,
      requestId: requestId || null
    }
  });
}

async function getNotificationsForUser(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

async function markNotificationRead(notificationId, userId) {
  return prisma.notification.update({
    where: { id: notificationId, userId },
    data: { isRead: true }
  });
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationRead
};
