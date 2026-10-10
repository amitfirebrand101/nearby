// Local-only preview. Uses the real waitlist adapter; no fake successful signups.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const handler = require("../api/waitlist.js");
const publicFiles = new Set(["index.html", "styles.css", "app.js"]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
};
const server = http.createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.url.split("?")[0] === "/api/waitlist") {
    let body = "",
      oversized = false;
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 12000) {
        oversized = true;
        break;
      }
    }
    req.body = oversized ? null : body;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    try {
      await handler(req, res);
    } catch {
      res.statusCode = 500;
      res.end('{"error":"Preview request failed."}');
    }
    return;
  }
  let relative;
  try {
    relative =
      decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(
        /^\/+/,
        "",
      ) || "index.html";
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = path.resolve(root, relative);
  if (
    !file.startsWith(root + path.sep) ||
    (!publicFiles.has(relative) && !/^assets\/[a-z0-9.-]+$/.test(relative)) ||
    !fs.existsSync(file)
  ) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  fs.createReadStream(file).pipe(res);
});
server.listen(4173, "127.0.0.1", () =>
  console.log("Local: http://127.0.0.1:4173"),
);
process.on("SIGINT", () => server.close(() => process.exit(0)));
