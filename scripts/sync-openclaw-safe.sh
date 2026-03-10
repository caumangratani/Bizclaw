#!/usr/bin/env bash
set -euo pipefail

# Safe upstream sync flow for BizClaw.
# Updates the OpenClaw submodule pointer, rebuilds BizClaw, and creates a local checkpoint.
#
# Usage:
#   ./scripts/sync-openclaw-safe.sh
#   ./scripts/sync-openclaw-safe.sh <ref>
#
# Example:
#   ./scripts/sync-openclaw-safe.sh origin/main

TARGET_REF="${1:-origin/main}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SYNC_BRANCH="codex/openclaw-sync-$(date +%Y%m%d-%H%M%S)"

cd "$ROOT_DIR"

if [ -n "$(git status --short --untracked-files=no | grep -v '^ m openclaw' || true)" ]; then
  echo "Error: wrapper repo has uncommitted changes."
  echo "Commit or stash them before syncing upstream."
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"

echo "Creating sync branch: $SYNC_BRANCH"
git switch -c "$SYNC_BRANCH"

echo "Fetching latest OpenClaw..."
git -C openclaw fetch origin

CURRENT_SUBMODULE="$(git -C openclaw rev-parse HEAD)"
TARGET_COMMIT="$(git -C openclaw rev-parse "$TARGET_REF")"

if [ "$CURRENT_SUBMODULE" = "$TARGET_COMMIT" ]; then
  echo "OpenClaw submodule already at $TARGET_REF"
  git switch "$CURRENT_BRANCH"
  git branch -D "$SYNC_BRANCH"
  exit 0
fi

echo "Updating submodule:"
echo "  current: $CURRENT_SUBMODULE"
echo "  target:  $TARGET_COMMIT"

git -C openclaw checkout "$TARGET_COMMIT"

echo ""
echo "Recent upstream changes:"
git -C openclaw log --oneline --decorate --max-count=20 "$CURRENT_SUBMODULE..$TARGET_COMMIT" || true

echo ""
echo "Rebuilding BizClaw..."
"$ROOT_DIR/scripts/build.sh"

git add openclaw
git commit -m "chore: sync OpenClaw to $(git -C openclaw rev-parse --short HEAD)"

echo ""
echo "Upstream sync ready on branch: $SYNC_BRANCH"
echo "Review the branch, test the local stack, then merge to main."
