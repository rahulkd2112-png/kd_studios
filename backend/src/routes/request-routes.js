const { createRequest, listMyRequests } = require("../controllers/request-controller");
const { getApiPathname } = require("../lib/http");

async function handleRequestRoutes(req, res) {
  const pathname = getApiPathname(req);

  if (req.method === "POST" && pathname === "/api/requests") {
    await createRequest(req, res);
    return true;
  }

  if (req.method === "GET" && pathname === "/api/requests/my") {
    await listMyRequests(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleRequestRoutes
};
