#!/usr/bin/env bash
set -euo pipefail

# ================================================================
#  BizClaw Control-UI Brand Patcher
#  Copies OpenClaw's control-ui and patches ONLY user-visible
#  branding strings in the JS bundle. Internal protocol identifiers
#  (localStorage keys, device auth, skill sources) are left intact.
#
#  Usage: ./scripts/patch-control-ui.sh [openclaw-control-ui-dir]
#
#  Default source: globally installed openclaw npm package
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OVERLAY_UI="$ROOT_DIR/overlay/control-ui"

# Find OpenClaw control-ui source
if [ -n "${1:-}" ]; then
  SOURCE_UI="$1"
elif command -v openclaw &>/dev/null; then
  OPENCLAW_BIN="$(which openclaw)"
  OPENCLAW_REAL="$(readlink "$OPENCLAW_BIN" 2>/dev/null || echo "$OPENCLAW_BIN")"
  OPENCLAW_PKG="$(dirname "$(dirname "$OPENCLAW_REAL")")"
  SOURCE_UI="$OPENCLAW_PKG/dist/control-ui"
  if [ ! -d "$SOURCE_UI" ]; then
    # Try npm root
    NPM_ROOT="$(npm root -g 2>/dev/null || echo "")"
    SOURCE_UI="$NPM_ROOT/openclaw/dist/control-ui"
  fi
else
  echo "Error: openclaw not found. Pass the control-ui directory as argument."
  exit 1
fi

if [ ! -d "$SOURCE_UI" ]; then
  echo "Error: OpenClaw control-ui not found at: $SOURCE_UI"
  exit 1
fi

echo "=== BizClaw Control-UI Patcher ==="
echo "Source: $SOURCE_UI"
echo "Target: $OVERLAY_UI"

# Step 1: Copy fresh assets from OpenClaw
echo ""
echo "[1/4] Copying control-ui assets..."
mkdir -p "$OVERLAY_UI/assets"

# Copy JS bundle and sourcemap
cp "$SOURCE_UI/assets/"*.js "$OVERLAY_UI/assets/" 2>/dev/null || true
cp "$SOURCE_UI/assets/"*.js.map "$OVERLAY_UI/assets/" 2>/dev/null || true
# Copy CSS (we'll patch it too)
cp "$SOURCE_UI/assets/"*.css "$OVERLAY_UI/assets/" 2>/dev/null || true

echo "  Assets copied"

# Step 2: Patch the JS bundle — user-visible strings only
echo "[2/4] Patching JS bundle branding..."

# Find the JS bundle
JS_FILE=$(find "$OVERLAY_UI/assets" -name "index-*.js" ! -name "*.map" | head -1)
if [ -z "$JS_FILE" ]; then
  echo "  Warning: No JS bundle found, skipping JS patches"
