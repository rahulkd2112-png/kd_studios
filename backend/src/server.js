const http = require("http");
const config = require("./config");
const { prisma } = require("./lib/prisma");
const { sendJson, setSecurityHeaders, setCorsHeaders, notFound } = require("./lib/http");
const { handleAuthRoutes } = require("./routes/auth-routes");
const { handleRequestRoutes } = require("./routes/request-routes");
const { handleAdminRoutes } = require("./routes/admin-routes");
const { handleAppPageRoutes } = require("./routes/app-page-routes");
const { handleNotificationRoutes } = require("./routes/notification-routes");
const { handleSystemRoutes } = require("./routes/system-routes");
const { ensureAdminUser } = require("./services/admin-service");
const { ensureDefaultAppPages } = require("./services/app-page-service");
const { initRealtimeServer } = require("./services/realtime-service");
const { attachRequestContext } = require("./middleware/request-context");
const { applyRateLimit } = require("./middleware/rate-limit");
const { handleRouteError } = require("./middleware/error-handler");
const { runtimeState } = require("./lib/runtime-state");

function validateProductionConfig() {
  if (config.nodeEnv !== "production") {
    return;
  }

  const errors = [];
  if (!process.env.JWT_SECRET || config.jwtSecret.length < 32) {
    errors.push("JWT_SECRET must be a random value of at least 32 characters");
  }
  if (!process.env.ADMIN_PASSWORD || config.admin.password.length < 12) {
    errors.push("ADMIN_PASSWORD must be at least 12 characters");
  }
  if (!process.env.ADMIN_EMAIL) {
    errors.push("ADMIN_EMAIL is required");
  }
  if (!config.frontendOrigin || config.frontendOrigin === "*") {
    errors.push("FRONTEND_ORIGIN must be the exact production frontend origin");
  }
  if (!config.emailUser || !config.emailPass) {
    console.warn("Production email credentials are not configured; continuing without SMTP delivery.");
  }

  if (errors.length) {
    throw new Error(`Invalid production configuration: ${errors.join("; ")}.`);
  }
}

async function routeRequest(req, res) {
  attachRequestContext(req, res);
  setSecurityHeaders(res);
  if (!setCorsHeaders(req, res)) {
    sendJson(res, 403, { error: "Origin not allowed." });
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (!applyRateLimit(req, res)) {
    return;
  }

  if (await handleSystemRoutes(req, res)) {
    return;
  }

  if (await handleAuthRoutes(req, res)) {
    return;
  }

  if (await handleAppPageRoutes(req, res)) {
    return;
  }

  if (await handleRequestRoutes(req, res)) {
    return;
  }

  if (await handleNotificationRoutes(req, res)) {
    return;
  }

  if (await handleAdminRoutes(req, res)) {
    return;
  }

  notFound(res);
}

async function start() {
  validateProductionConfig();
  try {
    await prisma.$connect();
    runtimeState.databaseReady = true;
    runtimeState.databaseError = null;
  } catch (error) {
    runtimeState.databaseReady = false;
    runtimeState.databaseError = error;
    console.warn("Database connection failed during startup; continuing to serve health and CORS routes.", error);
  }

  const now = new Date();
  const retentionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (runtimeState.databaseReady) {
    try {
      await prisma.$transaction([
        prisma.session.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { revokedAt: { not: null }, createdAt: { lt: retentionCutoff } }
            ]
          }
        }),
        prisma.registrationOtp.deleteMany({
          where: {
            OR: [{ expiresAt: { lt: now } }, { consumedAt: { lt: retentionCutoff } }]
          }
        }),
        prisma.passwordResetOtp.deleteMany({
          where: {
            OR: [{ expiresAt: { lt: now } }, { consumedAt: { lt: retentionCutoff } }]
          }
        }),
        prisma.adminOtp.deleteMany({
          where: {
            OR: [{ expiresAt: { lt: now } }, { consumedAt: { lt: retentionCutoff } }]
          }
        })
      ]);
    } catch (error) {
      console.warn("Initial Prisma cleanup failed; continuing startup.", error);
    }
  }

  try {
    await ensureAdminUser();
    await ensureDefaultAppPages();
  } catch (error) {
    console.warn("Initial admin/app page bootstrap failed; continuing startup.", error);
  }

  const server = http.createServer((req, res) => {
    routeRequest(req, res).catch((error) => handleRouteError(req, res, error));
  });

  initRealtimeServer(server);

  runtimeState.startupComplete = true;

  server.listen(config.port, () => {
    console.log(`KD Studios backend is running at http://localhost:${config.port}`);
    console.log(`KD Studios WebSocket is available at ws://localhost:${config.port}${config.socketPath}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start backend", error);
  await prisma.$disconnect();
  process.exit(1);
});
