const { listNotifications } = require("../controllers/notification-controller");

async function handleNotificationRoutes(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (req.method === "GET" && pathname === "/api/notifications") {
    await listNotifications(req, res);
    return true;
  }

  return false;
}

module.exports = {
  handleNotificationRoutes
};
