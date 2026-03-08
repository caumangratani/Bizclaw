#!/usr/bin/env bash
set -euo pipefail

# BizClaw — Reset Client Memory
# Wipes sessions, memory, and chat history while keeping config intact
#
# Usage: ./scripts/reset-client.sh <client-id>
# Use when: personality changed, stuck sessions, fresh start needed

if [ -z "${1:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — Reset Client Memory"
  echo "  Bizgenix AI Solutions Pvt. Ltd."
  echo "================================================================"
  echo ""
  echo "Usage: ./scripts/reset-client.sh <client-id>"
  echo ""
  echo "This wipes sessions, memory, and chat history."
  echo "Config files (openclaw.json, soul.md, .env) are NOT touched."
  echo "WhatsApp session is NOT touched (phone stays connected)."
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  exit 1
fi

echo "================================================================"
echo "  Reset client: $CLIENT_ID"
echo "================================================================"
echo ""
echo "  This will DELETE:"
echo "    - Sessions (chat history)"
echo "    - Memory (stored facts)"
echo "    - Cached context"
echo "    - Logs"
echo ""
echo "  This will KEEP:"
echo "    - openclaw.json (config)"
echo "    - soul.md (personality)"
echo "    - AGENTS.md (instructions)"
echo "    - .env (API keys, tokens)"
echo "    - WhatsApp session (phone stays connected)"
echo ""
read -p "  Are you sure? Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "  Cancelled."
  exit 0
fi

echo ""
echo "Resetting..."

# Stop container if running
CONTAINER_NAME="bizclaw-$CLIENT_ID"
if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" 2>/dev/null | grep -q "$CONTAINER_NAME"; then
  echo "  Stopping container..."
  docker compose -p "bizclaw-$CLIENT_ID" stop 2>/dev/null || true
fi

# Wipe sessions
if [ -d "$CLIENT_DIR/data/sessions" ]; then
  echo "  Wiping sessions..."
  rm -rf "$CLIENT_DIR/data/sessions"
  mkdir -p "$CLIENT_DIR/data/sessions"
fi

# Wipe memory
if [ -d "$CLIENT_DIR/data/memory" ]; then
  echo "  Wiping memory..."
  rm -rf "$CLIENT_DIR/data/memory"
  mkdir -p "$CLIENT_DIR/data/memory"
fi

# Wipe OpenClaw state (agents, sessions cache)
# But keep whatsapp-session directory
if [ -d "$CLIENT_DIR/data" ]; then
  echo "  Cleaning cached state..."
  # Remove agent state dirs but not config or whatsapp-session
  find "$CLIENT_DIR/data" -maxdepth 1 -type d \
    -not -name "data" \
    -not -name "workspace" \
    -not -name "whatsapp-session" \
    -not -name "sessions" \
    -not -name "memory" \
    -exec rm -rf {} + 2>/dev/null || true
fi

# Clear logs
if [ -d "$CLIENT_DIR/logs" ]; then
  echo "  Clearing logs..."
  rm -f "$CLIENT_DIR/logs"/*
fi

# Re-copy workspace files from template
echo "  Refreshing workspace files..."
cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md" 2>/dev/null || true
cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md" 2>/dev/null || true

echo ""
echo "Reset complete!"
echo ""
echo "  To restart: ./docker/deploy-client.sh $CLIENT_ID"
echo "  Or: docker compose -p bizclaw-$CLIENT_ID up -d"
echo ""
