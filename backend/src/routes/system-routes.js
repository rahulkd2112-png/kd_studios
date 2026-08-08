const { health } = require("../controllers/system-controller");
const { getApiPathname } = require("../lib/http");

async function handleSystemRoutes(req, res) {
  const pathname = getApiPathname(req);

  if (req.method === "GET" && pathname === "/api/health") {
    health(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleSystemRoutes
};
