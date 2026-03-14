#!/usr/bin/env bash
set -euo pipefail

# ================================================================
#  BizClaw VPS Setup — One Command to Go Live
#  Bizgenix AI Solutions Pvt. Ltd.
#
#  Usage (on a fresh Ubuntu 22.04+ VPS):
#    curl -sSL https://raw.githubusercontent.com/caumangratani/Bizclaw/main/scripts/setup-vps.sh | sudo bash
#
#  Or clone and run:
#    git clone https://github.com/caumangratani/Bizclaw.git /opt/bizclaw-repo
#    sudo bash /opt/bizclaw-repo/scripts/setup-vps.sh
#
#  What this does:
#    1. Installs Node.js 22 + pnpm
#    2. Clones BizClaw (if not already cloned)
#    3. Initializes OpenClaw submodule
#    4. Builds BizClaw (merges OpenClaw + overlay)
#    5. Creates systemd service
#    6. Sets up Caddy reverse proxy with auto-HTTPS
#    7. Prints next steps (add API keys, create clients)
# ================================================================

BIZCLAW_REPO="https://github.com/caumangratani/Bizclaw.git"
BIZCLAW_DIR="/opt/bizclaw"
BIZCLAW_USER="bizclaw"
ADMIN_PORT=18800

echo ""
echo "================================================================"
echo "  BizClaw VPS Setup"
echo "  Bizgenix AI Solutions Pvt. Ltd."
echo "================================================================"
echo ""

# -- Check root --
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Run as root: sudo bash setup-vps.sh"
  exit 1
fi

# -- Detect OS --
if [ ! -f /etc/os-release ]; then
  echo "ERROR: Only Ubuntu/Debian supported"
  exit 1
fi
. /etc/os-release
echo "OS: $PRETTY_NAME"

# ================================================================
# Step 1: Install Node.js 22
# ================================================================
echo ""
echo "[1/7] Installing Node.js 22..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js $(node -v) ready"

# ================================================================
# Step 2: Install OpenClaw globally (compiled release with WhatsApp/Telegram)
# ================================================================
echo "[2/7] Installing OpenClaw runtime..."
npm install -g openclaw 2>/dev/null || true
OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
echo "  OpenClaw $OPENCLAW_VERSION installed"

# Also install pnpm in case build from source is needed later
npm install -g pnpm 2>/dev/null || true

# ================================================================
# Step 3: Clone or update BizClaw
# ================================================================
echo "[3/7] Setting up BizClaw repo..."
if [ -d "$BIZCLAW_DIR/.git" ]; then
  echo "  Repo exists, pulling latest..."
  cd "$BIZCLAW_DIR"
  git pull origin main 2>/dev/null || true
elif [ -d "$BIZCLAW_DIR" ] && [ ! -d "$BIZCLAW_DIR/.git" ]; then
  # Directory exists but isn't a git repo — could be from install-vps.sh
  echo "  Existing directory found (non-git). Cloning fresh..."
  BACKUP_DIR="/opt/bizclaw-backup-$(date +%s)"
  mv "$BIZCLAW_DIR" "$BACKUP_DIR"
  git clone "$BIZCLAW_REPO" "$BIZCLAW_DIR"
  echo "  Previous files backed up to $BACKUP_DIR"
else
  git clone "$BIZCLAW_REPO" "$BIZCLAW_DIR"
fi

cd "$BIZCLAW_DIR"
git checkout main 2>/dev/null || true

# ================================================================
# Step 4: Initialize submodule
# ================================================================
echo "[4/7] Initializing OpenClaw submodule..."
git submodule update --init --recursive
echo "  OpenClaw submodule ready"

# ================================================================
# Step 5: Build BizClaw (patch control-ui for white-label)
# ================================================================
echo "[5/7] Building BizClaw..."
bash scripts/build.sh
echo "  Build complete"

# Patch control-ui with BizClaw branding
echo "  Patching control-ui branding..."
bash scripts/patch-control-ui.sh 2>/dev/null || echo "  Warning: control-ui patch skipped (will use bootstrap.js fallback)"

# ================================================================
# Step 6: Create bizclaw user + systemd services
# ================================================================
echo "[6/7] Setting up system user and services..."

# Create user
if ! id "$BIZCLAW_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$BIZCLAW_USER"
fi

# Create directories
mkdir -p /var/log/bizclaw
mkdir -p /home/$BIZCLAW_USER/.bizclaw
chown -R $BIZCLAW_USER:$BIZCLAW_USER /var/log/bizclaw /home/$BIZCLAW_USER

# Install admin panel dependencies
if [ -d "$BIZCLAW_DIR/admin" ]; then
  cd "$BIZCLAW_DIR/admin"
  npm install --production 2>/dev/null || true
  cd "$BIZCLAW_DIR"
fi

