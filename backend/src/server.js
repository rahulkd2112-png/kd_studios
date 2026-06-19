const http = require("http");
const config = require("./config");
const { prisma } = require("./lib/prisma");
const { sendJson, setSecurityHeaders, setCorsHeaders, notFound } = require("./lib/http");
const { handleAuthRoutes } = require("./routes/auth-routes");
const { handleRequestRoutes } = require("./routes/request-routes");
const { handleAdminRoutes } = require("./routes/admin-routes");
const { handleNotificationRoutes } = require("./routes/notification-routes");
const { handleSystemRoutes } = require("./routes/system-routes");
const { ensureAdminUser } = require("./services/admin-service");
const { initRealtimeServer } = require("./services/realtime-service");
const { attachRequestContext } = require("./middleware/request-context");
const { applyRateLimit } = require("./middleware/rate-limit");
const { handleRouteError } = require("./middleware/error-handler");

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
    errors.push("EMAIL_USER and EMAIL_PASS are required");
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
  await prisma.$connect();
  const now = new Date();
  const retentionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
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
  await ensureAdminUser();

  const server = http.createServer((req, res) => {
    routeRequest(req, res).catch((error) => handleRouteError(req, res, error));
  });

  initRealtimeServer(server);

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