else
  # Helper: perl-based replace (works on macOS + Linux)
  rpl() {
    OLD_VALUE="$1" NEW_VALUE="$2" perl -pi -e 'BEGIN { $o=$ENV{OLD_VALUE}; $n=$ENV{NEW_VALUE}; } s/\Q$o\E/$n/g' "$JS_FILE"
  }

  # --- Brand title in sidebar ---
  rpl '>OPENCLAW<' '>BIZCLAW<'
  rpl '"OPENCLAW"' '"BIZCLAW"'

  # --- Brand subtitle ---
  rpl '>Gateway Dashboard<' '>Dashboard<'
  rpl '"Gateway Dashboard"' '"Dashboard"'

  # --- Logo alt text ---
  rpl 'alt="OpenClaw"' 'alt="BizClaw"'

  # --- Documentation URLs → BizClaw support ---
  rpl 'https://docs.openclaw.ai/web/dashboard' 'https://bizgenix.in/bizclaw/help'
  rpl 'https://docs.openclaw.ai/gateway/tailscale' 'https://bizgenix.in/bizclaw/help'
  rpl 'https://docs.openclaw.ai/web/control-ui#insecure-http' 'https://bizgenix.in/bizclaw/help'
  rpl 'https://docs.openclaw.ai' 'https://bizgenix.in/bizclaw'

  # --- CLI command references → BizClaw equivalents ---
  rpl 'openclaw dashboard --no-open' 'bizclaw dashboard'
  rpl 'openclaw doctor --generate-gateway-token' 'bizclaw setup-token'
  rpl 'openclaw security audit --deep' 'bizclaw security check'

  # --- Download/export filenames ---
  rpl 'openclaw-logs-' 'bizclaw-logs-'
  rpl 'openclaw-usage-sessions-' 'bizclaw-usage-sessions-'
  rpl 'openclaw-usage-daily-' 'bizclaw-usage-daily-'
  rpl 'openclaw-usage-' 'bizclaw-usage-'

  # --- Placeholder text ---
  rpl 'placeholder="OPENCLAW_GATEWAY_TOKEN"' 'placeholder="GATEWAY_TOKEN"'

  # --- Help text ---
  rpl 'Edit ~/.openclaw/openclaw.json safely' 'Edit config file safely'

  # --- Visible labels with "openclaw" in skill sources ---
  # These show in the Skills UI as filter labels
  # "openclaw-workspace" → keep (internal identifier, but label shows "Workspace Skills")
  # "openclaw-bundled" → keep (internal, label shows "Built-in Skills")
  # "openclaw-managed" → keep (internal, label shows "Installed Skills")

  # --- DO NOT TOUCH these internal identifiers ---
  # openclaw.control.settings.v1  (localStorage key)
  # openclaw-device-identity-v1   (device auth)
  # openclaw.device.auth.v1       (device auth)
  # openclaw-control-ui           (client type in protocol)
  # openclaw-macos/ios/android    (app identifiers)
  # __OPENCLAW_*                  (runtime globals injected by gateway)
  # openclaw-app                  (web component tag)

  echo "  JS bundle patched"
fi

# Step 3: Patch CSS — add BizClaw color overrides
echo "[3/4] Patching CSS with BizClaw brand colors..."

CSS_FILE=$(find "$OVERLAY_UI/assets" -name "index-*.css" | head -1)
if [ -n "$CSS_FILE" ]; then
  # Append BizClaw color overrides at end of CSS
  # These override the :root CSS variables
  cat >> "$CSS_FILE" << 'CSSEOF'

/* ========================================
   BizClaw Brand Override
   Bizgenix AI Solutions Pvt. Ltd.
   ======================================== */
:root {
  --accent: #16A34A;
  --accent-hover: #22C55E;
  --primary: #16A34A;
  --focus-ring: 0 0 0 3px rgba(22, 163, 74, 0.5);
}

/* BizClaw footer badge */
body::after {
  content: "Powered by Bizgenix AI";
  position: fixed;
  bottom: 8px;
  right: 16px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.5px;
  pointer-events: none;
  z-index: 9999;
  font-family: var(--font-body);
}

/* Brand title styling */
.brand-title {
  font-weight: 700 !important;
  letter-spacing: 2px !important;
  font-size: 18px !important;
}

.brand-sub {
  opacity: 0.6 !important;
  font-size: 11px !important;
}
CSSEOF
  echo "  CSS patched with BizClaw brand colors"
fi

# Step 4: Verify no critical OpenClaw branding remains in visible text
echo "[4/4] Verification..."

if [ -n "$JS_FILE" ]; then
  # Check for remaining user-visible "OpenClaw" (not internal __OPENCLAW or openclaw- prefixed identifiers)
  VISIBLE_REFS=$(grep -o 'alt="OpenClaw"\|>OPENCLAW<\|>Gateway Dashboard<\|docs\.openclaw\.ai' "$JS_FILE" | wc -l | tr -d ' ')
  if [ "$VISIBLE_REFS" -gt 0 ]; then
    echo "  WARNING: $VISIBLE_REFS visible OpenClaw references remain!"
    grep -on 'alt="OpenClaw"\|>OPENCLAW<\|>Gateway Dashboard<\|docs\.openclaw\.ai' "$JS_FILE" | head -5
  else
    echo "  All visible branding replaced successfully"
  fi
fi

echo ""
echo "=== Control-UI patch complete ==="
echo "Overlay UI ready at: $OVERLAY_UI"
echo ""
echo "To use: set gateway.controlUi.root in your openclaw.json:"
echo "  \"gateway\": { \"controlUi\": { \"root\": \"$OVERLAY_UI\" } }"