# Create admin panel systemd service
cat > /etc/systemd/system/bizclaw-admin.service <<EOF
[Unit]
Description=BizClaw Admin Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$BIZCLAW_DIR/admin
ExecStart=/usr/bin/node $BIZCLAW_DIR/admin/server.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bizclaw-admin
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create template systemd service for per-client instances
# Uses globally installed openclaw (npm -g) with per-client config
cat > /etc/systemd/system/bizclaw-client@.service <<'EOF'
[Unit]
Description=BizClaw Client %i
After=network.target

[Service]
Type=simple
User=bizclaw
WorkingDirectory=/opt/bizclaw
ExecStart=/bin/bash /opt/bizclaw/scripts/run-client-vps.sh %i
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bizclaw-%i
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bizclaw-admin

# Set permissions
chown -R $BIZCLAW_USER:$BIZCLAW_USER "$BIZCLAW_DIR/clients" 2>/dev/null || true
chown -R $BIZCLAW_USER:$BIZCLAW_USER "$BIZCLAW_DIR/build" 2>/dev/null || true

# ================================================================
# Step 7: Install Caddy (reverse proxy with auto-HTTPS)
# ================================================================
echo "[7/7] Installing Caddy reverse proxy..."
if ! command -v caddy &>/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl 2>/dev/null
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg 2>/dev/null || true
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list 2>/dev/null || true
  apt-get update 2>/dev/null
  apt-get install -y caddy 2>/dev/null || echo "  Caddy install optional — skip if firewall handles SSL"
fi

# Create Caddy config (will be updated per-client)
mkdir -p /etc/caddy
cat > /etc/caddy/Caddyfile <<'EOF'
# BizClaw Reverse Proxy
# Add client domains below. Caddy auto-provisions HTTPS.
#
# Example (uncomment and replace):
# sharma-traders.bizclaw.in {
#     reverse_proxy localhost:18789
# }
#
# admin.bizclaw.in {
#     reverse_proxy localhost:18800
# }

:80 {
    respond "BizClaw VPS Ready" 200
}
EOF

systemctl enable caddy 2>/dev/null || true
systemctl restart caddy 2>/dev/null || true

# ================================================================
# Setup log rotation
# ================================================================
cat > /etc/logrotate.d/bizclaw <<EOF
/var/log/bizclaw/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
EOF

echo ""
echo "================================================================"
echo "  BizClaw VPS Setup Complete!"
echo "================================================================"
echo ""
echo "  Repo:      $BIZCLAW_DIR"
echo "  Build:     $BIZCLAW_DIR/build"
echo "  Clients:   $BIZCLAW_DIR/clients/"
echo "  Admin:     http://YOUR-IP:$ADMIN_PORT"
echo ""
echo "  ============================================"
echo "  NEXT STEPS TO GO LIVE:"
echo "  ============================================"
echo ""
echo "  1. SET ADMIN PASSWORD:"
echo "     Generate hash:"
echo "       node -e \"require('bcryptjs').hash('YOUR_PASSWORD',10).then(h=>console.log(h))\""
echo "     Then add to /opt/bizclaw/admin/config.json:"
echo "       {\"adminPasswordHash\": \"PASTE_HASH_HERE\"}"
echo "     Start admin: sudo systemctl start bizclaw-admin"
echo ""
echo "  2. CREATE YOUR FIRST CLIENT:"
echo "     cd $BIZCLAW_DIR"
echo "     ./scripts/new-client.sh sharma-traders \"Sharma Traders\" \"Trading\" \"+919876543210\""
echo ""
echo "  3. ADD API KEYS:"
echo "     nano $BIZCLAW_DIR/clients/sharma-traders/.env"
echo "     Add: ANTHROPIC_API_KEY=sk-ant-..."
echo ""
echo "  4. START THE CLIENT:"
echo "     sudo systemctl start bizclaw-client@sharma-traders"
echo "     sudo systemctl enable bizclaw-client@sharma-traders"
echo ""
echo "  5. OPEN DASHBOARD & LINK WHATSAPP:"
echo "     http://YOUR-IP:18789?token=CHECK_CLIENT_ENV"
echo "     Go to Channels > WhatsApp > Scan QR"
echo ""
echo "  6. (OPTIONAL) ADD DOMAIN + HTTPS:"
echo "     Point DNS: sharma-traders.bizclaw.in → YOUR-IP"
echo "     Edit /etc/caddy/Caddyfile:"
echo "       sharma-traders.bizclaw.in { reverse_proxy localhost:18789 }"
echo "     sudo systemctl reload caddy"
echo ""
echo "  USEFUL COMMANDS:"
echo "    Status:     sudo systemctl status bizclaw-client@CLIENT-ID"
echo "    Logs:       sudo journalctl -u bizclaw-client@CLIENT-ID -f"
echo "    All status: $BIZCLAW_DIR/scripts/status-all.sh"
echo "    New client: $BIZCLAW_DIR/scripts/new-client.sh ID NAME TYPE PHONE"
echo ""
echo "  Need help? Contact: hello@bizgenix.in"
echo ""
