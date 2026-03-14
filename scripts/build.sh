#!/usr/bin/env bash
set -euo pipefail

# BizClaw Build Script
# Merges OpenClaw core with BizClaw overlay to produce final product

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OPENCLAW_DIR="$ROOT_DIR/openclaw"
OVERLAY_DIR="$ROOT_DIR/overlay"
BUILD_DIR="$ROOT_DIR/build"

echo "=== BizClaw Build ==="
echo "Root: $ROOT_DIR"

# Step 1: Verify OpenClaw submodule
if [ ! -f "$OPENCLAW_DIR/package.json" ]; then
  echo "Error: OpenClaw submodule not initialized."
  echo "Run: git submodule update --init --recursive"
  exit 1
fi

# Step 2: Clean previous build
echo "Cleaning previous build..."
rm -rf "$BUILD_DIR"

# Step 3: Copy OpenClaw to build directory
echo "Copying OpenClaw to build directory..."
cp -R "$OPENCLAW_DIR" "$BUILD_DIR"
rm -rf "$BUILD_DIR/.git"

# Step 4: Install dependencies and build OpenClaw
echo "Installing dependencies..."
cd "$BUILD_DIR"

if command -v pnpm &> /dev/null; then
  pnpm install --frozen-lockfile
  echo "Building OpenClaw..."
  pnpm build
elif command -v npm &> /dev/null; then
  echo "pnpm not found, using npm..."
  npm install
  echo "Building OpenClaw..."
  npm run build
else
  echo "Error: Node.js package manager required. Install pnpm or npm."
  exit 1
fi

cd "$ROOT_DIR"

# Step 5: Apply BizClaw overlay
echo "Applying BizClaw overlay..."

# Copy workspace configuration files
WORKSPACE_DIR="$BUILD_DIR/workspace-defaults"
mkdir -p "$WORKSPACE_DIR"

if [ -f "$OVERLAY_DIR/config/SOUL.md" ]; then
  cp "$OVERLAY_DIR/config/SOUL.md" "$WORKSPACE_DIR/SOUL.md"
fi

if [ -f "$OVERLAY_DIR/config/AGENTS.md" ]; then
  cp "$OVERLAY_DIR/config/AGENTS.md" "$WORKSPACE_DIR/AGENTS.md"
fi

if [ -f "$OVERLAY_DIR/config/HEARTBEAT.md" ]; then
  cp "$OVERLAY_DIR/config/HEARTBEAT.md" "$WORKSPACE_DIR/HEARTBEAT.md"
fi

if [ -f "$OVERLAY_DIR/config/bizclaw.default.json" ]; then
  cp "$OVERLAY_DIR/config/bizclaw.default.json" "$WORKSPACE_DIR/bizclaw.default.json"
fi

# Copy custom skills
if [ -d "$OVERLAY_DIR/skills" ]; then
  echo "Copying custom skills..."
  cp -R "$OVERLAY_DIR/skills" "$WORKSPACE_DIR/skills"
fi

# Copy i18n files
if [ -d "$OVERLAY_DIR/i18n" ]; then
  echo "Copying i18n files..."
  cp -R "$OVERLAY_DIR/i18n" "$WORKSPACE_DIR/i18n"
fi

# Copy the runtime overlay into the packaged build so local and VPS runs
# resolve the same plugin/skill assets without depending on repo cwd.
if [ -d "$OVERLAY_DIR" ]; then
  echo "Copying runtime overlay..."
  cp -R "$OVERLAY_DIR" "$BUILD_DIR/overlay"
fi

# Step 6: Apply brand patch
echo "Applying brand patch..."
"$SCRIPT_DIR/brand-patch.sh" "$BUILD_DIR"

# Step 7: Update package.json
echo "Updating package.json..."
cd "$BUILD_DIR"
node -e "
const pkg = require('./package.json');
// Keep the internal package name stable for upstream runtime helpers that
// resolve the package root by name. Branding stays BizClaw via metadata/bin/UI.
pkg.name = 'openclaw';
pkg.description = 'BizClaw - AI Business Agent for Indian MSMEs by Bizgenix AI Solutions';
pkg.author = 'Bizgenix AI Solutions Pvt. Ltd. <hello@bizgenix.in>';
pkg.homepage = 'https://bizgenix.in';
pkg.bin = {
  ...(pkg.bin || {}),
  bizclaw: pkg.bin?.openclaw || './openclaw.mjs'
};
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
cd "$ROOT_DIR"

echo "=== BizClaw build complete ==="
echo "Output: $BUILD_DIR"
echo ""
echo "To test locally:"
echo "  cd $BUILD_DIR && node openclaw.mjs --help"
