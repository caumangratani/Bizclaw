#!/usr/bin/env bash
set -euo pipefail

# ================================================================
#  BizClaw — Add Client on VPS (One Command)
#  Creates client + bootstraps auth + nginx HTTPS + starts service
#
#  Usage:
#    sudo ./scripts/add-client-vps.sh <client-id> "<Client Name>" "<Business>" "+91XXXXXXXXXX" "<API_KEY>" [--domain client.bizgenix.ai]
#
#  Example:
#    sudo ./scripts/add-client-vps.sh sharma-traders "Sharma Traders Pvt Ltd" "Trading" "+919876543210" "sk-ant-..." --domain sharma.bizgenix.ai
#
#  Without --domain: prints IP:port URL (HTTP only)
#  With --domain: creates nginx reverse proxy + auto-HTTPS via certbot
# ================================================================

# Parse --domain flag from any position
DOMAIN=""
POSITIONAL=()
for arg in "$@"; do
  if [ "$arg" = "--domain" ]; then
    GRAB_NEXT_DOMAIN=true
    continue
  fi
  if [ "${GRAB_NEXT_DOMAIN:-}" = "true" ]; then
    DOMAIN="$arg"
    GRAB_NEXT_DOMAIN=false
    continue
  fi
  POSITIONAL+=("$arg")
done
set -- "${POSITIONAL[@]}"

if [ -z "${1:-}" ] || [ -z "${4:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — Add Client (VPS)"
  echo "================================================================"
  echo ""
  echo "Usage: sudo ./scripts/add-client-vps.sh <client-id> \"<Name>\" \"<Business>\" \"+91phone\" \"<API_KEY>\" [--domain sub.bizgenix.ai]"
  echo ""
  echo "Example:"
  echo "  sudo ./scripts/add-client-vps.sh sharma-traders \"Sharma Traders\" \"Trading\" \"+919876543210\" \"sk-ant-...\" --domain sharma.bizgenix.ai"
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

TOTAL_STEPS=4
[ -n "$DOMAIN" ] && TOTAL_STEPS=5

# Step 1: Create client from template
echo "[1/$TOTAL_STEPS] Creating client directory..."
bash "$SCRIPT_DIR/new-client.sh" "$CLIENT_ID" "$CLIENT_NAME" "$CLIENT_BUSINESS" "$CLIENT_PHONE"

CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

# Step 2: Inject API key (using node to avoid sed special char issues)
echo "[2/$TOTAL_STEPS] Setting up API keys..."
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
echo "[3/$TOTAL_STEPS] Bootstrapping auth profiles..."
bash "$SCRIPT_DIR/bootstrap-client-auth.sh" "$CLIENT_ID"

# Fix ownership
chown -R bizclaw:bizclaw "$CLIENT_DIR" 2>/dev/null || true

# Step 4: Start service
echo "[4/$TOTAL_STEPS] Starting BizClaw service..."
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
DASHBOARD_URL="http://$SERVER_IP:$PORT?token=$TOKEN"

# Step 5 (optional): Set up nginx reverse proxy + HTTPS
if [ -n "$DOMAIN" ]; then
  echo "[5/$TOTAL_STEPS] Setting up HTTPS for $DOMAIN..."

  # Check DNS resolves to this server
  RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null || echo "")
  if [ -z "$RESOLVED_IP" ]; then
    echo "  WARNING: $DOMAIN doesn't resolve yet."
    echo "  Add this DNS A record first:"
    echo "    Type: A | Name: ${DOMAIN%%.*} | Value: $SERVER_IP | TTL: 300"
    echo "  HTTPS will be skipped. Run certbot manually later:"
    echo "    sudo certbot --nginx -d $DOMAIN"
  fi

  # Create nginx server block
  if command -v nginx &>/dev/null; then
    cat > /etc/nginx/sites-available/"$DOMAIN" << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINXEOF

    ln -sf /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/"$DOMAIN"
    nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null
    echo "  Nginx proxy: $DOMAIN → localhost:$PORT"

    # Auto-provision SSL if DNS resolves and certbot is available
    if [ -n "$RESOLVED_IP" ] && command -v certbot &>/dev/null; then
      certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email 2>/dev/null && \
        echo "  HTTPS certificate provisioned!" || \
        echo "  WARNING: certbot failed. Run manually: sudo certbot --nginx -d $DOMAIN"
    fi

    DASHBOARD_URL="https://$DOMAIN?token=$TOKEN"
  else
    echo "  WARNING: nginx not found. Install nginx first."
  fi
fi

echo ""
echo "================================================================"
echo "  Client '$CLIENT_NAME' is LIVE!"
echo "================================================================"
echo ""
echo "  Dashboard URL:"
echo "    $DASHBOARD_URL"
echo ""
if [ -n "$DOMAIN" ]; then
  echo "  Domain: https://$DOMAIN"
  echo ""
fi
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
