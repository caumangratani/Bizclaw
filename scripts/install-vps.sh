#!/usr/bin/env bash
set -euo pipefail

# BizClaw VPS Installation Script
# Installs BizClaw directly on a VPS (Ubuntu/Debian) without Docker
#
# Usage: curl -sSL https://bizclaw.in/install.sh | bash
#   or:  ./scripts/install-vps.sh
#
# Requirements: Ubuntu 22.04+ or Debian 12+, root/sudo access

BIZCLAW_DIR="/opt/bizclaw"
BIZCLAW_USER="bizclaw"
BIZCLAW_PORT="${BIZCLAW_PORT:-18789}"

echo "================================================================"
echo "  BizClaw VPS Installer"
echo "  Bizgenix AI Solutions Pvt. Ltd."
echo "================================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo ./scripts/install-vps.sh"
  exit 1
fi

# Step 1: Install Node.js 22
echo "[1/6] Installing Node.js 22..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js $(node -v) installed"

# Step 2: Install pnpm
echo "[2/6] Installing pnpm..."
npm install -g pnpm 2>/dev/null || true
echo "  pnpm $(pnpm -v) installed"

# Step 3: Create bizclaw user
echo "[3/6] Creating bizclaw user..."
if ! id "$BIZCLAW_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$BIZCLAW_USER"
fi

# Step 4: Setup directory structure
echo "[4/6] Setting up directories..."
mkdir -p "$BIZCLAW_DIR"
mkdir -p "/home/$BIZCLAW_USER/.openclaw"
mkdir -p "/home/$BIZCLAW_USER/workspace"
mkdir -p "/var/log/bizclaw"

# Copy BizClaw files (if running from repo)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -d "$ROOT_DIR/build" ]; then
  echo "  Copying BizClaw build..."
  cp -R "$ROOT_DIR/build/"* "$BIZCLAW_DIR/"
  cd "$BIZCLAW_DIR" && pnpm install --prod 2>/dev/null || npm install --production
fi

if [ -d "$ROOT_DIR/overlay" ]; then
  echo "  Copying overlay..."
  cp -R "$ROOT_DIR/overlay" "$BIZCLAW_DIR/overlay"
fi

# Copy workspace defaults
if [ -f "$ROOT_DIR/overlay/soul/SOUL.md" ]; then
  cp "$ROOT_DIR/overlay/soul/SOUL.md" "/home/$BIZCLAW_USER/workspace/SOUL.md"
fi
if [ -f "$ROOT_DIR/clients/TEMPLATE/AGENTS.md" ]; then
  cp "$ROOT_DIR/clients/TEMPLATE/AGENTS.md" "/home/$BIZCLAW_USER/workspace/AGENTS.md"
fi
if [ -f "$ROOT_DIR/clients/TEMPLATE/openclaw.json" ]; then
  sed "s/TEMPLATE/vps/g" "$ROOT_DIR/clients/TEMPLATE/openclaw.json" > "/home/$BIZCLAW_USER/.openclaw/openclaw.json"
fi

chown -R "$BIZCLAW_USER:$BIZCLAW_USER" "$BIZCLAW_DIR" "/home/$BIZCLAW_USER" "/var/log/bizclaw"

# Step 5: Create systemd service
echo "[5/6] Creating systemd service..."
cat > /etc/systemd/system/bizclaw.service <<EOF
[Unit]
Description=BizClaw AI Business Assistant
After=network.target

[Service]
Type=simple
User=$BIZCLAW_USER
WorkingDirectory=$BIZCLAW_DIR
ExecStart=/usr/bin/node openclaw.mjs gateway --allow-unconfigured
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bizclaw

# Environment
Environment=NODE_ENV=production
Environment=OPENCLAW_STATE_DIR=/home/$BIZCLAW_USER/.openclaw
Environment=OPENCLAW_CONFIG_PATH=/home/$BIZCLAW_USER/.openclaw/openclaw.json
Environment=OPENCLAW_WORKSPACE_DIR=/home/$BIZCLAW_USER/workspace
Environment=OPENCLAW_GATEWAY_PORT=$BIZCLAW_PORT
EnvironmentFile=-/home/$BIZCLAW_USER/.env

# Security
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/home/$BIZCLAW_USER $BIZCLAW_DIR /var/log/bizclaw

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable bizclaw

# Step 6: Setup log rotation
echo "[6/6] Setting up log rotation..."
cat > /etc/logrotate.d/bizclaw <<EOF
/var/log/bizclaw/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 $BIZCLAW_USER $BIZCLAW_USER
}
EOF

echo ""
echo "================================================================"
echo "  BizClaw installed successfully!"
echo "================================================================"
echo ""
echo "  Install directory: $BIZCLAW_DIR"
echo "  Config: /home/$BIZCLAW_USER/.openclaw/"
echo "  Workspace: /home/$BIZCLAW_USER/workspace/"
echo "  Logs: journalctl -u bizclaw -f"
echo ""
echo "  Next steps:"
echo "    1. Add your .env file:"
echo "       nano /home/$BIZCLAW_USER/.env"
echo "       (add OPENCLAW_GATEWAY_TOKEN, ANTHROPIC_API_KEY, optional OPENAI_API_KEY, etc.)"
echo ""
echo "    2. Start BizClaw:"
echo "       sudo systemctl start bizclaw"
echo ""
echo "    3. Open dashboard:"
echo "       http://YOUR-SERVER-IP:$BIZCLAW_PORT"
echo "       http://YOUR-SERVER-IP:$BIZCLAW_PORT?token=YOUR_GATEWAY_TOKEN"
echo ""
echo "  Useful commands:"
echo "    Status:  sudo systemctl status bizclaw"
echo "    Logs:    sudo journalctl -u bizclaw -f"
echo "    Restart: sudo systemctl restart bizclaw"
echo "    Stop:    sudo systemctl stop bizclaw"
echo ""
