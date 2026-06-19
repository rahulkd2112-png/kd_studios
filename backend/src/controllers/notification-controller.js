const { sendJson } = require("../lib/http");
const { requireAuth } = require("../middleware/auth");
const { getNotificationsForUser } = require("../services/notification-service");

async function listNotifications(req, res) {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  const notifications = await getNotificationsForUser(auth.user.id);
  sendJson(res, 200, { notifications });
}

module.exports = {
  listNotifications
};
