const { sendJson, parseJsonBody } = require("../lib/http");
const { requireAdmin } = require("../middleware/auth");
const {
  getAdminDashboard,
  getAllUsers,
  changeAdminPassword,
  setUserBlockedState,
  removeUser
} = require("../services/admin-service");
const { getAllRequests, updateRequestByAdmin } = require("../services/request-service");
const { verifyPassword } = require("../lib/security");
const { createNotification } = require("../services/notification-service");
const { logAuditEvent, getRecentAuditLogs } = require("../services/audit-service");
const { broadcast } = require("../services/realtime-service");
const { prisma } = require("../lib/prisma");

async function getDashboard(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const dashboard = await getAdminDashboard();
  const logs = await getRecentAuditLogs(20);
  sendJson(res, 200, {
    ...dashboard,
    auditLogs: logs
  });
}

async function listUsers(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const users = await getAllUsers();
  sendJson(res, 200, { users });
}

async function listRequests(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const requests = await getAllRequests();
  sendJson(res, 200, { requests });
}

async function updateRequest(req, res, requestId) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const body = await parseJsonBody(req);
  const request = await updateRequestByAdmin(requestId, {
    ...body,
    lastReplyById: auth.user.id
  });

  await createNotification({
    type: "request.updated",
    title: "Project request updated",
    message: `Your request for ${request.projectType} has a new admin reply.`,
    userId: request.user?.id,
    requestId: request.id
  });

  await logAuditEvent({
    action: "request.updated_by_admin",
    entityType: "ProjectRequest",
    entityId: request.id,
    description: `Admin updated request ${request.id}.`,
    actorId: auth.user.id,
    targetUserId: request.user?.id,
    ipAddress: req.context.ipAddress
  });

  broadcast("request.updated");

  sendJson(res, 200, {
    message: "Request updated successfully.",
    request
  });
}

async function changePassword(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const body = await parseJsonBody(req);
  const currentPassword = String(body.currentPassword || "");
  const nextPassword = String(body.newPassword || "");

  if (!currentPassword || !nextPassword) {
    sendJson(res, 400, { error: "Current password and new password are required." });
    return;
  }

  if (nextPassword.length < 12 || nextPassword.length > 128) {
    sendJson(res, 400, { error: "New password must be between 12 and 128 characters." });
    return;
  }

  const passwordOk = await verifyPassword(currentPassword, auth.userRecord.passwordHash);
  if (!passwordOk) {
    sendJson(res, 403, { error: "Current admin password is incorrect." });
    return;
  }

  await changeAdminPassword(auth.user.id, nextPassword);
  await prisma.session.updateMany({
    where: {
      userId: auth.user.id,
      tokenId: { not: auth.session.tokenId },
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
  await logAuditEvent({
    action: "admin.password_changed",
    entityType: "User",
    entityId: auth.user.id,
    description: "Admin changed account password.",
    actorId: auth.user.id,
    ipAddress: req.context.ipAddress
  });
  sendJson(res, 200, { message: "Admin password updated successfully." });
}

async function blockUser(req, res, userId) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const body = await parseJsonBody(req);
  const user = await setUserBlockedState(userId, true, body.reason);
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  await logAuditEvent({
    action: "user.blocked",
    entityType: "User",
    entityId: user.id,
    description: `Admin blocked user ${user.email}.`,
    actorId: auth.user.id,
    targetUserId: user.id,
    ipAddress: req.context.ipAddress
  });
  broadcast("user.blocked");
  sendJson(res, 200, { message: "User blocked successfully.", user });
}

async function unblockUser(req, res, userId) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  const user = await setUserBlockedState(userId, false, null);

  await logAuditEvent({
    action: "user.unblocked",
    entityType: "User",
    entityId: user.id,
    description: `Admin unblocked user ${user.email}.`,
    actorId: auth.user.id,
    targetUserId: user.id,
    ipAddress: req.context.ipAddress
  });
  broadcast("user.unblocked");
  sendJson(res, 200, { message: "User unblocked successfully.", user });
}

async function deleteUser(req, res, userId) {
  const auth = await requireAdmin(req, res);
  if (!auth) {
    return;
  }

  if (userId === auth.user.id) {
    sendJson(res, 400, { error: "Admin cannot remove their own account." });
    return;
  }

  await logAuditEvent({
    action: "user.removed",
    entityType: "User",
    entityId: userId,
    description: `Admin removed user ${userId}.`,
    actorId: auth.user.id,
    ipAddress: req.context.ipAddress
  });
  const removed = await removeUser(userId);
  broadcast("user.removed");
  sendJson(res, 200, { message: "User removed successfully.", user: removed });
}

module.exports = {
  getDashboard,
  listUsers,
  listRequests,
  updateRequest,
  changePassword,
  blockUser,
  unblockUser,
  deleteUser
};
