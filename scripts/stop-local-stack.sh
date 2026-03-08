#!/usr/bin/env bash
set -euo pipefail

# Stops processes started by start-local-stack.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$ROOT_DIR/.local/pids"

if [ ! -d "$PID_DIR" ]; then
  echo "No local stack pid directory found."
  exit 0
fi

for pidfile in "$PID_DIR"/*.pid; do
  [ -f "$pidfile" ] || continue
  pid="$(cat "$pidfile")"
  name="$(basename "$pidfile" .pid)"
  if kill -0 "$pid" >/dev/null 2>&1; then
    echo "Stopping $name ($pid)"
    kill "$pid" >/dev/null 2>&1 || true
  else
    echo "Skipping $name ($pid not running)"
  fi
done

echo "Local stack stop requested."
