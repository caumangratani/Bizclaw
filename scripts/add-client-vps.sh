#!/usr/bin/env bash
set -euo pipefail

# ================================================================
#  BizClaw — Add Client on VPS (One Command)
#  Creates client + bootstraps auth + starts service + prints URL
#
#  Usage:
#    sudo ./scripts/add-client-vps.sh <client-id> "<Client Name>" "<Business>" "+91XXXXXXXXXX" "<ANTHROPIC_API_KEY>"
#
#  Example:
#    sudo ./scripts/add-client-vps.sh sharma-traders "Sharma Traders Pvt Ltd" "Trading" "+919876543210" "sk-ant-api03-..."
# ================================================================

if [ -z "${1:-}" ] || [ -z "${4:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — Add Client (VPS)"
  echo "================================================================"
  echo ""
  echo "Usage: sudo ./scripts/add-client-vps.sh <client-id> \"<Name>\" \"<Business>\" \"+91phone\" \"<ANTHROPIC_KEY>\""
  echo ""
  echo "Example:"
  echo "  sudo ./scripts/add-client-vps.sh sharma-traders \"Sharma Traders\" \"Trading\" \"+919876543210\" \"sk-ant-...\""
  echo ""
  exit 1
fi

CLIENT_ID="$1"
CLIENT_NAME="${2:-$CLIENT_ID}"
CLIENT_BUSINESS="${3:-General Business}"
CLIENT_PHONE="$4"
ANTHROPIC_KEY="${5:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "================================================================"
echo "  Adding client: $CLIENT_NAME ($CLIENT_ID)"
echo "================================================================"
echo ""

# Step 1: Create client from template
echo "[1/4] Creating client directory..."
bash "$SCRIPT_DIR/new-client.sh" "$CLIENT_ID" "$CLIENT_NAME" "$CLIENT_BUSINESS" "$CLIENT_PHONE"

CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

# Step 2: Inject API key (using node to avoid sed special char issues)
echo "[2/4] Setting up API keys..."
if [ -n "$ANTHROPIC_KEY" ]; then
  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const key = process.argv[2];
    let content = fs.readFileSync(file, "utf8");
    content = content.replace(/^ANTHROPIC_API_KEY=.*/m, "ANTHROPIC_API_KEY=" + key);
    fs.writeFileSync(file, content);
  ' "$CLIENT_DIR/.env" "$ANTHROPIC_KEY"
  echo "  Anthropic API key set"
else
  echo "  WARNING: No Anthropic API key provided. Add it later:"
  echo "    nano $CLIENT_DIR/.env"
fi

# Copy workspace files
mkdir -p "$CLIENT_DIR/data" "$CLIENT_DIR/data/workspace" "$CLIENT_DIR/data/credentials"
cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"

# Step 3: Bootstrap auth
echo "[3/4] Bootstrapping auth profiles..."
bash "$SCRIPT_DIR/bootstrap-client-auth.sh" "$CLIENT_ID"

# Fix ownership
chown -R bizclaw:bizclaw "$CLIENT_DIR" 2>/dev/null || true

# Step 4: Start service
echo "[4/4] Starting BizClaw service..."
if [ ! -f /etc/systemd/system/bizclaw-client@.service ]; then
  echo "  ERROR: systemd service template not found."
  echo "  Run setup-vps.sh first, or create it manually:"
  echo "    sudo cp $ROOT_DIR/scripts/bizclaw-client@.service /etc/systemd/system/"
  echo ""
  echo "  Client files are ready at: $CLIENT_DIR"
  echo "  You can start manually with:"
  echo "    bash $ROOT_DIR/scripts/run-client-vps.sh $CLIENT_ID"
  exit 1
fi
systemctl daemon-reload
systemctl enable "bizclaw-client@$CLIENT_ID" 2>/dev/null || true
systemctl start "bizclaw-client@$CLIENT_ID"

# Wait for startup
sleep 3

# Read port and token from .env
PORT=""
TOKEN=""
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ""|\#*) continue ;;
  esac
  key="${line%%=*}"
  value="${line#*=}"
  case "$key" in
    BIZCLAW_PORT) PORT="$value" ;;
    GATEWAY_TOKEN) TOKEN="$value" ;;
  esac
done < "$CLIENT_DIR/.env"

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR-IP")

echo ""
echo "================================================================"
echo "  Client '$CLIENT_NAME' is LIVE!"
echo "================================================================"
echo ""
echo "  Dashboard URL:"
echo "    http://$SERVER_IP:$PORT?token=$TOKEN"
echo ""
echo "  NEXT STEP — Link WhatsApp:"
echo "    1. Open the dashboard URL above"
echo "    2. Go to Channels > WhatsApp"
echo "    3. Scan QR code with client's WhatsApp"
echo "    4. Done! Client can now message BizClaw via WhatsApp"
echo ""
echo "  Commands:"
echo "    Status:  sudo systemctl status bizclaw-client@$CLIENT_ID"
echo "    Logs:    sudo journalctl -u bizclaw-client@$CLIENT_ID -f"
echo "    Restart: sudo systemctl restart bizclaw-client@$CLIENT_ID"
echo "    Stop:    sudo systemctl stop bizclaw-client@$CLIENT_ID"
echo ""
