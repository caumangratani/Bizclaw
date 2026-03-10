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

replace_in_file() {
  local old="$1"
  local new="$2"
  local file="$3"
  OLD_VALUE="$old" NEW_VALUE="$new" perl -0pi -e 'BEGIN { $old = $ENV{"OLD_VALUE"}; $new = $ENV{"NEW_VALUE"}; } s/\Q$old\E/$new/g' "$file"
}

# String replacements (case-sensitive, most specific first).
# Use a plain newline-delimited list so the script still runs on macOS's
# bundled Bash 3.2, which does not support associative arrays.
REPLACEMENTS=$(cat <<'EOF'
OpenClaw|BizClaw
openclaw|bizclaw
OPENCLAW|BIZCLAW
Clawdbot|BizClaw
clawdbot|bizclaw
CLAWDBOT|BIZCLAW
Moltbot|BizClaw
moltbot|bizclaw
MOLTBOT|BIZCLAW
EOF
)

# File types to patch.
# Do not rewrite compiled JS/module files: replacing "openclaw" in bundled
# import specifiers breaks the generated runtime even if the build succeeds.
FILE_PATTERNS="*.json *.html *.css *.md *.txt *.yaml *.yml *.toml"

while IFS='|' read -r old new; do
  [ -n "$old" ] || continue
  echo "  Replacing '$old' -> '$new'"

  for pattern in $FILE_PATTERNS; do
    while IFS= read -r -d '' file; do
      replace_in_file "$old" "$new" "$file"
    done < <(find "$BUILD_DIR" -name "$pattern" -type f -print0)
  done
done <<EOF
$REPLACEMENTS
EOF

# Keep the runtime web component tag stable. The bundled UI registers
# `openclaw-app`; changing the element name breaks the dashboard boot.
while IFS= read -r -d '' file; do
  replace_in_file "bizclaw-app" "openclaw-app" "$file"
done < <(find "$BUILD_DIR" -name "*.html" -type f -print0)

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
