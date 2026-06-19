const { prisma } = require("../lib/prisma");
const { hashPassword } = require("../lib/security");
const config = require("../config");

async function ensureAdminUser() {
  const existingAdmin =
    (await prisma.user.findUnique({
      where: { email: config.admin.email }
    })) ||
    (await prisma.user.findFirst({
      where: { role: "ADMIN" }
    }));

  if (existingAdmin) {
    return prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        name: config.admin.name,
        email: config.admin.email,
        phone: config.admin.phone,
        role: "ADMIN"
      }
    });
  }

  const passwordHash = await hashPassword(config.admin.password);
  return prisma.user.create({
    data: {
      name: config.admin.name,
      email: config.admin.email,
      phone: config.admin.phone,
      passwordHash,
      role: "ADMIN"
    }
  });
}

async function changeAdminPassword(adminUserId, nextPassword) {
  const passwordHash = await hashPassword(nextPassword);
  return prisma.user.update({
    where: { id: adminUserId },
    data: {
      passwordHash
    },
    select: {
      id: true,
      email: true,
      updatedAt: true
    }
  });
}

async function getAdminDashboard() {
  const [userCount, requestCount, blockedUserCount, recentUsers, recentRequests, recentNotifications] = await Promise.all([
    prisma.user.count(),
    prisma.projectRequest.count(),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        createdAt: true
      }
    }),
    prisma.projectRequest.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isBlocked: true
          }
        }
      }
    }),
    prisma.notification.findMany({
      take: 8,
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    stats: {
      userCount,
      requestCount,
      blockedUserCount
    },
    adminContact: {
      email: config.admin.email,
      phone: config.admin.phone
    },
    recentUsers,
    recentRequests,
    recentNotifications
  };
}

async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedReason: true,
      createdAt: true,
      _count: {
        select: {
          requests: true
        }
      }
    }
  });
}

async function setUserBlockedState(userId, isBlocked, blockedReason) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked,
      blockedReason: isBlocked ? blockedReason || "Blocked by admin." : null
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      blockedReason: true
    }
  });
}

async function removeUser(userId) {
  return prisma.user.delete({
    where: { id: userId },
    select: {
      id: true,
      email: true
    }
  });
}

module.exports = {
  ensureAdminUser,
  getAdminDashboard,
  getAllUsers,
  changeAdminPassword,
  setUserBlockedState,
  removeUser
};
