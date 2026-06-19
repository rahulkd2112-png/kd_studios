const config = require("../config");

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": res.req?.context?.requestId || "",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cache-Control", "no-store");
  // CSP tuned for the current frontend (fonts + inline styles used by some UI code)
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
  );

  if (config.nodeEnv === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";
  const allowedOrigins = config.frontendOrigin
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowAll = allowedOrigins.includes("*");
  const isAllowed = !origin || allowAll || allowedOrigins.includes(origin);
  if (!isAllowed) {
    return false;
  }
  res.setHeader("Access-Control-Allow-Origin", allowAll ? "*" : origin || allowedOrigins[0]);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Request-Id"
  );
  return true;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 65_536) {
        const error = new Error("Payload too large");
        error.statusCode = 413;
        error.publicMessage = "Request body is too large.";
        reject(error);
        req.destroy();
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function notFound(res) {
  sendJson(res, 404, { error: "Route not found." });
}

module.exports = {
  sendJson,
  setSecurityHeaders,
  setCorsHeaders,
  parseJsonBody,
  notFound
};
