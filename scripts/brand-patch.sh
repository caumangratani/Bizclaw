#!/usr/bin/env bash
set -euo pipefail

# BizClaw Brand Patch Script
# Replaces OpenClaw/Clawdbot branding with BizClaw/Bizgenix in built output

BUILD_DIR="${1:-./build}"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory '$BUILD_DIR' not found."
  echo "Usage: ./scripts/brand-patch.sh <build-dir>"
  exit 1
fi

echo "=== BizClaw Brand Patch ==="
echo "Patching directory: $BUILD_DIR"

# String replacements (case-sensitive, most specific first)
declare -A REPLACEMENTS=(
  ["OpenClaw"]="BizClaw"
  ["openclaw"]="bizclaw"
  ["OPENCLAW"]="BIZCLAW"
  ["Clawdbot"]="BizClaw"
  ["clawdbot"]="bizclaw"
  ["CLAWDBOT"]="BIZCLAW"
  ["Moltbot"]="BizClaw"
  ["moltbot"]="bizclaw"
  ["MOLTBOT"]="BIZCLAW"
)

# File types to patch (text-based only)
FILE_PATTERNS="*.js *.mjs *.cjs *.ts *.json *.html *.css *.md *.txt *.yaml *.yml *.toml"

for old in "${!REPLACEMENTS[@]}"; do
  new="${REPLACEMENTS[$old]}"
  echo "  Replacing '$old' -> '$new'"

  for pattern in $FILE_PATTERNS; do
    find "$BUILD_DIR" -name "$pattern" -type f -exec \
      sed -i '' "s/${old}/${new}/g" {} + 2>/dev/null || true
  done
done

# Copy branding assets if they exist
BRANDING_DIR="./overlay/branding"
if [ -d "$BRANDING_DIR" ]; then
  echo "  Copying branding assets..."

  # Copy icons to control-ui if it exists
  if [ -d "$BUILD_DIR/dist/control-ui" ]; then
    cp -f "$BRANDING_DIR"/*.png "$BUILD_DIR/dist/control-ui/" 2>/dev/null || true
    cp -f "$BRANDING_DIR"/*.svg "$BUILD_DIR/dist/control-ui/" 2>/dev/null || true
  fi
fi

echo "=== Brand patch complete ==="
