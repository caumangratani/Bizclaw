#!/usr/bin/env bash
set -euo pipefail

# BizClaw — All Clients Status Monitor
# Shows health status of all deployed BizClaw clients
#
# Usage: ./scripts/status-all.sh
# Cron:  */5 * * * * /path/to/scripts/status-all.sh --quiet

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENTS_DIR="$ROOT_DIR/clients"
QUIET="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Color
BOLD='\033[1m'

ANY_DOWN=0

if [ "$QUIET" != "--quiet" ]; then
  echo "================================================================"
  echo "  BizClaw — Client Status Monitor"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "================================================================"
  echo ""
  printf "  ${BOLD}%-20s %-10s %-8s %-12s${NC}\n" "CLIENT" "STATUS" "PORT" "CONTAINER"
  printf "  %-20s %-10s %-8s %-12s\n" "--------------------" "----------" "--------" "------------"
fi

# Loop through all client directories (skip TEMPLATE)
for CLIENT_PATH in "$CLIENTS_DIR"/*/; do
  CLIENT_ID=$(basename "$CLIENT_PATH")

  # Skip TEMPLATE
  [ "$CLIENT_ID" = "TEMPLATE" ] && continue

  # Check if .env exists to get port
  PORT="?"
  if [ -f "$CLIENT_PATH/.env" ]; then
    PORT=$(grep "^BIZCLAW_PORT=" "$CLIENT_PATH/.env" 2>/dev/null | cut -d= -f2 || echo "18789")
    PORT="${PORT:-18789}"
  fi

  # Check Docker container status
  CONTAINER_NAME="bizclaw-$CLIENT_ID"
  CONTAINER_STATUS="not found"
  STATUS_COLOR="$RED"
  STATUS_TEXT="DOWN"

  if command -v docker &>/dev/null; then
    CONTAINER_INFO=$(docker ps --filter "name=$CONTAINER_NAME" --format "{{.Status}}" 2>/dev/null || echo "")
    if [ -n "$CONTAINER_INFO" ]; then
      CONTAINER_STATUS="$CONTAINER_INFO"

      # Try health check
      if [ "$PORT" != "?" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ]; then
          STATUS_COLOR="$GREEN"
          STATUS_TEXT="UP"
        else
          STATUS_COLOR="$YELLOW"
          STATUS_TEXT="DEGRADED"
          ANY_DOWN=1
        fi
      else
        STATUS_COLOR="$GREEN"
        STATUS_TEXT="RUNNING"
      fi
    else
      ANY_DOWN=1
    fi
  else
    # No Docker — check if running as systemd service
    if systemctl is-active --quiet "bizclaw-$CLIENT_ID" 2>/dev/null; then
      STATUS_COLOR="$GREEN"
      STATUS_TEXT="UP"
      CONTAINER_STATUS="systemd"
    elif systemctl is-active --quiet "bizclaw" 2>/dev/null; then
      STATUS_COLOR="$GREEN"
      STATUS_TEXT="UP"
      CONTAINER_STATUS="systemd"
    else
      ANY_DOWN=1
    fi
  fi

  if [ "$QUIET" != "--quiet" ]; then
    printf "  %-20s ${STATUS_COLOR}%-10s${NC} %-8s %-12s\n" \
      "$CLIENT_ID" "$STATUS_TEXT" "$PORT" "${CONTAINER_STATUS:0:12}"
  fi
done

if [ "$QUIET" != "--quiet" ]; then
  echo ""
  if [ $ANY_DOWN -eq 1 ]; then
    echo -e "  ${RED}Some clients are DOWN. Check with: docker compose -p bizclaw-<id> logs${NC}"
  else
    echo -e "  ${GREEN}All clients healthy! ⚡${NC}"
  fi
  echo ""
fi

# Exit with error if any client is down (useful for monitoring)
exit $ANY_DOWN
