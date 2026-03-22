const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const approvalQueue = require("./approval-queue");
const {
  PLANS,
  createSetupCheckout,
  createSubscriptionCheckout,
  handleWebhook,
  getStripe
} = require("./stripe-billing");

const app = express();
const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const configPath = path.join(rootDir, "config.json");

const sessions = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Stripe Billing Routes ─────────────────────────────────────────────────

// Webhook must be registered BEFORE express.json() consumes the raw body
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["stripe-signature"];
  try {
    const result = await handleWebhook(req.body, signature);
    console.log("[stripe] Webhook handled:", result);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("[stripe] Webhook error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/billing/plans", authRequired(true), async (_req, res) => {
  res.json({ plans: PLANS });
});

app.post("/api/billing/checkout", authRequired(true), async (req, res) => {
  const { clientId, plan: planId, type = "setup" } = req.body || {};
  if (!clientId || !planId) {
    res.status(400).json({ error: "clientId and plan are required" });
    return;
  }
  if (!PLANS[planId]) {
    res.status(400).json({ error: `Unknown plan: ${planId}` });
    return;
  }
  const base = ADMIN_BASE_URL;
  const successUrl = `${base}/?checkout=success&plan=${planId}`;
  const cancelUrl = `${base}/?checkout=cancelled`;
  try {
    const session =
      type === "subscription"
        ? await createSubscriptionCheckout(clientId, planId, successUrl, cancelUrl)
        : await createSetupCheckout(clientId, planId, successUrl, cancelUrl);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[stripe] Checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/billing/status/:clientId", authRequired(true), async (req, res) => {
  const s = getStripe();
  if (!s) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  try {
    const customer = await s.customers.list({
      limit: 1,
      metadata: { bizclaw_client_id: req.params.clientId }
    });
    if (!customer.data[0]) {
      res.json({ found: false });
      return;
    }
    const subs = await s.subscriptions.list({ customer: customer.data[0].id, limit: 1 });
    const sub = subs.data[0];
    res.json({
      found: true,
      customerId: customer.data[0].id,
      subscriptionId: sub?.id || null,
      status: sub?.status || null,
      currentPeriodEnd: sub ? new Date(sub.current_period_end * 1000).toISOString() : null
    });
  } catch (err) {
    console.error("[stripe] Status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
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
  const envPasswordHash = String(process.env.BIZCLAW_ADMIN_PASSWORD_HASH || "").trim();
  return {
    port: config.port ?? 18800,
    bind: config.bind ?? "127.0.0.1",
    adminPasswordHash: envPasswordHash || (config.adminPasswordHash ?? ""),
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
  res.json({ ok: true });
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
        "Admin password hash is empty. Set BIZCLAW_ADMIN_PASSWORD_HASH before using the panel."
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

// ── Client Portal Auth & Routes ────────────────────────────────────────────────

// Load or generate portal token for a client
async function loadClientPortalToken(clientId, config) {
  const tokenPath = path.join(config.clientsDir, clientId, "data", ".portal-token");
  try {
    return (await fs.readFile(tokenPath, "utf8")).trim();
  } catch {
    const token = crypto.randomBytes(24).toString("hex");
    await fs.writeFile(tokenPath, token);
    return token;
  }
}

// Portal middleware - authenticate client by session token
async function portalAuth(req, res, next) {
  const token = req.cookies?.client_token || req.headers["x-client-token"];
  const clientId = clientTokens.get(token);
  if (!clientId) {
    res.redirect("/portal-login");
    return;
  }
  req.clientId = clientId;
  next();
}

// Client portal pages (no admin auth required)
app.get("/portal-login", (_req, res) => {
  res.sendFile(path.join(publicDir, "portal-login.html"));
});

app.get("/portal", portalAuth, (_req, res) => {
  res.sendFile(path.join(publicDir, "portal.html"));
});

// Portal login API
app.post("/api/portal/login", async (req, res) => {
  const { clientId, token } = req.body || {};
  if (!clientId || !token) {
    res.status(400).json({ error: "clientId and token are required" });
    return;
  }

  const config = await loadConfig();
  const expectedToken = await loadClientPortalToken(clientId, config);
  if (token !== expectedToken) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const sessionToken = crypto.randomBytes(24).toString("hex");
  clientTokens.set(sessionToken, clientId);
  res.cookie("client_token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.json({ ok: true, clientId });
});

// Portal logout
app.post("/api/portal/logout", portalAuth, (req, res) => {
  const token = req.cookies?.client_token;
  if (token) clientTokens.delete(token);
  res.clearCookie("client_token");
  res.json({ ok: true });
});

// Portal "me" endpoint
app.get("/api/portal/me", portalAuth, async (req, res) => {
  const config = await loadConfig();
  const client = await findClient(config, req.clientId);
  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json({
    clientId: client.clientId,
    clientName: client.clientName,
    plan: client.billing?.plan || "trial",
    businessType: client.businessType,
    email: client.email,
    phone: client.phone
  });
});

// Portal dashboard data
app.get("/api/portal/dashboard", portalAuth, async (req, res) => {
  const config = await loadConfig();
  const clientId = req.clientId;
  const client = await findClient(config, clientId);
  const billing = await readJson(path.join(dataDir, "billing.json"), {});
  const clientBilling = billing[clientId] || {};

  // Get pending approvals for this client
  const pendingApprovals = approvalQueue.getPending(clientId);

  // Get recent activity (last 5 history items for this client)
  const history = approvalQueue.getHistory(clientId, 5);

  // Try to read usage stats from client logs if available
  let stats = {
    messagesThisMonth: 0,
    tasksCompleted: 0,
    apiCallsThisMonth: 0
  };

  try {
    const statsPath = path.join(config.clientsDir, clientId, "data", "usage-stats.json");
    const usageStats = await readJson(statsPath, null);
    if (usageStats) stats = { ...stats, ...usageStats };
  } catch {
    // Stats file not found - that's ok
  }

  res.json({
    pendingApprovals: pendingApprovals.length,
    billing: clientBilling,
    businessInfo: client ? {
      clientName: client.clientName,
      businessType: client.businessType,
      email: client.email,
      phone: client.phone
    } : {},
    stats,
    recentActivity: history.map(h => ({
      action: h.action,
      details: h.details?.message || h.details?.description || "",
      timeAgo: h.resolvedAt ? timeAgo(new Date(h.resolvedAt)) : "Just now",
      risk: h.risk
    })),
    gatewayStatus: client?.health?.status || "DOWN",
    whatsappLinked: client?.readiness?.checks?.whatsappLinked || false,
    lastActive: client?.session?.updatedAt || null
  });
});

// Portal approvals
app.get("/api/portal/approvals", portalAuth, async (req, res) => {
  const pending = approvalQueue.getPending(req.clientId);
  res.json({ approvals: pending });
});

// Portal SOUL endpoints
app.get("/api/portal/soul", portalAuth, async (req, res) => {
  const soulPath = path.join(req.runtimeConfig?.clientsDir || (await loadConfig()).clientsDir, req.clientId, "data", "workspace", "SOUL.md");
  try {
    const content = await fs.readFile(soulPath, "utf8");
    res.json({ content });
  } catch {
    res.json({ content: "# SOUL.md\n\nYour AI assistant personality...\n" });
  }
});

app.put("/api/portal/soul", portalAuth, async (req, res) => {
  const config = await loadConfig();
  const soulDir = path.join(config.clientsDir, req.clientId, "data", "workspace");
  await fs.mkdir(soulDir, { recursive: true });
  const soulPath = path.join(soulDir, "SOUL.md");
  await fs.writeFile(soulPath, req.body?.content || "", "utf8");
  res.json({ ok: true });
});

// ── Leads Management ───────────────────────────────────────────────────────────

const leadsPath = path.join(dataDir, "leads.json");

async function loadLeads() {
  return readJson(leadsPath, []);
}

async function saveLeads(leads) {
  await writeJson(leadsPath, leads);
}

// List all leads
app.get("/api/leads", authRequired(true), async (_req, res) => {
  const leads = await loadLeads();
  res.json({ leads });
});

// Create a new lead
app.post("/api/leads", authRequired(true), async (req, res) => {
  const { name, email, phone, business, businessType, notes } = req.body || {};
  const leads = await loadLeads();

  const id = crypto.randomBytes(8).toString("hex");
  const lead = {
    id,
    name: name || "",
    email: email || "",
    phone: phone || "",
    business: business || "",
    businessType: businessType || "",
    notes: notes || "",
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.push(lead);
  await saveLeads(leads);
  res.json({ ok: true, lead });
});

// Update a lead
app.put("/api/leads/:id", authRequired(true), async (req, res) => {
  const leads = await loadLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  leads[idx] = {
    ...leads[idx],
    ...req.body,
    id: req.params.id, // Preserve ID
    updatedAt: new Date().toISOString()
  };
  await saveLeads(leads);
  res.json({ ok: true, lead: leads[idx] });
});

// Delete a lead
app.delete("/api/leads/:id", authRequired(true), async (req, res) => {
  const leads = await loadLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  leads.splice(idx, 1);
  await saveLeads(leads);
  res.json({ ok: true });
});

// Convert lead to client (provision)
app.put("/api/leads/:id/provision", authRequired(true), async (req, res) => {
  const leads = await loadLeads();
  const leadIdx = leads.findIndex(l => l.id === req.params.id);
  if (leadIdx === -1) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }

  const lead = leads[leadIdx];
  const config = await loadConfig();

  // Generate client ID from business name
  const clientId = (lead.business || lead.name || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + crypto.randomBytes(2).toString("hex");

  try {
    const clientDir = path.join(config.clientsDir, clientId);
    await fs.mkdir(path.join(clientDir, "data", "workspace"), { recursive: true });

    // Create client config
    await writeJson(path.join(clientDir, "config.json"), {
      clientId,
      clientName: lead.business || lead.name,
      businessType: lead.businessType || "General Business",
      primaryContact: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdAt: new Date().toISOString(),
      leadId: lead.id
    });

    // Generate portal token
    const portalToken = crypto.randomBytes(24).toString("hex");
    await fs.writeFile(path.join(clientDir, "data", ".portal-token"), portalToken);

    // Mark lead as converted
    leads[leadIdx].status = "converted";
    leads[leadIdx].clientId = clientId;
    leads[leadIdx].convertedAt = new Date().toISOString();
    await saveLeads(leads);

    res.json({
      ok: true,
      clientId,
      portalToken,
      directory: clientDir,
      nextSteps: [
        "Run ./scripts/provision-client.sh " + clientId + " to complete setup",
        "Share portal URL and token with the client",
        "Configure API keys and WhatsApp"
      ]
    });
  } catch (err) {
    console.error("[provision] Error:", err);
    res.status(500).json({ error: "Failed to provision client: " + err.message });
  }
});

// ── Client Provisioning API ───────────────────────────────────────────────────

// Direct provision a new client
app.post("/api/clients/provision", authRequired(true), async (req, res) => {
  const { clientId, clientName, plan, email, phone, primaryContact, businessType } = req.body || {};
  if (!clientId || !clientName) {
    res.status(400).json({ error: "clientId and clientName are required" });
    return;
  }

  const config = await loadConfig();
  const clientDir = path.join(config.clientsDir, clientId);

  // Check if client already exists
  if (await pathExists(clientDir)) {
    res.status(409).json({ error: "Client already exists" });
    return;
  }

  try {
    await fs.mkdir(path.join(clientDir, "data", "workspace"), { recursive: true });

    // Create client config
    await writeJson(path.join(clientDir, "config.json"), {
      clientId,
      clientName,
      businessType: businessType || "General Business",
      primaryContact: primaryContact || "",
      email: email || "",
      phone: phone || "",
      plan: plan || "trial",
      createdAt: new Date().toISOString()
    });

    // Generate portal token
    const portalToken = crypto.randomBytes(24).toString("hex");
    await fs.writeFile(path.join(clientDir, "data", ".portal-token"), portalToken);

    // Set up initial billing
    const billing = await readJson(path.join(dataDir, "billing.json"), {});
    billing[clientId] = {
      plan: plan || "trial",
      setupFeeInr: 0,
      monthlyFeeInr: 0,
      paymentStatus: "PENDING",
      nextDueAt: "",
      createdAt: new Date().toISOString()
    };
    await writeJson(path.join(dataDir, "billing.json"), billing);

    res.json({
      ok: true,
      clientId,
      portalToken,
      directory: clientDir,
      nextSteps: [
        "Run ./scripts/provision-client.sh " + clientId + " to complete setup",
        "Share portal URL and token with the client",
        "Configure API keys and WhatsApp"
      ]
    });
  } catch (err) {
    console.error("[provision] Error:", err);
    res.status(500).json({ error: "Failed to provision client: " + err.message });
  }
});

// Get portal token for a client
app.get("/api/clients/:id/portal-token", authRequired(true), async (req, res) => {
  const config = await loadConfig();
  const clientId = req.params.id;

  if (!await pathExists(path.join(config.clientsDir, clientId))) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const token = await loadClientPortalToken(clientId, config);
  res.json({ clientId, portalToken: token });
});

// Deactivate client (stop container)
app.post("/api/clients/:id/deactivate", authRequired(true), async (req, res) => {
  const clientId = req.params.id;
  const config = await loadConfig();
  const clientDir = path.join(config.clientsDir, clientId);

  if (!await pathExists(clientDir)) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Try to stop via docker
  try {
    await new Promise((resolve, reject) => {
      const dockerStop = spawn("docker", ["stop", "bizclaw-" + clientId], {
        timeout: 10000
      });
      let output = "";
      dockerStop.stdout.on("data", d => output += d);
      dockerStop.stderr.on("data", d => output += d);
      dockerStop.on("close", code => {
        if (code === 0) resolve(output);
        else reject(new Error("docker stop failed: " + output));
      });
      dockerStop.on("error", reject);
    });
    res.json({ ok: true, message: "Container stopped" });
  } catch (err) {
    // Container might not be running - that's ok
    res.json({ ok: true, message: "Container was not running" });
  }
});

// Reactivate client (start container)
app.post("/api/clients/:id/reactivate", authRequired(true), async (req, res) => {
  const clientId = req.params.id;
  const config = await loadConfig();
  const clientDir = path.join(config.clientsDir, clientId);

  if (!await pathExists(clientDir)) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  // Try to start via docker
  try {
    await new Promise((resolve, reject) => {
      const dockerStart = spawn("docker", ["start", "bizclaw-" + clientId], {
        timeout: 10000
      });
      let output = "";
      dockerStart.stdout.on("data", d => output += d);
      dockerStart.stderr.on("data", d => output += d);
      dockerStart.on("close", code => {
        if (code === 0) resolve(output);
        else reject(new Error("docker start failed: " + output));
      });
      dockerStart.on("error", reject);
    });
    res.json({ ok: true, message: "Container started" });
  } catch (err) {
    res.status(500).json({ error: "Failed to start container: " + err.message });
  }
});

// Helper: time ago formatter
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hr ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + " days ago";
  return date.toLocaleDateString();
}

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
