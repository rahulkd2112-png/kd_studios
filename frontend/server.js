const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const LOGO_DIR = path.join(__dirname, "logo");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
"Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
"Content-Security-Policy":
      "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://esm.sh 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss: http://localhost:4000 ws://localhost:4000; worker-src 'self' blob:; frame-src 'none'"
  };
}

function serveFile(req, res) {
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400, {
      ...getSecurityHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify({ error: "Invalid request path." }));
    return;
  }

  const pagePath = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(pagePath).replace(/^(\.\.[\/\\])+/, "");
  const isLogoAsset = safePath.startsWith("\\logo\\") || safePath.startsWith("/logo/");
  const relativeSafePath = safePath.replace(/^[/\\]+/, "");
  const baseDir = isLogoAsset ? __dirname : PUBLIC_DIR;
  const allowedRoot = isLogoAsset ? LOGO_DIR : PUBLIC_DIR;
  const filePath = path.resolve(baseDir, relativeSafePath);
  const resolvedAllowedRoot = path.resolve(allowedRoot);

  if (filePath !== resolvedAllowedRoot && !filePath.startsWith(`${resolvedAllowedRoot}${path.sep}`)) {
    res.writeHead(403, {
      ...getSecurityHeaders(),
      "Content-Type": "application/json; charset=utf-8"
    });
    res.end(JSON.stringify({ error: "Forbidden" }));
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallbackContent) => {
          if (fallbackError) {
            res.writeHead(500, {
              ...getSecurityHeaders(),
              "Content-Type": "application/json; charset=utf-8"
            });
            res.end(JSON.stringify({ error: "Unable to load the frontend." }));
            return;
          }

          res.writeHead(200, {
            ...getSecurityHeaders(),
            "Cache-Control": "no-cache",
            "Content-Type": MIME_TYPES[".html"]
          });
          res.end(fallbackContent);
        });
        return;
      }

      res.writeHead(500, {
        ...getSecurityHeaders(),
        "Content-Type": "application/json; charset=utf-8"
      });
      res.end(JSON.stringify({ error: "Unable to load the requested file." }));
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const noCacheExtensions = new Set([".html", ".js", ".css", ".json"]);
    res.writeHead(200, {
      ...getSecurityHeaders(),
      "Cache-Control": noCacheExtensions.has(extension) ? "no-cache" : "public, max-age=3600",
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
    });
    res.end(content);
  });
}

http
  .createServer((req, res) => {
    serveFile(req, res);
  })
  .listen(PORT, () => {
    console.log(`KD Studios frontend is running at http://localhost:${PORT}`);
  });
