#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/apply-openclaw-runtime-patches.sh <build-dir>"
  exit 1
fi

BUILD_DIR="$1"
TARGET_FILE="$BUILD_DIR/src/whatsapp/resolve-outbound-target.ts"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if [ ! -f "$TARGET_FILE" ]; then
  echo "Error: expected runtime file not found: $TARGET_FILE"
  exit 1
fi

node - "$TARGET_FILE" <<'EOF'
const fs = require("fs");

const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const before = `    if (hasWildcard || allowList.length === 0) {
      return { ok: true, to: normalizedTo };
    }
    if (allowList.includes(normalizedTo)) {
      return { ok: true, to: normalizedTo };
    }
    return {
      ok: false,
      error: missingTargetError("WhatsApp", "<E.164|group JID>"),
    };`;
const after = `    // The allowlist is an inbound access control. Explicit outbound sends
    // (owner-triggered messages, scheduled sends, cron announce deliveries)
    // must be able to reach a valid target even if that number has not yet
    // messaged the bot. Only implicit/heartbeat routing should be constrained
    // to the allowlist.
    const normalizedMode = params.mode?.trim().toLowerCase();
    const enforceAllowList = normalizedMode === "implicit" || normalizedMode === "heartbeat";
    if (!enforceAllowList) {
      return { ok: true, to: normalizedTo };
    }
    if (hasWildcard || allowList.length === 0) {
      return { ok: true, to: normalizedTo };
    }
    if (allowList.includes(normalizedTo)) {
      return { ok: true, to: normalizedTo };
    }
    return {
      ok: false,
      error: missingTargetError("WhatsApp", "<E.164|group JID>"),
    };`;

if (!source.includes(before)) {
  console.error("Expected WhatsApp outbound target block not found; runtime patch not applied.");
  process.exit(1);
}

fs.writeFileSync(file, source.replace(before, after));
EOF

echo "Applied OpenClaw runtime patches in $BUILD_DIR"
