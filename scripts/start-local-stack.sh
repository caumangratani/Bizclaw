#!/usr/bin/env bash
set -euo pipefail

# Starts the full BizClaw local demo stack:
# - website on 4173
# - admin on 18800
# - chosen client gateway on its configured port
#
# Usage:
#   ./scripts/start-local-stack.sh
#   ./scripts/start-local-stack.sh demo-local

CLIENT_ID="${1:-demo-local}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LOCAL_DIR="$ROOT_DIR/.local"
PID_DIR="$LOCAL_DIR/pids"
LOG_DIR="$LOCAL_DIR/logs"
WEBSITE_PORT=4173
ADMIN_PORT=18800

mkdir -p "$PID_DIR" "$LOG_DIR"

start_if_needed() {
  local name="$1"
  local port="$2"
  local cmd="$3"
  local workdir="$4"
  local pidfile="$PID_DIR/$name.pid"
  local logfile="$LOG_DIR/$name.log"

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "$name already listening on $port"
    return
  fi

  echo "Starting $name on $port"
  (
    cd "$workdir"
    nohup sh -c "$cmd" >"$logfile" 2>&1 &
    echo $! >"$pidfile"
  )
}

CLIENT_PORT="$(grep '^BIZCLAW_PORT=' "$ROOT_DIR/clients/$CLIENT_ID/.env" | cut -d= -f2)"

start_if_needed "website" "$WEBSITE_PORT" "python3 -m http.server $WEBSITE_PORT --bind 127.0.0.1" "$ROOT_DIR/website"
start_if_needed "admin" "$ADMIN_PORT" "npm start" "$ROOT_DIR/admin"
start_if_needed "client-$CLIENT_ID" "$CLIENT_PORT" "\"$ROOT_DIR/scripts/run-client-local.sh\" \"$CLIENT_ID\"" "$ROOT_DIR"

echo ""
echo "BizClaw local stack"
echo ""
echo "Website:   http://127.0.0.1:$WEBSITE_PORT"
echo "Admin:     http://127.0.0.1:$ADMIN_PORT/login"
"$ROOT_DIR/scripts/client-launch-url.sh" "$CLIENT_ID"
