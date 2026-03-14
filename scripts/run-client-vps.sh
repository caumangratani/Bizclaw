#!/usr/bin/env bash
set -euo pipefail

# Run a BizClaw client on VPS using globally installed OpenClaw.
# Uses npm -g openclaw (compiled, with WhatsApp/Telegram extensions).
# Usage: ./scripts/run-client-vps.sh <client-id>

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/run-client-vps.sh <client-id>"
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

if ! command -v openclaw &>/dev/null; then
  echo "Error: openclaw not found. Install with: sudo npm install -g openclaw"
  exit 1
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "Error: Missing $CLIENT_DIR/.env"
  exit 1
fi

# Load client environment
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ""|\#*) continue ;;
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

# Prepare client data directories
mkdir -p "$CLIENT_DIR/data" "$CLIENT_DIR/data/workspace" "$CLIENT_DIR/data/credentials"
cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"

# Patch port into runtime config
node -e '
  const fs = require("fs");
  const file = process.argv[1];
  const port = Number(process.argv[2]);
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  config.gateway = config.gateway || {};
  config.gateway.port = port;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
' "$CLIENT_DIR/data/openclaw.json" "$PORT"

# Bootstrap auth profiles from env API keys
"$SCRIPT_DIR/bootstrap-client-auth.sh" "$CLIENT_ID"

if [ -z "$TOKEN" ]; then
  echo "Error: GATEWAY_TOKEN missing in $CLIENT_DIR/.env"
  exit 1
fi

echo "BizClaw client '$CLIENT_ID': http://0.0.0.0:${PORT}?token=${TOKEN}"

# Run using globally installed openclaw (has compiled WhatsApp/Telegram)
exec env \
  OPENCLAW_CONFIG_PATH="$CLIENT_DIR/data/openclaw.json" \
  OPENCLAW_STATE_DIR="$CLIENT_DIR/data" \
  OPENCLAW_WORKSPACE_DIR="$CLIENT_DIR/data/workspace" \
  OPENCLAW_GATEWAY_TOKEN="$TOKEN" \
  OPENCLAW_GATEWAY_PORT="$PORT" \
  openclaw gateway run \
    --allow-unconfigured \
    --bind lan \
    --port "$PORT"
