#!/usr/bin/env bash
set -euo pipefail

# Deploy a BizClaw client via Docker
# Usage: ./docker/deploy-client.sh <client-id> [--no-build]
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - Client created via: ./scripts/new-client.sh <client-id>
#   - API keys and secrets in: clients/<client-id>/.env

CLIENT_ID="${1:-}"

if [ -z "$CLIENT_ID" ]; then
  echo "Usage: ./docker/deploy-client.sh <client-id> [--no-build]"
  echo ""
  echo "Prerequisites:"
  echo "  1. Build BizClaw: ./scripts/build.sh"
  echo "  2. Create client: ./scripts/new-client.sh <client-id>"
  echo "  3. Add API keys to: clients/<client-id>/.env"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  echo "Create it first: ./scripts/new-client.sh $CLIENT_ID"
  exit 1
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "Error: Missing $CLIENT_DIR/.env — add API keys and GATEWAY_TOKEN first."
  exit 1
fi

if [ ! -d "$ROOT_DIR/build" ]; then
  echo "Building BizClaw..."
  "$ROOT_DIR/scripts/build.sh"
fi

echo "Copying build artifacts to docker context..."
mkdir -p "$ROOT_DIR/docker/build"
cp -R "$ROOT_DIR/build/"* "$ROOT_DIR/docker/build/"

echo "Deploying $CLIENT_ID via Docker Compose..."
cd "$SCRIPT_DIR"

CLIENT_ID="$CLIENT_ID" docker compose \
  -f docker-compose.yml \
  -f docker-compose.multi.yml \
  up -d --build

echo ""
"$ROOT_DIR/scripts/client-launch-url.sh" "$CLIENT_ID"
echo ""
echo "Logs: docker logs bizclaw-${CLIENT_ID}"
echo "Stop: docker compose -f docker/docker-compose.yml -f docker-compose.multi.yml down"
