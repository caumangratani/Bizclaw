#!/usr/bin/env node
/**
 * BizClaw Multi-Tenant Router
 *
 * Single entry point for ALL clients on one domain (claw.bizgenix.ai).
 * Routes requests to the correct client backend based on gateway token.
 *
 * Flow:
 *   1. Client visits https://claw.bizgenix.ai/?token=abc123
 *   2. Router looks up token → port from token registry
 *   3. Sets a cookie so subsequent requests (assets, WebSocket) route correctly
 *   4. Proxies everything to the right backend port
 *
 * Usage: node scripts/router.js
 * Runs on port 18800 by default (ROUTER_PORT env var to override)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { createProxyServer } = (() => {
  try {
    return require("http-proxy");
  } catch {
    console.error("Missing dependency: npm install -g http-proxy");
    console.error("Or: cd /opt/bizclaw && npm install http-proxy");
    process.exit(1);
  }
})();

const ROUTER_PORT = Number(process.env.ROUTER_PORT) || 18800;
const CLIENTS_DIR = process.env.CLIENTS_DIR || path.join(__dirname, "..", "clients");
const COOKIE_NAME = "__bc_route";
const COOKIE_MAX_AGE = 86400 * 30; // 30 days

// ── Token Registry ──────────────────────────────────────────────
// Maps gateway tokens → { port, clientId }
let tokenMap = new Map();

function loadTokenRegistry() {
  const newMap = new Map();
  let dirs;
  try {
    dirs = fs.readdirSync(CLIENTS_DIR, { withFileTypes: true });
  } catch (err) {
    console.error(`Cannot read clients dir: ${CLIENTS_DIR}`, err.message);
    return;
  }

  for (const entry of dirs) {
    if (!entry.isDirectory() || entry.name === "TEMPLATE") continue;
    const envFile = path.join(CLIENTS_DIR, entry.name, ".env");
    if (!fs.existsSync(envFile)) continue;

    const envContent = fs.readFileSync(envFile, "utf8");
    let port = null;
    let token = null;

    for (const line of envContent.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      const value = rest.join("=").trim();
      if (key.trim() === "BIZCLAW_PORT") port = Number(value);
      if (key.trim() === "GATEWAY_TOKEN") token = value;
    }

    if (port && token) {
      newMap.set(token, { port, clientId: entry.name });
    }
  }

  tokenMap = newMap;
  console.log(`[router] Loaded ${tokenMap.size} client(s): ${[...tokenMap.values()].map(v => `${v.clientId}:${v.port}`).join(", ")}`);
}

// Reload registry every 30 seconds (picks up new clients)
loadTokenRegistry();
setInterval(loadTokenRegistry, 30000);

// Also reload on SIGHUP (manual trigger: kill -HUP <pid>)
process.on("SIGHUP", () => {
  console.log("[router] SIGHUP received, reloading token registry...");
  loadTokenRegistry();
});

// ── Proxy Server ────────────────────────────────────────────────
const proxy = createProxyServer({
  ws: true,
  xfwd: true,
  changeOrigin: true,
});

proxy.on("error", (err, req, res) => {
  console.error(`[router] Proxy error: ${err.message}`);
  if (res && res.writeHead) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("BizClaw: Service temporarily unavailable. Please try again.");
  }
});

// ── Helper: extract token ───────────────────────────────────────
function getToken(req) {
  // 1. From URL query param
  const url = new URL(req.url, `http://${req.headers.host}`);
  const urlToken = url.searchParams.get("token");
  if (urlToken && tokenMap.has(urlToken)) return urlToken;

  // 2. From cookie (for subsequent requests without ?token)
  const cookies = (req.headers.cookie || "").split(";").reduce((acc, c) => {
    const [k, ...v] = c.trim().split("=");
    if (k) acc[k] = v.join("=");
    return acc;
  }, {});
  const cookieToken = cookies[COOKIE_NAME];
  if (cookieToken && tokenMap.has(cookieToken)) return cookieToken;

  return null;
}

// ── HTTP Server ─────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const token = getToken(req);

  if (!token) {
    // No valid token — show a simple landing or redirect
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html><head><title>BizClaw</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#1a1a2e;color:#fff}
.box{text-align:center;padding:2rem}h1{font-size:2.5rem;margin:0}p{color:#888;margin-top:0.5rem}</style>
</head><body><div class="box">
<h1>⚡ BizClaw</h1>
<p>AI Business Assistant by Bizgenix</p>
<p style="color:#555;font-size:0.8rem;margin-top:2rem">Access your dashboard using the URL provided by your administrator.</p>
</div></body></html>`);
    return;
  }

  const { port, clientId } = tokenMap.get(token);

  // Set routing cookie so assets/WebSocket route to same backend
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`);

  proxy.web(req, res, { target: `http://127.0.0.1:${port}` });
});

// ── WebSocket Upgrade ───────────────────────────────────────────
server.on("upgrade", (req, socket, head) => {
  const token = getToken(req);

  if (!token) {
    socket.destroy();
    return;
  }

  const { port } = tokenMap.get(token);
  proxy.ws(req, socket, head, { target: `http://127.0.0.1:${port}` });
});

// ── Start ───────────────────────────────────────────────────────
server.listen(ROUTER_PORT, "127.0.0.1", () => {
  console.log(`[router] BizClaw multi-tenant router listening on 127.0.0.1:${ROUTER_PORT}`);
  console.log(`[router] Clients dir: ${CLIENTS_DIR}`);
  console.log(`[router] ${tokenMap.size} client(s) registered`);
});
