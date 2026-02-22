#!/usr/bin/env bash
set -euo pipefail

# Deploy a BizClaw instance for a specific client

if [ -z "${1:-}" ]; then
  echo "Usage: ./docker/deploy-client.sh <client-id>"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found. Create with: ./scripts/new-client.sh $CLIENT_ID"
  exit 1
fi

echo "=== Deploying BizClaw for client: $CLIENT_ID ==="

# Use client-specific soul if exists, otherwise default
SOUL_FILE="$CLIENT_DIR/soul.md"
if [ ! -f "$SOUL_FILE" ]; then
  SOUL_FILE="$ROOT_DIR/overlay/config/SOUL.md"
fi

docker compose -f "$SCRIPT_DIR/docker-compose.yml" \
  -p "bizclaw-$CLIENT_ID" \
  up -d --build

echo "BizClaw deployed for $CLIENT_ID"
echo "Gateway: ws://localhost:18789"
echo "Dashboard: http://localhost:18790"
