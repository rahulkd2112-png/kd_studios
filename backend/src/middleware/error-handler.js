const { sendJson } = require("../lib/http");

function handleRouteError(req, res, error) {
  console.error(`[${req.context?.requestId || "unknown"}]`, error);
  sendJson(res, error.statusCode || 500, {
    error: error.publicMessage || "Internal server error."
  });
}

module.exports = {
  handleRouteError
};
