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
ENV_PATH="$CLIENT_DIR/.env"

if [ ! -f "$CONFIG_PATH" ]; then
  echo "Error: Missing client config at $CONFIG_PATH"
  exit 1
fi

if [ -f "$ENV_PATH" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|\#*) continue
        ;;
    esac
    key="${line%%=*}"
    value="${line#*=}"
    if [ -z "$value" ] && [ -n "${!key:-}" ]; then
      continue
    fi
    export "$key=$value"
  done < "$ENV_PATH"
fi

AGENT_ID="$(node -e 'const fs=require("fs"); const cfg=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); const id=cfg?.agents?.list?.find((agent)=>agent?.default)?.id ?? cfg?.agents?.list?.[0]?.id; if(!id){process.exit(1)} process.stdout.write(String(id));' "$CONFIG_PATH")"

AUTH_PATHS="$(
  CLIENT_DIR="$CLIENT_DIR" AGENT_ID="$AGENT_ID" node <<'EOF'
const fs = require("fs");
const path = require("path");

const clientDir = process.env.CLIENT_DIR;
const agentId = process.env.AGENT_ID;
const roots = [
  path.join(clientDir, "data", "agents"),
  path.join(clientDir, "data", ".openclaw", "agents"),
];

const out = [];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  out.push(path.join(root, agentId, "agent", "auth-profiles.json"));
  out.push(path.join(root, "main", "agent", "auth-profiles.json"));
}
process.stdout.write(out.join("\n"));
EOF
)"

if [ -z "$AUTH_PATHS" ]; then
  echo "Auth bootstrap skipped: no agent directories found"
  exit 0
fi

while IFS= read -r auth_path || [ -n "$auth_path" ]; do
  [ -z "$auth_path" ] && continue
  mkdir -p "$(dirname "$auth_path")"
done <<EOF
$AUTH_PATHS
EOF

SEEDED="$(
AUTH_PATHS="$AUTH_PATHS" node <<'EOF'
const fs = require("fs");
const paths = String(process.env.AUTH_PATHS || "")
  .split(/\r?\n/)
  .map((entry) => entry.trim())
  .filter(Boolean);
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
for (const filePath of paths) {
  if (!fs.existsSync(filePath)) continue;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (parsed && typeof parsed === "object") {
      store = {
        version: Number(parsed.version) || 1,
        profiles: parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
        order: parsed.order,
        lastGood: parsed.lastGood,
        usageStats: parsed.usageStats,
      };
      break;
    }
  } catch {
    // Skip unreadable files and continue with the next candidate.
  }
}

if (Object.keys(profiles).length === 0) {
  profiles;
}

const mergedProfiles = { ...store.profiles, ...profiles };
if (Object.keys(mergedProfiles).length === 0) {
  process.stdout.write("0");
  process.exit(0);
}

store.profiles = mergedProfiles;
for (const filePath of paths) {
  fs.mkdirSync(require("path").dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2) + "\n", { mode: 0o600 });
}
process.stdout.write(String(paths.length));
EOF
)"

while IFS= read -r auth_path || [ -n "$auth_path" ]; do
  [ -z "$auth_path" ] && continue
  chmod 600 "$auth_path" 2>/dev/null || true
done <<EOF
$AUTH_PATHS
EOF

if [ "$SEEDED" != "0" ]; then
  echo "Auth bootstrap ready for $SEEDED agent store(s)"
else
  echo "Auth bootstrap skipped: no provider keys available"
fi
