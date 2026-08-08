const { listNotifications } = require("../controllers/notification-controller");
const { getApiPathname } = require("../lib/http");

async function handleNotificationRoutes(req, res) {
  const pathname = getApiPathname(req);

  if (req.method === "GET" && pathname === "/api/notifications") {
    await listNotifications(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleNotificationRoutes
};
