#!/usr/bin/env bash
set -euo pipefail

# Seed per-agent auth-profiles.json from available provider keys.
# Usage: ./scripts/bootstrap-client-auth.sh <client-id>

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/bootstrap-client-auth.sh <client-id>"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"
CONFIG_PATH="$CLIENT_DIR/data/openclaw.json"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Error: Missing client config at $CONFIG_PATH"
  exit 1
fi

AGENT_ID="$(node -e 'const fs=require("fs"); const cfg=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); const id=cfg?.agents?.list?.find((agent)=>agent?.default)?.id ?? cfg?.agents?.list?.[0]?.id; if(!id){process.exit(1)} process.stdout.write(String(id));' "$CONFIG_PATH")"
AUTH_PATH="$CLIENT_DIR/data/agents/$AGENT_ID/agent/auth-profiles.json"

mkdir -p "$(dirname "$AUTH_PATH")"

SEEDED="$(
AUTH_PATH="$AUTH_PATH" node <<'EOF'
const fs = require("fs");
const path = process.env.AUTH_PATH;
const read = (name) => {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
};

const profiles = {};
const openai = read("OPENAI_API_KEY");
const gemini = read("GEMINI_API_KEY") || read("GOOGLE_API_KEY");
const anthropic = read("ANTHROPIC_API_KEY");

if (openai) {
  profiles["openai:default"] = { type: "api_key", provider: "openai", key: openai };
}
if (gemini) {
  profiles["google:default"] = { type: "api_key", provider: "google", key: gemini };
}
if (anthropic) {
  profiles["anthropic:default"] = { type: "api_key", provider: "anthropic", key: anthropic };
}

let store = { version: 1, profiles: {} };
if (fs.existsSync(path)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path, "utf8"));
    if (parsed && typeof parsed === "object") {
      store = {
        version: Number(parsed.version) || 1,
        profiles: parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
        order: parsed.order,
        lastGood: parsed.lastGood,
        usageStats: parsed.usageStats,
      };
    }
  } catch {
    // Start fresh if the existing file is unreadable.
  }
}

if (Object.keys(profiles).length === 0) {
  process.stdout.write("0");
  process.exit(0);
}

store.profiles = { ...store.profiles, ...profiles };
fs.writeFileSync(path, JSON.stringify(store, null, 2) + "\n", { mode: 0o600 });
process.stdout.write("1");
EOF
)"

chmod 600 "$AUTH_PATH" 2>/dev/null || true
if [ "$SEEDED" = "1" ]; then
  echo "Auth bootstrap ready: $AUTH_PATH"
else
  echo "Auth bootstrap skipped: no provider keys available"
fi
