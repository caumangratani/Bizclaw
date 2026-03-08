#!/usr/bin/env bash
set -euo pipefail

# BizClaw Client Deployment
# Deploys a client as a Docker container
# Usage: ./docker/deploy-client.sh <client-id>

if [ -z "${1:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — Deploy Client"
  echo "  Bizgenix AI Solutions Pvt. Ltd."
  echo "================================================================"
  echo ""
  echo "Usage: ./docker/deploy-client.sh <client-id>"
  echo ""
  echo "Examples:"
  echo "  ./docker/deploy-client.sh sharma-traders"
  echo "  ./docker/deploy-client.sh demo"
  echo ""
  echo "Create a client first: ./scripts/new-client.sh <client-id>"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found."
  echo "Create with: ./scripts/new-client.sh $CLIENT_ID \"Client Name\" \"Business Type\""
  exit 1
fi

# Check for .env file
if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "Error: No .env file found for client '$CLIENT_ID'."
  echo "Run ./scripts/new-client.sh to regenerate, or create $CLIENT_DIR/.env manually."
  exit 1
fi

# Read client env safely; client names and business types can contain spaces.
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

# Check if port is in use
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "Warning: Port $PORT is already in use."
  echo "Check with: docker ps | grep bizclaw"
  echo "Or change BIZCLAW_PORT in $CLIENT_DIR/.env"
fi

echo "================================================================"
echo "  Deploying BizClaw for: ${CLIENT_NAME:-$CLIENT_ID}"
echo "  Port: $PORT"
echo "================================================================"
echo ""

# Refresh client runtime files before container start
mkdir -p "$CLIENT_DIR/data" "$CLIENT_DIR/data/workspace" "$CLIENT_DIR/data/credentials"
cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"

node -e '
  const fs = require("fs");
  const file = process.argv[1];
  const port = Number(process.argv[2]);
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  config.gateway = config.gateway || {};
  config.gateway.port = port;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
' "$CLIENT_DIR/data/openclaw.json" "$PORT"

"$ROOT_DIR/scripts/bootstrap-client-auth.sh" "$CLIENT_ID"

# Deploy with docker compose
export CLIENT_ID
export BIZCLAW_PORT=$PORT

docker compose -f "$SCRIPT_DIR/docker-compose.yml" \
  --env-file "$CLIENT_DIR/.env" \
  -p "bizclaw-$CLIENT_ID" \
  up -d --build

echo ""
echo "================================================================"
echo "  BizClaw deployed for: ${CLIENT_NAME:-$CLIENT_ID}"
echo "================================================================"
echo ""
echo "  Dashboard:     http://localhost:$PORT"
echo "  Client URL:    http://localhost:$PORT?token=${GATEWAY_TOKEN:-check .env}"
echo "  Gateway Token: ${GATEWAY_TOKEN:-check .env}"
echo ""
echo "  More URLs:     ./scripts/client-launch-url.sh $CLIENT_ID"
echo ""
echo "  WhatsApp Setup:"
echo "    1. Open dashboard: http://localhost:$PORT?token=${GATEWAY_TOKEN:-check .env}"
echo "    2. Go to WhatsApp section"
echo "    3. Scan QR code with WhatsApp on your phone"
echo "    4. Session auto-saves — survives restarts"
echo ""
echo "  Telegram Setup:"
echo "    1. Add TELEGRAM_BOT_TOKEN to $CLIENT_DIR/.env"
echo "    2. Restart: docker compose -p bizclaw-$CLIENT_ID restart"
echo ""
echo "  Useful commands:"
echo "    Logs:    docker compose -p bizclaw-$CLIENT_ID logs -f"
echo "    Stop:    docker compose -p bizclaw-$CLIENT_ID down"
echo "    Restart: docker compose -p bizclaw-$CLIENT_ID restart"
echo "    Status:  ./scripts/status-all.sh"
echo ""
