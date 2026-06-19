const crypto = require("crypto");
const config = require("../config");

function attachRequestContext(req, res) {
  req.context = {
    requestId: req.headers["x-request-id"] || crypto.randomUUID(),
    startedAt: Date.now(),
    ipAddress:
      (config.trustProxy
        ? req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
        : "") ||
      req.socket.remoteAddress ||
      "unknown"
  };

  res.req = req;
  res.setHeader("X-Request-Id", req.context.requestId);
}

module.exports = {
  attachRequestContext
};
