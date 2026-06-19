const { sendJson } = require("../lib/http");
const config = require("../config");

function health(req, res) {
  sendJson(res, 200, {
    status: "ok",
    app: "kd-studios-backend",
    database: "prisma-postgresql-neon",
    realtime: {
      websocketPath: config.socketPath
    }
  });
}

module.exports = {
  health
};
