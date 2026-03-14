#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

CLIENT_ID="${1:-}"
ACCOUNT_ID="${2:-default}"

if [ -z "$CLIENT_ID" ]; then
  echo "Usage: $0 <client-id> [account-id]"
  exit 1
fi

CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"
DATA_DIR="$CLIENT_DIR/data"
CREDS_DIR="$DATA_DIR/credentials/whatsapp/$ACCOUNT_ID"
SESSION_DIR="$DATA_DIR/whatsapp-session"
BACKUP_DIR="$DATA_DIR/backups/whatsapp-reset-$(date +%Y%m%d-%H%M%S)"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Client not found: $CLIENT_ID"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

resolve_auth_dir() {
  local config_file=""
  if [ -f "$DATA_DIR/openclaw.json" ]; then
    config_file="$DATA_DIR/openclaw.json"
  elif [ -f "$CLIENT_DIR/openclaw.json" ]; then
    config_file="$CLIENT_DIR/openclaw.json"
  fi

  if [ -n "$config_file" ]; then
    node - "$config_file" "$ACCOUNT_ID" <<'EOF'
const fs = require("fs");
const path = require("path");
const configFile = process.argv[2];
const accountId = process.argv[3] || "default";
const cfg = JSON.parse(fs.readFileSync(configFile, "utf8"));
const account = cfg?.channels?.whatsapp?.accounts?.[accountId];
let authDir = typeof account?.authDir === "string" ? account.authDir.trim() : "";
if (!authDir) process.exit(0);
const configDir = path.dirname(configFile);
if (path.basename(configDir) === "data" && authDir.startsWith("./data/")) {
  authDir = "." + authDir.slice("./data".length);
}
const base = configDir;
const resolved = path.resolve(base, authDir);
process.stdout.write(resolved);
EOF
  fi
}

CONFIGURED_AUTH_DIR="$(resolve_auth_dir || true)"
if [ -n "$CONFIGURED_AUTH_DIR" ]; then
  CREDS_DIR="$CONFIGURED_AUTH_DIR"
fi

if [ -d "$CREDS_DIR" ]; then
  mkdir -p "$(dirname "$BACKUP_DIR/configured-auth/$ACCOUNT_ID")"
  cp -R "$CREDS_DIR" "$BACKUP_DIR/configured-auth/$ACCOUNT_ID"
  rm -rf "$CREDS_DIR"
  echo "Cleared WhatsApp credentials: $CREDS_DIR"
else
  echo "No WhatsApp credentials found at: $CREDS_DIR"
fi

if [ -d "$SESSION_DIR" ]; then
  cp -R "$SESSION_DIR" "$BACKUP_DIR/whatsapp-session"
  rm -rf "$SESSION_DIR"
  echo "Cleared WhatsApp session cache: $SESSION_DIR"
else
  echo "No WhatsApp session cache found at: $SESSION_DIR"
fi

echo "Backup saved to: $BACKUP_DIR"
echo "Next step: restart the client runtime, then relink WhatsApp from Channels."
