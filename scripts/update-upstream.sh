#!/usr/bin/env bash
set -euo pipefail

# BizClaw Upstream Update Script
# Pulls latest OpenClaw changes into the submodule

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Updating OpenClaw Upstream ==="

cd "$ROOT_DIR"

# Fetch latest
echo "Fetching latest OpenClaw..."
cd openclaw
git fetch origin

# Show what's new
CURRENT=$(git rev-parse HEAD)
LATEST=$(git rev-parse origin/main)

if [ "$CURRENT" = "$LATEST" ]; then
  echo "Already up to date."
  exit 0
fi

echo ""
echo "Current: $CURRENT"
echo "Latest:  $LATEST"
echo ""
echo "Changes since last update:"
git log --oneline "$CURRENT..$LATEST" | head -20
echo ""

read -p "Update to latest? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  git checkout origin/main
  cd "$ROOT_DIR"
  git add openclaw
  git commit -m "chore: update OpenClaw submodule to $(cd openclaw && git rev-parse --short HEAD)"
  echo ""
  echo "Updated. Run ./scripts/build.sh to rebuild BizClaw."
else
  echo "Cancelled."
fi
