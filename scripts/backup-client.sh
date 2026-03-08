#!/usr/bin/env bash
set -euo pipefail

# BizClaw Client Backup Script
# Creates timestamped backup of client data with retention policy
#
# Usage: ./scripts/backup-client.sh <client-id> [backup-dir]
# Cron:  0 2 * * * /path/to/scripts/backup-client.sh client-id /path/to/backups

if [ -z "${1:-}" ]; then
  echo "================================================================"
  echo "  BizClaw — Client Backup"
  echo "  Bizgenix AI Solutions Pvt. Ltd."
  echo "================================================================"
  echo ""
  echo "Usage: ./scripts/backup-client.sh <client-id> [backup-dir]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/backup-client.sh sharma-traders"
  echo "  ./scripts/backup-client.sh sharma-traders /mnt/backups"
  echo ""
  echo "Cron (daily 2am):"
  echo "  0 2 * * * /opt/bizclaw/scripts/backup-client.sh sharma /opt/bizclaw/backups"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"
BACKUP_DIR="${2:-$ROOT_DIR/backups}"

# Retention settings
DAILY_KEEP=7
WEEKLY_KEEP=4

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found at $CLIENT_DIR"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR/$CLIENT_ID"

# Generate backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
BACKUP_FILE="$BACKUP_DIR/$CLIENT_ID/bizclaw-${CLIENT_ID}-${TIMESTAMP}.tar.gz"

echo "Backing up client: $CLIENT_ID"
echo "  Source: $CLIENT_DIR"
echo "  Target: $BACKUP_FILE"

# Create tarball (config + data, exclude logs and temp files)
tar -czf "$BACKUP_FILE" \
  -C "$ROOT_DIR/clients" \
  --exclude="$CLIENT_ID/logs/*" \
  --exclude="$CLIENT_ID/data/sessions/*/tmp*" \
  "$CLIENT_ID/"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  Backup created: $BACKUP_SIZE"

# Mark Sunday backups as weekly (don't delete in daily rotation)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  WEEKLY_FILE="$BACKUP_DIR/$CLIENT_ID/weekly-${CLIENT_ID}-${TIMESTAMP}.tar.gz"
  cp "$BACKUP_FILE" "$WEEKLY_FILE"
  echo "  Weekly backup saved: $WEEKLY_FILE"
fi

# Cleanup: remove daily backups older than DAILY_KEEP days
echo "  Cleaning old daily backups (keeping last $DAILY_KEEP)..."
ls -t "$BACKUP_DIR/$CLIENT_ID"/bizclaw-${CLIENT_ID}-*.tar.gz 2>/dev/null | \
  tail -n +$((DAILY_KEEP + 1)) | \
  xargs rm -f 2>/dev/null || true

# Cleanup: remove weekly backups older than WEEKLY_KEEP
echo "  Cleaning old weekly backups (keeping last $WEEKLY_KEEP)..."
ls -t "$BACKUP_DIR/$CLIENT_ID"/weekly-${CLIENT_ID}-*.tar.gz 2>/dev/null | \
  tail -n +$((WEEKLY_KEEP + 1)) | \
  xargs rm -f 2>/dev/null || true

echo ""
echo "Backup complete!"
echo ""
echo "  To restore:"
echo "    tar -xzf $BACKUP_FILE -C $ROOT_DIR/clients/"
echo ""
