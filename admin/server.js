const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const approvalQueue = require("./approval-queue");

const app = express();
const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const configPath = path.join(rootDir, "config.json");

const sessions = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/assets", express.static(path.join(publicDir, "assets")));

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadConfig() {
  const config = await readJson(configPath, {});
  return {
    port: config.port ?? 18800,
    bind: config.bind ?? "127.0.0.1",
    adminPasswordHash: config.adminPasswordHash ?? "",
    sessionHours: config.sessionHours ?? 24,
    sessionCookieName: config.sessionCookieName ?? "bizclaw_admin_session",
    clientsDir: path.resolve(rootDir, config.clientsDir ?? "../clients"),
    backupsDir: path.resolve(rootDir, config.backupsDir ?? "../backups")
  };
}

function parseEnv(raw) {
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function readAuthProfileStore(filePath) {
  const store = await readJson(filePath, null);
  const profiles =
    store && typeof store === "object" && store.profiles && typeof store.profiles === "object"
      ? store.profiles
      : {};
  const entries = Object.entries(profiles).filter(([, value]) => value && typeof value === "object");

  return {
    filePath,
    exists: Boolean(store),
    profileCount: entries.length,
    profileIds: entries.map(([profileId]) => profileId),
    providers: unique(entries.map(([, value]) => value.provider))
  };
}

async function readClientConfig(clientDir) {
  return readJson(path.join(clientDir, "data", "openclaw.json"), {});
}

function resolveDefaultAgentId(config) {
  const agents =
    config && typeof config === "object" && config.agents && Array.isArray(config.agents.list)
      ? config.agents.list
      : [];
  return agents.find((agent) => agent && agent.default)?.id || agents[0]?.id || "main";
}

async function resolveAgentRoots(clientDir) {
  const roots = [
    path.join(clientDir, "data", "agents"),
    path.join(clientDir, "data", ".openclaw", "agents")
  ];
  const result = [];
  for (const root of roots) {
    if (await pathExists(root)) result.push(root);
  }
  return result;
}

async function readSessionSummary(filePath, sessionKey) {
  const store = await readJson(filePath, {});
  const session = store && typeof store === "object" ? store[sessionKey] : null;
  if (!session || typeof session !== "object") {
    return {
      exists: false,
      sessionKey,
      updatedAt: null,
      lastChannel: null,
      authProfileOverride: null,
      lastTo: null
    };
  }

  return {
    exists: true,
    sessionKey,
    updatedAt: session.updatedAt || null,
    lastChannel: session.lastChannel || session.deliveryContext?.channel || null,
    authProfileOverride: session.authProfileOverride || null,
    lastTo: session.lastTo || session.deliveryContext?.to || null
  };
}

async function getWhatsAppLinkSummary(clientDir) {
  const candidates = [
    path.join(clientDir, "data", "credentials", "whatsapp", "default"),
    path.join(clientDir, "data", ".openclaw", "credentials", "whatsapp", "default"),
    path.join(clientDir, "data", "credentials", "whatsapp")
  ];

  for (const candidate of candidates) {
    try {
      const entries = await fs.readdir(candidate);
      const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
      if (jsonFiles.length > 0 || entries.includes("creds.json")) {
        return {
          linked: true,
          path: candidate,
          fileCount: jsonFiles.length || entries.length
        };
      }
    } catch {
      // Ignore missing directories.
    }
  }

  return {
    linked: false,
    path: null,
    fileCount: 0
  };
}

async function getClientReadiness(clientDir, env, health) {
  const config = await readClientConfig(clientDir);
  const defaultAgentId = resolveDefaultAgentId(config);
  const agentRoots = await resolveAgentRoots(clientDir);

  let defaultAuth = {
    filePath: null,
    exists: false,
    profileCount: 0,
    profileIds: [],
    providers: []
  };
  let mainAuth = {
    filePath: null,
    exists: false,
    profileCount: 0,
    profileIds: [],
    providers: []
  };
  let session = {
    exists: false,
    sessionKey: `agent:${defaultAgentId}:main`,
    updatedAt: null,
    lastChannel: null,
    authProfileOverride: null,
    lastTo: null
  };

  for (const root of agentRoots) {
    if (!defaultAuth.exists) {
      const target = path.join(root, defaultAgentId, "agent", "auth-profiles.json");
      defaultAuth = await readAuthProfileStore(target);
    }

    if (!mainAuth.exists) {
      const target = path.join(root, "main", "agent", "auth-profiles.json");
      mainAuth = await readAuthProfileStore(target);
    }

    if (!session.exists) {
      const sessionPath = path.join(root, defaultAgentId, "sessions", "sessions.json");
      session = await readSessionSummary(sessionPath, `agent:${defaultAgentId}:main`);
    }
  }

  const whatsapp = await getWhatsAppLinkSummary(clientDir);
  const tokenConfigured = Boolean(env.GATEWAY_TOKEN);
  const modelAuthReady = defaultAuth.profileCount > 0 && mainAuth.profileCount > 0;
  const blockers = [];

  if (!tokenConfigured) blockers.push("Gateway token missing");
  if (health.status !== "UP") blockers.push("Gateway is not reachable");
  if (defaultAuth.profileCount === 0) blockers.push(`No model auth on ${defaultAgentId}`);
  if (mainAuth.profileCount === 0) blockers.push("No model auth on fallback main agent");
  if (!whatsapp.linked) blockers.push("WhatsApp is not linked");

  return {
    status: blockers.length === 0 ? "READY" : health.status === "UP" ? "SETUP_NEEDED" : "OFFLINE",
    blockers,
    checks: {
      gateway: health.status === "UP",
      token: tokenConfigured,
      defaultAgentAuth: defaultAuth.profileCount > 0,
      mainAgentAuth: mainAuth.profileCount > 0,
      whatsappLinked: whatsapp.linked
    },
    defaultAgentId,
    session,
    auth: {
      defaultAgent: defaultAuth,
      mainAgent: mainAuth,
      providers: unique([...defaultAuth.providers, ...mainAuth.providers])
    },
    whatsapp
  };
}

function getSession(req, config) {
  const token = req.cookies?.[config.sessionCookieName];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function authRequired(isApi = false) {
  return async (req, res, next) => {
    const config = await loadConfig();
    const session = getSession(req, config);

    if (!session) {
      if (isApi) {
        res.status(401).json({ error: "Authentication required." });
        return;
      }

      res.redirect("/login");
      return;
    }

    req.adminSession = session;
    req.runtimeConfig = config;
    next();
  };
}

async function getBackupInfo(config, clientId) {
  const clientBackupDir = path.join(config.backupsDir, clientId);
  try {
    const files = await fs.readdir(clientBackupDir);
    const backups = files.filter((file) => file.endsWith(".tar.gz")).sort().reverse();
    if (backups.length === 0) {
      return { latestBackup: null, backupCount: 0 };
    }

    const latestFile = path.join(clientBackupDir, backups[0]);
    const latestStats = await fs.stat(latestFile);
    return {
      latestBackup: latestStats.mtime.toISOString(),
      backupCount: backups.length
    };
  } catch {
    return { latestBackup: null, backupCount: 0 };
  }
}

async function getGatewayStatus(port) {
  if (!port) return { status: "NOT_CONFIGURED", httpCode: null };

  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, {
      signal: AbortSignal.timeout(1500)
    });
    if (response.status === 200 || response.status === 401) {
      return { status: "UP", httpCode: response.status };
    }

    return { status: "DEGRADED", httpCode: response.status };
  } catch {
    return { status: "DOWN", httpCode: null };
  }
}

