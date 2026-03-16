#!/usr/bin/env bash
set -euo pipefail

# Run a BizClaw client directly on the local machine without Docker.
# Usage: ./scripts/run-client-local.sh <client-id>

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/run-client-local.sh <client-id>"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  exit 1
fi

BUILD_DIR="$ROOT_DIR/build"

if [ ! -f "$BUILD_DIR/openclaw.mjs" ]; then
  echo "Error: BizClaw build not found. Run ./scripts/build.sh first."
  exit 1
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "Error: Missing $CLIENT_DIR/.env"
  exit 1
fi

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
done < "$CLIENT_DIR/.env"

PORT="${BIZCLAW_PORT:-18789}"
TOKEN="${GATEWAY_TOKEN:-}"

mkdir -p "$CLIENT_DIR/data" "$CLIENT_DIR/data/workspace" "$CLIENT_DIR/data/credentials"
cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"

node -e '
  const fs = require("fs");
  const path = require("path");
  const file = process.argv[1];
  const port = Number(process.argv[2]);
  const dataDir = process.argv[3];
  const config = JSON.parse(fs.readFileSync(file, "utf8"));

  const rootWhatsApp = config.channels?.whatsapp ?? {};
  const defaultAccount = rootWhatsApp.accounts?.default ?? {};
  const ownerAllowFrom = Array.isArray(config.commands?.ownerAllowFrom) && config.commands.ownerAllowFrom.length > 0
    ? config.commands.ownerAllowFrom.map(String)
    : Array.isArray(rootWhatsApp.allowFrom) && rootWhatsApp.allowFrom.length > 0
      ? rootWhatsApp.allowFrom.map(String)
      : Array.isArray(defaultAccount.allowFrom) && defaultAccount.allowFrom.length > 0
        ? defaultAccount.allowFrom.map(String)
        : [];

  config.messages = {
    ...(config.messages || {}),
    ackReactionScope: "group-mentions",
  };
  config.commands = {
    native: "auto",
    nativeSkills: "auto",
    restart: true,
    ownerDisplay: "raw",
    ...(config.commands || {}),
    ownerAllowFrom,
  };
  config.cron = {
    enabled: true,
    sessionRetention: "7d",
    ...(config.cron || {}),
  };
  config.agents = config.agents || {};
  config.agents.list = Array.isArray(config.agents.list) ? config.agents.list : [];
  if (config.agents.list[0]) {
    const existingTools = config.agents.list[0].tools || {};
    const allow = new Set([...(existingTools.allow || []), "web_fetch", "web_search", "cron", "image", "message"]);
    const deny = new Set([...(existingTools.deny || []), "bash", "computer"]);
    config.agents.list[0].tools = {
      ...existingTools,
      profile: "messaging",
      allow: Array.from(allow),
      deny: Array.from(deny),
      exec: {
        security: "deny",
        ...((existingTools.exec && typeof existingTools.exec === "object") ? existingTools.exec : {}),
      },
    };
  }
  config.gateway = config.gateway || {};
  config.gateway.port = port;
  config.channels = config.channels || {};
  config.channels.whatsapp = {
    ...rootWhatsApp,
    dmPolicy: "allowlist",
    allowFrom: ownerAllowFrom,
    selfChatMode: true,
    groupPolicy: "disabled",
    configWrites: true,
    sendReadReceipts: true,
    textChunkLimit: rootWhatsApp.textChunkLimit || 4000,
    chunkMode: rootWhatsApp.chunkMode || "length",
    mediaMaxMb: rootWhatsApp.mediaMaxMb || 50,
    debounceMs: rootWhatsApp.debounceMs || 500,
    ackReaction: {
      emoji: "⚡",
      direct: false,
      group: "never",
      ...(rootWhatsApp.ackReaction || {}),
    },
    actions: {
      reactions: true,
      sendMessage: true,
      polls: true,
      ...(rootWhatsApp.actions || {}),
    },
  };
  config.channels.whatsapp.accounts = config.channels.whatsapp.accounts || {};
  if (config.channels && config.channels.whatsapp && config.channels.whatsapp.accounts) {
    for (const [accountId, account] of Object.entries(config.channels.whatsapp.accounts)) {
      if (account && typeof account.authDir === "string") {
        account.authDir = path.join(dataDir, "credentials", "whatsapp", accountId);
      }
      if (account && typeof account === "object") {
        account.dmPolicy = "allowlist";
        account.allowFrom = ownerAllowFrom;
        account.groupPolicy = "disabled";
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
' "$CLIENT_DIR/data/openclaw.json" "$PORT" "$CLIENT_DIR/data"

"$SCRIPT_DIR/bootstrap-client-auth.sh" "$CLIENT_ID"

if [ -z "$TOKEN" ]; then
  echo "Error: GATEWAY_TOKEN missing in $CLIENT_DIR/.env"
  exit 1
fi

cd "$BUILD_DIR"

echo "BizClaw client: http://127.0.0.1:${PORT}?token=${TOKEN}"

exec env \
  OPENCLAW_CONFIG_PATH="$CLIENT_DIR/data/openclaw.json" \
  OPENCLAW_STATE_DIR="$CLIENT_DIR/data" \
  OPENCLAW_WORKSPACE_DIR="$CLIENT_DIR/data/workspace" \
  OPENCLAW_GATEWAY_TOKEN="$TOKEN" \
  OPENCLAW_GATEWAY_PORT="$PORT" \
  node "$BUILD_DIR/openclaw.mjs" gateway \
    --allow-unconfigured \
    --bind loopback \
    --port "$PORT" \
    --token "$TOKEN"
