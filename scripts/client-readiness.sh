#!/usr/bin/env bash
set -euo pipefail

# BizClaw client readiness check
# Usage:
#   ./scripts/client-readiness.sh <client-id>
#   ./scripts/client-readiness.sh <client-id> --json

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/client-readiness.sh <client-id> [--json]"
  exit 1
fi

CLIENT_ID="$1"
FORMAT="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  exit 1
fi

CLIENT_ID="$CLIENT_ID" CLIENT_DIR="$CLIENT_DIR" node - "$FORMAT" <<'EOF'
const fs = require("fs");
const path = require("path");

const clientId = process.env.CLIENT_ID;
const clientDir = process.env.CLIENT_DIR;
const outputJson = process.argv.includes("--json");

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function parseEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

function exists(target) {
  try {
    fs.accessSync(target);
    return true;
  } catch {
    return false;
  }
}

function readAuthProfileStore(filePath) {
  const store = readJson(filePath, null);
  const profiles =
    store && typeof store === "object" && store.profiles && typeof store.profiles === "object"
      ? store.profiles
      : {};
  const entries = Object.entries(profiles).filter(([, value]) => value && typeof value === "object");
  return {
    filePath,
    profileCount: entries.length,
    providers: [...new Set(entries.map(([, value]) => value.provider).filter(Boolean))]
  };
}

function resolveDefaultAgentId(config) {
  const agents = Array.isArray(config?.agents?.list) ? config.agents.list : [];
  return agents.find((agent) => agent?.default)?.id || agents[0]?.id || "main";
}

function findWhatsAppState() {
  const candidates = [
    path.join(clientDir, "data", "credentials", "whatsapp", "default"),
    path.join(clientDir, "data", ".openclaw", "credentials", "whatsapp", "default"),
    path.join(clientDir, "data", "credentials", "whatsapp")
  ];
  for (const candidate of candidates) {
    try {
      const entries = fs.readdirSync(candidate);
      const jsonFiles = entries.filter((entry) => entry.endsWith(".json"));
      if (jsonFiles.length > 0 || entries.includes("creds.json")) {
        return { linked: true, path: candidate, fileCount: jsonFiles.length || entries.length };
      }
    } catch {
      // ignore
    }
  }
  return { linked: false, path: null, fileCount: 0 };
}

const env = parseEnv(path.join(clientDir, ".env"));
const config = readJson(path.join(clientDir, "data", "openclaw.json"), readJson(path.join(clientDir, "openclaw.json"), {}));
const defaultAgentId = resolveDefaultAgentId(config);
const agentRoots = [
  path.join(clientDir, "data", "agents"),
  path.join(clientDir, "data", ".openclaw", "agents")
].filter(exists);

let defaultAuth = { filePath: null, profileCount: 0, providers: [] };
let mainAuth = { filePath: null, profileCount: 0, providers: [] };
for (const root of agentRoots) {
  if (!defaultAuth.filePath) {
    const filePath = path.join(root, defaultAgentId, "agent", "auth-profiles.json");
    defaultAuth = readAuthProfileStore(filePath);
  }
  if (!mainAuth.filePath) {
    const filePath = path.join(root, "main", "agent", "auth-profiles.json");
    mainAuth = readAuthProfileStore(filePath);
  }
}

const readiness = {
  clientId,
  port: env.BIZCLAW_PORT || "",
  tokenConfigured: Boolean(env.GATEWAY_TOKEN),
  defaultAgentId,
  defaultAgentAuth: defaultAuth,
  mainAgentAuth: mainAuth,
  whatsapp: findWhatsAppState()
};

readiness.ready = Boolean(
  readiness.tokenConfigured &&
  readiness.defaultAgentAuth.profileCount > 0 &&
  readiness.mainAgentAuth.profileCount > 0 &&
  readiness.whatsapp.linked
);

if (outputJson) {
  process.stdout.write(JSON.stringify(readiness, null, 2) + "\n");
  process.exit(0);
}

console.log("================================================================");
console.log(`  BizClaw readiness: ${clientId}`);
console.log("================================================================");
console.log("");
console.log(`  Port:               ${readiness.port || "-"}`);
console.log(`  Token:              ${readiness.tokenConfigured ? "configured" : "missing"}`);
console.log(`  Default agent:      ${readiness.defaultAgentId}`);
console.log(`  Default agent auth: ${readiness.defaultAgentAuth.profileCount > 0 ? readiness.defaultAgentAuth.providers.join(", ") : "missing"}`);
console.log(`  Main agent auth:    ${readiness.mainAgentAuth.profileCount > 0 ? readiness.mainAgentAuth.providers.join(", ") : "missing"}`);
console.log(`  WhatsApp linked:    ${readiness.whatsapp.linked ? "yes" : "no"}`);
console.log(`  Launch ready:       ${readiness.ready ? "YES" : "NO"}`);
console.log("");
EOF