async function listClients(config) {
  let entries = [];
  try {
    entries = await fs.readdir(config.clientsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const billing = await readJson(path.join(dataDir, "billing.json"), {});
  const notes = await readJson(path.join(dataDir, "client-notes.json"), {});

  const clients = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name !== "TEMPLATE")
      .map(async (entry) => {
        const clientId = entry.name;
        const clientDir = path.join(config.clientsDir, clientId);
        const metadata = await readJson(path.join(clientDir, "config.json"), { clientId });
        const envRaw = await fs.readFile(path.join(clientDir, ".env"), "utf8").catch(() => "");
        const env = parseEnv(envRaw);
        const port = env.BIZCLAW_PORT || "";
        const health = await getGatewayStatus(port);
        const backupInfo = await getBackupInfo(config, clientId);
        const readiness = await getClientReadiness(clientDir, env, health);

        return {
          clientId,
          clientName: metadata.clientName || clientId,
          businessType: metadata.businessType || "General Business",
          createdAt: metadata.createdAt || null,
          phone: metadata.phone || "",
          email: metadata.email || "",
          city: metadata.city || "",
          state: metadata.state || "",
          employeeCount: metadata.employeeCount || "",
          revenueRange: metadata.revenueRange || "",
          primaryContact: metadata.primaryContact || "",
          port,
          gatewayTokenConfigured: Boolean(env.GATEWAY_TOKEN),
          apiKeysConfigured: {
            google: Boolean(env.GOOGLE_API_KEY),
            openai: Boolean(env.OPENAI_API_KEY),
            anthropic: Boolean(env.ANTHROPIC_API_KEY)
          },
          health,
          readiness,
          billing: billing[clientId] || null,
          notePreview: typeof notes[clientId] === "string" ? notes[clientId].slice(0, 120) : "",
          backupInfo
        };
      })
  );

  return clients.sort((a, b) => (a.clientName || "").localeCompare(b.clientName || ""));
}

