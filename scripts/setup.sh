#!/usr/bin/env bash
# ============================================================
# BizClaw — First-Time Setup Script
# Bizgenix AI Solutions Pvt. Ltd.
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# ============================================================

set -euo pipefail

BIZCLAW_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OPENCLAW_DIR="$BIZCLAW_DIR/openclaw"

echo ""
echo "⚡ BizClaw Setup — Bizgenix AI Solutions"
echo "========================================="
echo ""

# ----------------------------------------------------------
# 1. Check prerequisites
# ----------------------------------------------------------
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node.js 22+: https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "📦 Installing pnpm..."; corepack enable && corepack prepare pnpm@latest --activate; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "❌ Node.js 22+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) + pnpm $(pnpm -v)"

# ----------------------------------------------------------
# 2. Initialize OpenClaw submodule
# ----------------------------------------------------------
echo ""
echo "📥 Setting up OpenClaw..."

cd "$BIZCLAW_DIR"
if [ ! -f "$OPENCLAW_DIR/package.json" ]; then
    echo "   Initializing git submodule..."
    git submodule update --init --recursive
fi

# ----------------------------------------------------------
# 3. Install dependencies & build OpenClaw
# ----------------------------------------------------------
echo ""
echo "🔧 Building OpenClaw..."

cd "$OPENCLAW_DIR"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
pnpm build

echo "✅ OpenClaw built successfully"

# ----------------------------------------------------------
# 4. Create .env if it doesn't exist
# ----------------------------------------------------------
cd "$BIZCLAW_DIR"

if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env and add your API keys!"
    echo "   nano .env"
else
    echo ""
    echo "✅ .env file already exists"
fi

# ----------------------------------------------------------
# 5. Copy config to OpenClaw state dir
# ----------------------------------------------------------
echo ""
echo "⚙️  Setting up BizClaw config..."

OPENCLAW_STATE="${HOME}/.openclaw"
mkdir -p "$OPENCLAW_STATE"

# Symlink the config instead of copying (so edits to overlay/ take effect immediately)
if [ -L "$OPENCLAW_STATE/openclaw.json" ]; then
    rm "$OPENCLAW_STATE/openclaw.json"
fi

ln -sf "$BIZCLAW_DIR/overlay/config/openclaw.json" "$OPENCLAW_STATE/openclaw.json"
echo "✅ Config linked: $OPENCLAW_STATE/openclaw.json → overlay/config/openclaw.json"

# ----------------------------------------------------------
# 6. Summary
# ----------------------------------------------------------
echo ""
echo "========================================="
echo "⚡ BizClaw setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Add your API keys to .env:"
echo "     nano .env"
echo ""
echo "  2. Start BizClaw:"
echo "     cd $OPENCLAW_DIR"
echo "     node openclaw.mjs gateway"
echo ""
echo "  3. Open control panel:"
echo "     http://localhost:18789"
echo ""
echo "  4. Connect WhatsApp:"
echo "     node openclaw.mjs channels login --channel whatsapp"
echo "     (Scan QR code with your phone)"
echo ""
echo "  5. Or use Docker:"
echo "     docker-compose up --build"
echo ""
echo "🚀 Let's #ScaleWithAI!"
echo ""
