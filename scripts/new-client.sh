#!/usr/bin/env bash
set -euo pipefail

# BizClaw New Client Setup
# Creates a new client directory from template

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/new-client.sh <client-id>"
  echo "Example: ./scripts/new-client.sh acme-textiles"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENTS_DIR="$ROOT_DIR/clients"
CLIENT_DIR="$CLIENTS_DIR/$CLIENT_ID"

if [ -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' already exists at $CLIENT_DIR"
  exit 1
fi

echo "=== Creating new BizClaw client: $CLIENT_ID ==="

# Copy template
cp -R "$CLIENTS_DIR/TEMPLATE" "$CLIENT_DIR"

# Create data directory
mkdir -p "$CLIENT_DIR/data"

# Create logs directory
mkdir -p "$CLIENT_DIR/logs"

# Update client ID in config
sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"

# Set creation date
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i '' "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"

echo "Client created: $CLIENT_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit $CLIENT_DIR/config.json with client details"
echo "  2. Customize $CLIENT_DIR/soul.md for client-specific personality"
echo "  3. Configure $CLIENT_DIR/channels.json for enabled channels"
echo "  4. Configure $CLIENT_DIR/skills.json for enabled skills"