async function findClient(config, clientId) {
  const clients = await listClients(config);
  return clients.find((client) => client.clientId === clientId) || null;
}

async function ensureFiles() {
  await fs.mkdir(path.join(dataDir, "soul-history"), { recursive: true });
  await writeJson(path.join(dataDir, "billing.json"), await readJson(path.join(dataDir, "billing.json"), {}));
  await writeJson(
    path.join(dataDir, "client-notes.json"),
    await readJson(path.join(dataDir, "client-notes.json"), {})
  );
}

app.get("/healthz", async (_req, res) => {
  const config = await loadConfig();
  res.json({ ok: true, port: config.port, bind: config.bind });
});

app.get("/login", async (_req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

app.post("/api/login", async (req, res) => {
  const config = await loadConfig();
  const password = String(req.body?.password ?? "");

  if (!config.adminPasswordHash) {
    res.status(503).json({
      error:
        "Admin password hash is empty. Set admin.config.json -> adminPasswordHash before using the panel."
    });
    return;
  }

  const ok = await bcrypt.compare(password, config.adminPasswordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid password." });
    return;
  }

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + config.sessionHours * 60 * 60 * 1000;
  sessions.set(token, { createdAt: Date.now(), expiresAt });

  res.cookie(config.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: config.sessionHours * 60 * 60 * 1000
  });

  res.json({ ok: true });
});

app.post("/api/logout", authRequired(true), async (req, res) => {
  sessions.delete(req.adminSession.token);
  res.clearCookie(req.runtimeConfig.sessionCookieName);
  res.json({ ok: true });
});

app.get("/", authRequired(false), async (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/client/:id", authRequired(false), async (_req, res) => {
  res.sendFile(path.join(publicDir, "client.html"));
});

app.get("/approvals", authRequired(false), async (_req, res) => {
  res.sendFile(path.join(publicDir, "approvals.html"));
});

app.get("/api/me", authRequired(true), async (_req, res) => {
  res.json({ ok: true, name: "Bizgenix Admin" });
});

app.get("/api/clients", authRequired(true), async (req, res) => {
  const clients = await listClients(req.runtimeConfig);
  res.json({ clients });
});

app.get("/api/clients/:id", authRequired(true), async (req, res) => {
  const client = await findClient(req.runtimeConfig, req.params.id);
  if (!client) {
    res.status(404).json({ error: "Client not found." });
    return;
  }

  const notes = await readJson(path.join(dataDir, "client-notes.json"), {});
  res.json({
    client,
    notes: notes[req.params.id] || ""
  });
});

app.get("/api/clients/:id/notes", authRequired(true), async (req, res) => {
  const notes = await readJson(path.join(dataDir, "client-notes.json"), {});
  res.json({ notes: notes[req.params.id] || "" });
});

app.put("/api/clients/:id/notes", authRequired(true), async (req, res) => {
  const notes = await readJson(path.join(dataDir, "client-notes.json"), {});
  notes[req.params.id] = String(req.body?.notes ?? "");
  await writeJson(path.join(dataDir, "client-notes.json"), notes);
  res.json({ ok: true });
});

app.get("/api/billing", authRequired(true), async (_req, res) => {
  const billing = await readJson(path.join(dataDir, "billing.json"), {});
  res.json({ billing });
});

app.put("/api/billing/:id", authRequired(true), async (req, res) => {
  const billing = await readJson(path.join(dataDir, "billing.json"), {});
  billing[req.params.id] = {
    plan: String(req.body?.plan ?? ""),
    setupFeeInr: Number(req.body?.setupFeeInr ?? 0) || 0,
    monthlyFeeInr: Number(req.body?.monthlyFeeInr ?? 0) || 0,
    paymentStatus: String(req.body?.paymentStatus ?? "PENDING"),
    nextDueAt: String(req.body?.nextDueAt ?? ""),
    notes: String(req.body?.notes ?? ""),
    updatedAt: new Date().toISOString()
  };
  await writeJson(path.join(dataDir, "billing.json"), billing);
  res.json({ ok: true, billing: billing[req.params.id] });
});

app.get("/api/security", authRequired(true), async (req, res) => {
  const clients = await listClients(req.runtimeConfig);
  const summary = {
    totalClients: clients.length,
    healthyClients: clients.filter((client) => client.health.status === "UP").length,
    readyClients: clients.filter((client) => client.readiness.status === "READY").length,
    whatsappLinkedClients: clients.filter((client) => client.readiness.checks.whatsappLinked).length,
    missingGatewayTokens: clients.filter((client) => !client.gatewayTokenConfigured).length,
    missingAnyApiKey: clients.filter(
      (client) =>
        !client.apiKeysConfigured.google &&
        !client.apiKeysConfigured.openai &&
        !client.apiKeysConfigured.anthropic
    ).length
  };

  res.json({ summary, clients });
});

// Approval Queue API
app.get("/api/approvals", authRequired(true), async (req, res) => {
  const clientId = req.query.clientId || null;
  res.json({ pending: approvalQueue.getPending(clientId) });
});

app.get("/api/approvals/history", authRequired(true), async (req, res) => {
  const clientId = req.query.clientId || null;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({ history: approvalQueue.getHistory(clientId, limit) });
});

app.get("/api/approvals/unread-count", authRequired(true), async (_req, res) => {
  res.json({ count: approvalQueue.getUnreadCount() });
});

app.post("/api/approvals/enqueue", async (req, res) => {
  // Internal endpoint for agents - no auth required from localhost
  const { clientId, action, details, requestedBy, risk, policyRule } = req.body || {};
  if (!action) {
    res.status(400).json({ error: "action is required" });
    return;
  }
  const item = approvalQueue.enqueue({ clientId, action, details, requestedBy, risk, policyRule });
  res.json({ ok: true, approval: item });
});

app.post("/api/approvals/:id/approve", authRequired(true), async (req, res) => {
  const approver = req.adminSession?.name || "operator";
  const item = approvalQueue.approve(req.params.id, approver);
  if (!item) {
    res.status(404).json({ error: "Approval not found or already resolved." });
    return;
  }
  res.json({ ok: true, approval: item });
});

app.post("/api/approvals/:id/deny", authRequired(true), async (req, res) => {
  const approver = req.adminSession?.name || "operator";
  const reason = String(req.body?.reason || "").trim() || null;
  const item = approvalQueue.deny(req.params.id, approver, reason);
  if (!item) {
    res.status(404).json({ error: "Approval not found or already resolved." });
    return;
  }
  res.json({ ok: true, approval: item });
});

app.use(authRequired(false), express.static(publicDir));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

async function main() {
  await ensureFiles();
  const config = await loadConfig();
  app.listen(config.port, config.bind, () => {
    console.log(
      `Bizgenix Admin Panel running at http://${config.bind}:${config.port}`
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
