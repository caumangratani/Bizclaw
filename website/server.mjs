import http from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Lightweight JSON body parser for API routes
async function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

async function sendFile(res, filePath) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
    });
    createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/healthz") {
    sendJson(res, 200, { ok: true, service: "bizclaw-ai-website" });
    return;
  }

  // ── Lead Capture API ──────────────────────────────────────────────────────
  if (pathname === "/api/lead" && req.method === "POST") {
    try {
      const body = await parseJson(req);
      const lead = {
        id: `lead_${Date.now()}`,
        createdAt: new Date().toISOString(),
        name: String(body.name || "").trim(),
        business: String(body.business || "").trim(),
        phone: String(body.phone || "").trim(),
        email: String(body.email || "").trim(),
        employeeCount: String(body.employeeCount || "").trim(),
        monthlyRevenue: String(body.monthlyRevenue || "").trim(),
        message: String(body.message || "").trim()
      };

      // Save to leads.json
      const leadsPath = path.join(__dirname, "leads.json");
      let leads = [];
      try {
        const raw = await fs.readFile(leadsPath, "utf8");
        leads = JSON.parse(raw);
      } catch {
        leads = [];
      }
      leads.unshift(lead);
      await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2), "utf8");

      console.log(`[lead] New lead captured: ${lead.name} (${lead.phone}) — ${lead.business}`);

      sendJson(res, 200, {
        ok: true,
        message: "Thank you! Our team will reach out within 24 hours.",
        leadId: lead.id
      });
    } catch (err) {
      console.error("[lead] Error:", err.message);
      sendJson(res, 500, { error: "Failed to capture lead. Please try again." });
    }
    return;
  }

  if (pathname === "/") {
    await sendFile(res, path.join(__dirname, "index.html"));
    return;
  }

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const safePath = path.normalize(path.join(__dirname, pathname));
  if (!safePath.startsWith(__dirname)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  if (existsSync(safePath)) {
    await sendFile(res, safePath);
    return;
  }

  await sendFile(res, path.join(__dirname, "index.html"));
});

server.listen(port, host, () => {
  console.log(`BizClaw AI website running at http://${host}:${port}`);
});
