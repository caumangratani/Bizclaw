#!/usr/bin/env bash
set -euo pipefail

# Print the exact BizClaw URLs to send to an operator or client.
# Usage:
#   ./scripts/client-launch-url.sh <client-id>
#   ./scripts/client-launch-url.sh <client-id> https://demo.bizclaw.in

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/client-launch-url.sh <client-id> [base-url]"
  exit 1
fi

CLIENT_ID="$1"
BASE_URL="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  exit 1
fi

if [ ! -f "$CLIENT_DIR/.env" ]; then
  echo "Error: Missing $CLIENT_DIR/.env"
  exit 1
fi

PORT=""
TOKEN=""

while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    ""|\#*) continue
      ;;
  esac

  key="${line%%=*}"
  value="${line#*=}"

  case "$key" in
    BIZCLAW_PORT) PORT="$value"
      ;;
    GATEWAY_TOKEN) TOKEN="$value"
      ;;
  esac
done < "$CLIENT_DIR/.env"

if [ -z "$PORT" ] || [ -z "$TOKEN" ]; then
  echo "Error: BIZCLAW_PORT or GATEWAY_TOKEN missing in $CLIENT_DIR/.env"
  exit 1
fi

if [ -z "$BASE_URL" ]; then
  BASE_URL="http://127.0.0.1:$PORT"
fi

BASE_URL="${BASE_URL%/}"

echo "BizClaw launch URLs for $CLIENT_ID"
echo ""
echo "Dashboard: $BASE_URL/?token=$TOKEN"
echo "Chat:      $BASE_URL/chat?token=$TOKEN"
echo "Channels:  $BASE_URL/channels?token=$TOKEN"
