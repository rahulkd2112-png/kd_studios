const config = require("../config");
const { sendJson } = require("../lib/http");

const store = new Map();

function getPolicy(req) {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (
    pathname === "/api/auth/login" ||
    pathname.startsWith("/api/auth/admin/") ||
    pathname.endsWith("/otp/verify") ||
    pathname === "/api/auth/password-reset/confirm"
  ) {
    return { bucket: pathname, max: 10, windowMs: 15 * 60 * 1000 };
  }
  if (
    pathname === "/api/auth/register" ||
    pathname.endsWith("/otp/request") ||
    pathname === "/api/auth/password-reset/request"
  ) {
    return { bucket: pathname, max: 5, windowMs: 15 * 60 * 1000 };
  }
  return {
    bucket: pathname.split("/").slice(0, 3).join("/"),
    max: config.rateLimitMaxRequests,
    windowMs: config.rateLimitWindowMs
  };
}

function applyRateLimit(req, res) {
  const policy = getPolicy(req);
  const key = `${req.context.ipAddress}:${policy.bucket}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.windowStart > policy.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return true;
  }

  existing.count += 1;
  if (existing.count > policy.max) {
    const retryAfter = Math.ceil((policy.windowMs - (now - existing.windowStart)) / 1000);
    sendJson(
      res,
      429,
      { error: "Too many requests. Please try again later." },
      { "Retry-After": String(Math.max(retryAfter, 1)) }
    );
    return false;
  }

  return true;
}

module.exports = {
  applyRateLimit
};
