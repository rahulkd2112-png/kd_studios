const { sendJson, parseJsonBody } = require("../lib/http");
const { requireAdmin } = require("../middleware/auth");
const {
  listPublishedAppPages,
  getPublishedAppPage,
  listAllAppPages,
  getAppPageById,
  createAppPage,
  updateAppPage,
  deleteAppPage
} = require("../services/app-page-service");
const { logAuditEvent } = require("../services/audit-service");

async function listPublicApps(req, res) {
  const apps = await listPublishedAppPages();
  sendJson(res, 200, { apps });
}

async function getPublicApp(req, res, slug) {
  const app = await getPublishedAppPage(slug);
  if (!app) {
    sendJson(res, 404, { error: "App landing page not found." });
    return;
  }
  sendJson(res, 200, { app });
}

async function listAdminApps(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const apps = await listAllAppPages();
  sendJson(res, 200, { apps });
}

async function getAdminApp(req, res, id) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const app = await getAppPageById(id);
  if (!app) {
    sendJson(res, 404, { error: "App landing page not found." });
    return;
  }
  sendJson(res, 200, { app });
}

async function createAdminApp(req, res) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const body = await parseJsonBody(req);
  try {
    const app = await createAppPage(body);
    await logAuditEvent({
      action: "app_page.created",
      entityType: "AppLandingPage",
      entityId: app.id,
      description: `Admin created app landing page ${app.title}.`,
      actorId: auth.user.id,
      ipAddress: req.context.ipAddress
    });
    sendJson(res, 201, { message: "App landing page created.", app });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function updateAdminApp(req, res, id) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const body = await parseJsonBody(req);
  try {
    const app = await updateAppPage(id, body);
    await logAuditEvent({
      action: "app_page.updated",
      entityType: "AppLandingPage",
      entityId: app.id,
      description: `Admin updated app landing page ${app.title}.`,
      actorId: auth.user.id,
      ipAddress: req.context.ipAddress
    });
    sendJson(res, 200, { message: "App landing page updated.", app });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

async function deleteAdminApp(req, res, id) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const app = await deleteAppPage(id);
    await logAuditEvent({
      action: "app_page.deleted",
      entityType: "AppLandingPage",
      entityId: app.id,
      description: `Admin deleted app landing page ${app.title}.`,
      actorId: auth.user.id,
      ipAddress: req.context.ipAddress
    });
    sendJson(res, 200, { message: "App landing page deleted.", app });
  } catch {
    sendJson(res, 404, { error: "App landing page not found." });
  }
}

module.exports = {
  listPublicApps,
  getPublicApp,
  listAdminApps,
  getAdminApp,
  createAdminApp,
  updateAdminApp,
  deleteAdminApp
};
