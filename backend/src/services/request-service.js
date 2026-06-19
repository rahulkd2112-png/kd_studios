const { prisma } = require("../lib/prisma");
const { sanitizeText } = require("../lib/validation");

function serializeRequest(record) {
  return {
    id: record.id,
    projectType: record.projectType,
    budget: record.budget,
    timeline: record.timeline,
    details: record.details,
    status: record.status,
    quoteAmount: record.quoteAmount,
    adminNotes: record.adminNotes,
    repliedAt: record.repliedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    user: record.user
      ? {
          id: record.user.id,
          name: record.user.name,
          email: record.user.email,
          phone: record.user.phone
        }
      : undefined
  };
}

async function createRequestForUser(userId, payload) {
  const projectType = sanitizeText(payload.projectType, 120);
  const budget = sanitizeText(payload.budget, 80);
  const timeline = sanitizeText(payload.timeline, 80);
  const details = sanitizeText(payload.details, 2000);

  const request = await prisma.projectRequest.create({
    data: {
      projectType,
      budget: budget || null,
      timeline: timeline || null,
      details,
      userId
    },
    include: {
      user: true
    }
  });

  return serializeRequest(request);
}

async function getRequestsForUser(userId) {
  const records = await prisma.projectRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  return records.map(serializeRequest);
}

async function getAllRequests() {
  const records = await prisma.projectRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  return records.map(serializeRequest);
}

async function updateRequestByAdmin(requestId, payload) {
  const status = sanitizeText(payload.status, 40);
  const quoteAmount = sanitizeText(payload.quoteAmount, 120);
  const adminNotes = sanitizeText(payload.adminNotes, 1200);
  const lastReplyById = sanitizeText(payload.lastReplyById, 80);

  const request = await prisma.projectRequest.update({
    where: { id: requestId },
    data: {
      status: status || undefined,
      quoteAmount: quoteAmount || null,
      adminNotes: adminNotes || null,
      repliedAt: adminNotes ? new Date() : undefined,
      lastReplyById: lastReplyById || null
    },
    include: { user: true }
  });

  return serializeRequest(request);
}

module.exports = {
  createRequestForUser,
  getRequestsForUser,
  getAllRequests,
  updateRequestByAdmin
};
