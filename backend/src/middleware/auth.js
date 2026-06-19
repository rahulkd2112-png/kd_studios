const { authenticateRequest } = require("../services/auth-service");
const { sendJson } = require("../lib/http");

async function requireAuth(req, res) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      sendJson(res, 401, { error: "Authentication required." });
      return null;
    }

    return auth;
  } catch (error) {
    sendJson(res, 401, { error: "Invalid or expired token." });
    return null;
  }
}

async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return null;
  }

  if (auth.user.role !== "ADMIN") {
    sendJson(res, 403, { error: "Admin access required." });
    return null;
  }

  return auth;
}

module.exports = {
  requireAuth,
  requireAdmin
};
