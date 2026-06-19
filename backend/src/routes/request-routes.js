const { createRequest, listMyRequests } = require("../controllers/request-controller");

async function handleRequestRoutes(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

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
