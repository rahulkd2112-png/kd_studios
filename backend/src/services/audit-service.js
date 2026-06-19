const { prisma } = require("../lib/prisma");

async function logAuditEvent({
  action,
  entityType,
  entityId,
  description,
  metadata,
  actorId,
  targetUserId,
  ipAddress
}) {
  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId: entityId || null,
      description,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      actorId: actorId || null,
      targetUserId: targetUserId || null,
      ipAddress: ipAddress || null
    }
  });
}

async function getRecentAuditLogs(limit = 20) {
  return prisma.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: { id: true, name: true, email: true }
      },
      targetUser: {
        select: { id: true, name: true, email: true }
      }
    }
  });
}

module.exports = {
  logAuditEvent,
  getRecentAuditLogs
};
