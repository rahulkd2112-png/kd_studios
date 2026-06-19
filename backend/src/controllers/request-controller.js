const { sendJson, parseJsonBody } = require("../lib/http");
const { requireFields } = require("../lib/validation");
const { requireAuth } = require("../middleware/auth");
const { prisma } = require("../lib/prisma");
const { createRequestForUser, getRequestsForUser } = require("../services/request-service");
const { createNotification } = require("../services/notification-service");
const { logAuditEvent } = require("../services/audit-service");
const { broadcast } = require("../services/realtime-service");

async function createRequest(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }
  if (auth.user.role === "ADMIN") {
    sendJson(res, 403, { error: "Admin accounts cannot submit client requests." });
    return;
  }

  const body = await parseJsonBody(req);
  const missing = requireFields(["projectType", "details"], body);

  if (missing.length) {
    sendJson(res, 400, { error: `Missing required fields: ${missing.join(", ")}` });
    return;
  }

  const request = await createRequestForUser(auth.user.id, body);
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (adminUser) {
    await createNotification({
      type: "request.created",
      title: "New client request",
      message: `${auth.user.name} submitted a new project request.`,
      userId: adminUser.id,
      requestId: request.id
    });
  }

  await logAuditEvent({
    action: "request.created",
    entityType: "ProjectRequest",
    entityId: request.id,
    description: `Request ${request.id} created by ${auth.user.email}.`,
    actorId: auth.user.id,
    targetUserId: auth.user.id,
    ipAddress: req.context.ipAddress
  });

  broadcast("request.created");

  sendJson(res, 201, {
    message: "Project request submitted successfully.",
    request
  });
}

async function listMyRequests(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  const requests = await getRequestsForUser(auth.user.id);
  sendJson(res, 200, { requests });
}

module.exports = {
  createRequest,
  listMyRequests
};
