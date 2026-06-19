const WebSocket = require("ws");
const config = require("../config");

let webSocketServer;

function initRealtimeServer(server) {
  webSocketServer = new WebSocket.Server({
    server,
    path: config.socketPath,
    maxPayload: 4096,
    verifyClient: ({ origin }) => {
      const allowedOrigins = config.frontendOrigin
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
    }
  });

  webSocketServer.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "system.connected",
        message: "KD Studios realtime channel connected."
      })
    );
  });
}

function broadcast(event) {
  if (!webSocketServer) {
    return;
  }

  const message = JSON.stringify({ event, timestamp: new Date().toISOString() });
  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  initRealtimeServer,
  broadcast
};
