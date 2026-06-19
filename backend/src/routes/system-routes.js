const { health } = require("../controllers/system-controller");

async function handleSystemRoutes(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (req.method === "GET" && pathname === "/api/health") {
    health(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleSystemRoutes
};
