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

if [ -d "$CREDS_DIR" ]; then
  mkdir -p "$BACKUP_DIR/credentials/whatsapp"
  cp -R "$CREDS_DIR" "$BACKUP_DIR/credentials/whatsapp/$ACCOUNT_ID"
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
