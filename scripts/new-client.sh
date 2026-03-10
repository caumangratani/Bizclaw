#!/usr/bin/env bash
set -euo pipefail

# BizClaw New Client Setup
# Creates a complete client directory from template
# Usage: ./scripts/new-client.sh <client-id> ["Client Name"] ["Business Type"] ["+phone"]

if [ -z "${1:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — New Client Setup"
  echo "  Bizgenix AI Solutions Pvt. Ltd."
  echo "================================================================"
  echo ""
  echo "Usage: ./scripts/new-client.sh <client-id> [\"Client Name\"] [\"Business Type\"] [\"+phone\"]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/new-client.sh acme-textiles \"Acme Textiles\" \"Textiles\" \"+919876543210\""
  echo "  ./scripts/new-client.sh sharma-traders"
  echo ""
  echo "The client-id should be lowercase with hyphens (e.g., sharma-traders)"
  exit 1
fi

CLIENT_ID="$1"
CLIENT_NAME="${2:-$CLIENT_ID}"
CLIENT_BUSINESS="${3:-General Business}"
CLIENT_PHONE="${4:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENTS_DIR="$ROOT_DIR/clients"
TEMPLATE_DIR="$CLIENTS_DIR/TEMPLATE"
CLIENT_DIR="$CLIENTS_DIR/$CLIENT_ID"

if [ -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' already exists at $CLIENT_DIR"
  echo "To reset: ./scripts/reset-client.sh $CLIENT_ID"
  exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Error: Template directory not found at $TEMPLATE_DIR"
  exit 1
fi

echo "================================================================"
echo "  Creating BizClaw client: $CLIENT_NAME"
echo "  ID: $CLIENT_ID"
echo "  Business: $CLIENT_BUSINESS"
echo "  Phone: ${CLIENT_PHONE:-not set}"
echo "================================================================"
echo ""

# Copy template directory
cp -R "$TEMPLATE_DIR" "$CLIENT_DIR"

# Create data directories
mkdir -p "$CLIENT_DIR/data"
mkdir -p "$CLIENT_DIR/data/workspace"
mkdir -p "$CLIENT_DIR/data/sessions"
mkdir -p "$CLIENT_DIR/data/memory"
mkdir -p "$CLIENT_DIR/data/whatsapp-session"
mkdir -p "$CLIENT_DIR/data/credentials"
mkdir -p "$CLIENT_DIR/logs"

# Generate gateway token (24-byte hex = 48 chars)
GATEWAY_TOKEN=$(openssl rand -hex 24 2>/dev/null || head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')

# Replace placeholders in config.json
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS sed
  sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"
  sed -i '' "s/Template Client/$(echo "$CLIENT_NAME" | sed 's/[&/\]/\\&/g')/g" "$CLIENT_DIR/config.json"
  sed -i '' "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"
  sed -i '' "s/\"businessType\": \"\"/\"businessType\": \"$(echo "$CLIENT_BUSINESS" | sed 's/[&/\]/\\&/g')\"/" "$CLIENT_DIR/config.json"
  sed -i '' "s/\"phone\": \"\"/\"phone\": \"$CLIENT_PHONE\"/" "$CLIENT_DIR/config.json"
else
  # Linux sed
  sed -i "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"
  sed -i "s/Template Client/$(echo "$CLIENT_NAME" | sed 's/[&/\]/\\&/g')/g" "$CLIENT_DIR/config.json"
  sed -i "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"
  sed -i "s/\"businessType\": \"\"/\"businessType\": \"$(echo "$CLIENT_BUSINESS" | sed 's/[&/\]/\\&/g')\"/" "$CLIENT_DIR/config.json"
  sed -i "s/\"phone\": \"\"/\"phone\": \"$CLIENT_PHONE\"/" "$CLIENT_DIR/config.json"
fi

# Replace placeholders in openclaw.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/openclaw.json"
else
  sed -i "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/openclaw.json"
fi

# Replace placeholders in soul.md
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/TEMPLATE_CLIENT_NAME/$CLIENT_NAME/g" "$CLIENT_DIR/soul.md"
  sed -i '' "s/TEMPLATE_CLIENT_BUSINESS/$CLIENT_BUSINESS/g" "$CLIENT_DIR/soul.md"
else
  sed -i "s/TEMPLATE_CLIENT_NAME/$CLIENT_NAME/g" "$CLIENT_DIR/soul.md"
  sed -i "s/TEMPLATE_CLIENT_BUSINESS/$CLIENT_BUSINESS/g" "$CLIENT_DIR/soul.md"
fi

# Copy soul.md and AGENTS.md to workspace data dir
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"
cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"

# Determine port (base 18789 + number of existing clients)
EXISTING_CLIENTS=$(ls -d "$CLIENTS_DIR"/*/ 2>/dev/null | grep -v TEMPLATE | wc -l | tr -d ' ')
CLIENT_PORT=$((18789 + EXISTING_CLIENTS - 1))

# Generate per-client .env file
cat > "$CLIENT_DIR/.env" <<EOF
# BizClaw Client: $CLIENT_NAME
# Generated: $DATE
# ID: $CLIENT_ID

# -- Client Identity --
CLIENT_ID=$CLIENT_ID
CLIENT_NAME=$CLIENT_NAME
CLIENT_BUSINESS=$CLIENT_BUSINESS

# -- Gateway --
GATEWAY_TOKEN=$GATEWAY_TOKEN
BIZCLAW_PORT=$CLIENT_PORT

# -- API Keys (copy from master .env or set per-client) --
GOOGLE_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# -- Channels --
TELEGRAM_BOT_TOKEN=
# WhatsApp connects via QR scan on first launch

# -- Advanced --
# NODE_ENV=production
EOF

echo "Client created successfully!"
echo ""
echo "  Directory: $CLIENT_DIR"
echo "  Port: $CLIENT_PORT"
echo "  Gateway Token: $GATEWAY_TOKEN"
echo ""
echo "Next steps:"
echo "  1. Add API keys to: $CLIENT_DIR/.env"
echo "     (or copy from master .env: cp .env $CLIENT_DIR/.env)"
echo "  2. Bootstrap auth: ./scripts/bootstrap-client-auth.sh $CLIENT_ID"
echo "  3. Customize soul: $CLIENT_DIR/soul.md"
echo "  4. Readiness check: ./scripts/client-readiness.sh $CLIENT_ID"
echo "  5. Deploy: ./docker/deploy-client.sh $CLIENT_ID"
echo ""
echo "Files created:"
echo "  $CLIENT_DIR/config.json       — client metadata"
echo "  $CLIENT_DIR/openclaw.json     — OpenClaw config (deployed)"
echo "  $CLIENT_DIR/soul.md           — AI personality"
echo "  $CLIENT_DIR/AGENTS.md         — agent instructions"
echo "  $CLIENT_DIR/.env              — environment variables"
echo "  $CLIENT_DIR/data/             — persistent data directory"
echo ""
