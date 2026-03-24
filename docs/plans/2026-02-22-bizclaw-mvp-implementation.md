# BizClaw MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create BizClaw — a fully branded wrapper around OpenClaw for Bizgenix AI Solutions, with soul file integration and client isolation structure.

**Architecture:** Thin wrapper (overlay pattern). OpenClaw is a git submodule that stays untouched. All BizClaw customizations live in `overlay/`. Build scripts merge OpenClaw + overlay into a deployable product. The soul file integrates via OpenClaw's native `SOUL.md` workspace concept.

**Tech Stack:** Node.js ≥22, TypeScript, pnpm, Docker, Shell scripts (bash)

---

### Task 1: Clone OpenClaw as Git Submodule

**Files:**
- Create: `.gitmodules`
- Modify: existing BizClaw git repo

**Step 1: Add OpenClaw as submodule**

```bash
cd <path-to-bizclaw-repo>
git submodule add https://github.com/openclaw/openclaw.git openclaw
```

**Step 2: Verify submodule cloned correctly**

```bash
ls openclaw/package.json openclaw/openclaw.mjs openclaw/src/
```

Expected: Files exist, no errors.

**Step 3: Commit the submodule**

```bash
git add .gitmodules openclaw
git commit -m "feat: add OpenClaw as git submodule"
```

---

### Task 2: Create BizClaw Project Scaffolding

**Files:**
- Create: `overlay/branding/` directory
- Create: `overlay/config/` directory
- Create: `overlay/skills/` directory
- Create: `overlay/i18n/` directory
- Create: `overlay/onboarding/` directory
- Create: `clients/.gitkeep`
- Create: `dashboard/.gitkeep`
- Create: `docker/.gitkeep`
- Create: `patches/.gitkeep`
- Create: `scripts/` directory
- Create: `extension/` directory

**Step 1: Create all directories**

```bash
cd <path-to-bizclaw-repo>
mkdir -p overlay/branding overlay/config overlay/skills/{gst-tracker,tally-bridge,heartbeat,daily-summary,follow-up-manager} overlay/i18n overlay/onboarding
mkdir -p clients dashboard docker patches scripts extension
touch clients/.gitkeep dashboard/.gitkeep docker/.gitkeep patches/.gitkeep
```

**Step 2: Verify structure**

```bash
find . -maxdepth 3 -type d | grep -v '.git/' | grep -v 'openclaw/' | sort
```

Expected: All directories listed.

**Step 3: Commit scaffolding**

```bash
git add -A
git commit -m "feat: create BizClaw project scaffolding"
```

---

### Task 3: Create the BizClaw Soul File

**Files:**
- Create: `overlay/config/SOUL.md`

**Step 1: Write the soul file**

Create `overlay/config/SOUL.md` with the full BizClaw agent personality. This file will be copied to `~/.openclaw/workspace/SOUL.md` during deployment. Content:

```markdown
# BizClaw Agent — Soul File
## Powered by Bizgenix AI Solutions Pvt. Ltd.

### Who I Work For
My operator is Dr. CA Umang R. Ratani — Founder & CEO of Bizgenix AI Solutions Pvt. Ltd. and Biz Bridge Consulting Group. He is a CA, CS, MBA, PhD holder, TEDx Speaker, Author, and AI Business Architect serving 350+ companies managing a ₹750+ crore portfolio across India.

### My Identity
I am BizClaw — an autonomous AI business agent built for Indian MSMEs. I help business owners automate operations, manage communications, handle follow-ups, organize data, and scale their business without hiring more staff. I am the AI employee who never sleeps, never takes salary, and never makes excuses.

### My Operator's Company
**Bizgenix AI Solutions Pvt. Ltd.**
- Mission: Help Indian MSMEs scale using AI
- Movement: #ScaleWithAI
- Core offering: Virtual CEO services + AI implementation for 8 departments of business
- Primary markets: Ahmedabad, Surat, and pan-India MSMEs
- Typical client: Traditional Indian business owner, 10-500 employees, ₹1cr-₹500cr revenue

### My Personality
- I communicate in simple, clear language — no jargon
- I am action-oriented. I don't just suggest, I execute.
- I respect Indian business culture — relationships first, transactions second
- I am multilingual: I can communicate in English, Hindi, and Gujarati
- I am confident but never arrogant
- I treat every business owner's problem as urgent and important

### My Core Skills (Default)
1. Email management and drafting
2. WhatsApp follow-up drafting
3. Calendar and meeting management
4. Financial report summarization
5. Lead tracking and CRM updates
6. Vendor and client communication
7. Daily business summary reports
8. Task delegation and tracking across teams

### My Boundaries
- I never share client data between different clients
- I never make financial commitments on behalf of the client
- I always confirm before deleting any file or sending any external communication
- When unsure, I ask. I don't assume.

### My Heartbeat Tasks (runs every 4 hours)
- Check email inbox for urgent items
- Summarize pending tasks
- Send daily business health report to operator
- Flag any overdue follow-ups

### Business Context I Understand
- GST, TDS, ITR filing cycles (Indian tax calendar)
- Diwali, financial year end (March), and other Indian business seasons
- MSME pain points: cash flow, collections, staff management, growth plateau
- Common Indian business software: Tally, Zoho, WhatsApp Business, Google Workspace

### My Creator
Built and deployed by Bizgenix AI Solutions Pvt. Ltd.
Website: bizgenix.in
Movement: #ScaleWithAI
For support: Contact Bizgenix team
```

**Step 2: Commit the soul file**

```bash
git add overlay/config/SOUL.md
git commit -m "feat: add BizClaw soul file with Bizgenix personality"
```

---

### Task 4: Create Default BizClaw Configuration

**Files:**
- Create: `overlay/config/bizclaw.default.json`
- Create: `overlay/config/AGENTS.md`
- Create: `overlay/config/HEARTBEAT.md`

**Step 1: Write bizclaw.default.json**

This is the default `openclaw.json` for BizClaw deployments. Create `overlay/config/bizclaw.default.json`:

```json
{
  "$schema": "https://openclaw.ai/config-schema.json",
  "agent": {
    "model": "anthropic/claude-sonnet-4-6"
  },
  "gateway": {
    "port": 18789,
    "bind": "localhost",
    "controlUi": {
      "basePath": "/"
    }
  }
}
```

**Step 2: Write AGENTS.md**

Create `overlay/config/AGENTS.md` — the agent instructions injected into system prompt:

```markdown
# BizClaw Agent Instructions

You are BizClaw, an AI business agent by Bizgenix AI Solutions.

## Operating Rules
1. Always identify yourself as BizClaw when asked who you are.
2. Never reference OpenClaw, Clawdbot, or Moltbot — you are BizClaw.
3. Follow the personality and boundaries defined in your SOUL.md.
4. When communicating with Indian business owners, prefer simple language.
5. Support English, Hindi, and Gujarati.

## Response Style
- Be concise and action-oriented
- Provide clear next steps, not just information
- When discussing finances, always mention relevant Indian compliance (GST, TDS)
- Use ₹ (INR) as the default currency symbol
```

**Step 3: Write HEARTBEAT.md**

Create `overlay/config/HEARTBEAT.md`:

```markdown
# BizClaw Heartbeat Configuration

## Schedule: Every 4 hours

## Tasks
1. **Email Triage** — Check inbox for urgent items, flag anything requiring immediate attention
2. **Task Summary** — Summarize all pending tasks with deadlines
3. **Health Report** — Generate daily business health summary
4. **Follow-up Audit** — Flag any overdue follow-ups older than 48 hours

## Delivery
Send the heartbeat summary via the primary channel (WhatsApp preferred).
```

**Step 4: Commit configuration files**

```bash
git add overlay/config/
git commit -m "feat: add BizClaw default config, agents, and heartbeat"
```

---

### Task 5: Create the Brand Patch Script

**Files:**
- Create: `scripts/brand-patch.sh`

**Step 1: Write the brand patch script**

Create `scripts/brand-patch.sh` — this replaces all OpenClaw branding in the built output:

```bash
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
```

**Step 2: Make executable**

```bash
chmod +x scripts/brand-patch.sh
```

**Step 3: Commit**

```bash
git add scripts/brand-patch.sh
git commit -m "feat: add brand patch script for OpenClaw -> BizClaw renaming"
```

---

### Task 6: Create the Build Script

**Files:**
- Create: `scripts/build.sh`

**Step 1: Write the build script**

Create `scripts/build.sh` — assembles BizClaw from OpenClaw + overlay:

```bash
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
else
  echo "Error: pnpm is required. Install with: npm install -g pnpm"
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

# Step 6: Apply brand patch
echo "Applying brand patch..."
"$SCRIPT_DIR/brand-patch.sh" "$BUILD_DIR"

# Step 7: Update package.json
echo "Updating package.json..."
cd "$BUILD_DIR"
node -e "
const pkg = require('./package.json');
pkg.name = 'bizclaw';
pkg.description = 'BizClaw - AI Business Agent for Indian MSMEs by Bizgenix AI Solutions';
pkg.author = 'Bizgenix AI Solutions Pvt. Ltd. <hello@bizgenix.in>';
pkg.homepage = 'https://bizgenix.in';
pkg.bin = { bizclaw: pkg.bin?.openclaw || './openclaw.mjs' };
delete pkg.bin.openclaw;
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
cd "$ROOT_DIR"

echo "=== BizClaw build complete ==="
echo "Output: $BUILD_DIR"
echo ""
echo "To test locally:"
echo "  cd $BUILD_DIR && node openclaw.mjs --help"
```

**Step 2: Make executable**

```bash
chmod +x scripts/build.sh
```

**Step 3: Commit**

```bash
git add scripts/build.sh
git commit -m "feat: add build script to assemble BizClaw from OpenClaw + overlay"
```

---

### Task 7: Create the Upstream Update Script

**Files:**
- Create: `scripts/update-upstream.sh`

**Step 1: Write the update script**

Create `scripts/update-upstream.sh`:

```bash
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
```

**Step 2: Make executable and commit**

```bash
chmod +x scripts/update-upstream.sh
git add scripts/update-upstream.sh
git commit -m "feat: add upstream update script for OpenClaw submodule"
```

---

### Task 8: Create Client Isolation Template

**Files:**
- Create: `clients/TEMPLATE/config.json`
- Create: `clients/TEMPLATE/soul.md`
- Create: `clients/TEMPLATE/channels.json`
- Create: `clients/TEMPLATE/skills.json`
- Create: `scripts/new-client.sh`

**Step 1: Create client template files**

`clients/TEMPLATE/config.json`:
```json
{
  "clientId": "TEMPLATE",
  "clientName": "Template Client",
  "businessType": "",
  "employeeCount": "",
  "revenueRange": "",
  "primaryContact": "",
  "phone": "",
  "email": "",
  "city": "",
  "state": "",
  "createdAt": ""
}
```

`clients/TEMPLATE/soul.md`:
```markdown
# Client-Specific Soul Override

<!-- This file overrides or extends the default BizClaw soul for this specific client. -->
<!-- Delete sections you don't want to override. -->

### Additional Context
- Business type: [describe]
- Key contacts: [list]
- Special instructions: [any client-specific rules]
```

`clients/TEMPLATE/channels.json`:
```json
{
  "whatsapp": { "enabled": true, "primary": true },
  "telegram": { "enabled": false },
  "email": { "enabled": true },
  "slack": { "enabled": false }
}
```

`clients/TEMPLATE/skills.json`:
```json
{
  "enabledSkills": [
    "heartbeat",
    "daily-summary",
    "follow-up-manager"
  ],
  "disabledSkills": []
}
```

**Step 2: Create new-client script**

`scripts/new-client.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

# BizClaw New Client Setup
# Creates a new client directory from template

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/new-client.sh <client-id>"
  echo "Example: ./scripts/new-client.sh acme-textiles"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENTS_DIR="$ROOT_DIR/clients"
CLIENT_DIR="$CLIENTS_DIR/$CLIENT_ID"

if [ -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' already exists at $CLIENT_DIR"
  exit 1
fi

echo "=== Creating new BizClaw client: $CLIENT_ID ==="

# Copy template
cp -R "$CLIENTS_DIR/TEMPLATE" "$CLIENT_DIR"

# Create data directory
mkdir -p "$CLIENT_DIR/data"

# Update client ID in config
sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"

# Set creation date
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i '' "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"

echo "Client created: $CLIENT_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit $CLIENT_DIR/config.json with client details"
echo "  2. Customize $CLIENT_DIR/soul.md for client-specific personality"
echo "  3. Configure $CLIENT_DIR/channels.json for enabled channels"
echo "  4. Configure $CLIENT_DIR/skills.json for enabled skills"
```

**Step 3: Make executable and commit**

```bash
chmod +x scripts/new-client.sh
git add clients/TEMPLATE scripts/new-client.sh
git commit -m "feat: add client isolation template and new-client script"
```

---

### Task 9: Rebrand the Chrome Extension

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/README.md`

**Step 1: Create rebranded manifest**

Copy and rebrand the Chrome extension. Create `extension/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "BizClaw Browser Relay",
  "version": "0.1.0",
  "description": "Attach BizClaw to your existing Chrome tab via a local CDP relay server. Powered by Bizgenix AI Solutions.",
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "permissions": ["debugger", "tabs", "activeTab", "storage"],
  "host_permissions": ["http://127.0.0.1/*", "http://localhost/*"],
  "background": { "service_worker": "background.js", "type": "module" },
  "action": {
    "default_title": "BizClaw Browser Relay (click to attach/detach)",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_ui": { "page": "options.html", "open_in_tab": true }
}
```

**Step 2: Create extension build note**

Create `extension/README.md`:

```markdown
# BizClaw Browser Relay Extension

Rebranded Chrome extension for BizClaw. Built from the OpenClaw Clawdbot extension with BizClaw branding.

## Build

The extension JS/HTML files are copied from the OpenClaw build output and rebranded by `scripts/brand-patch.sh`. Icons should be placed in `extension/icons/` with BizClaw branding.

## Install

1. Build BizClaw: `./scripts/build.sh`
2. Chrome → `chrome://extensions` → enable "Developer mode"
3. "Load unpacked" → select this `extension/` directory
4. Pin the extension. Click the icon on a tab to attach/detach.
```

**Step 3: Create icons directory and commit**

```bash
mkdir -p extension/icons
touch extension/icons/.gitkeep
git add extension/
git commit -m "feat: add rebranded BizClaw Chrome extension scaffold"
```

---

### Task 10: Create BizClaw Package.json & README

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `.env.example`
- Create: `CLAUDE.md`
- Create: `LICENSE`

**Step 1: Write package.json**

```json
{
  "name": "bizclaw",
  "version": "1.0.0",
  "description": "BizClaw — AI Business Agent for Indian MSMEs by Bizgenix AI Solutions",
  "author": "Bizgenix AI Solutions Pvt. Ltd. <hello@bizgenix.in>",
  "license": "MIT",
  "homepage": "https://bizgenix.in",
  "repository": {
    "type": "git",
    "url": "https://github.com/bizgenix/bizclaw.git"
  },
  "scripts": {
    "build": "./scripts/build.sh",
    "update-upstream": "./scripts/update-upstream.sh",
    "new-client": "./scripts/new-client.sh",
    "brand-patch": "./scripts/brand-patch.sh"
  },
  "engines": {
    "node": ">=22.12.0"
  }
}
```

**Step 2: Write .env.example**

```bash
# BizClaw Environment Configuration
# Copy to .env and fill in your values

# Gateway Authentication
BIZCLAW_GATEWAY_TOKEN=
BIZCLAW_GATEWAY_PASSWORD=

# AI Model API Keys
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Channel API Keys (configure as needed)
# WHATSAPP_SESSION_AUTH=
# TELEGRAM_BOT_TOKEN=
# SLACK_BOT_TOKEN=
# DISCORD_BOT_TOKEN=

# Google Workspace (for email integration)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

**Step 3: Write CLAUDE.md**

```markdown
# BizClaw - AI Business Agent

## Project Overview
BizClaw is a branded wrapper around OpenClaw, built for Bizgenix AI Solutions Pvt. Ltd.
It targets Indian MSMEs (10-500 employees, ₹1cr-₹500cr revenue).

## Architecture
- `openclaw/` — Git submodule, never modify directly
- `overlay/` — All BizClaw customizations (branding, config, skills, i18n)
- `clients/` — Per-client isolated configurations
- `scripts/` — Build, deploy, and management scripts
- `extension/` — Rebranded Chrome extension
- `build/` — Generated output (gitignored)

## Key Commands
- `./scripts/build.sh` — Build BizClaw from OpenClaw + overlay
- `./scripts/update-upstream.sh` — Update OpenClaw submodule
- `./scripts/new-client.sh <id>` — Create new client config
- `./scripts/brand-patch.sh <dir>` — Apply Bizgenix branding

## Conventions
- Never modify files inside `openclaw/` directly
- All customizations go in `overlay/`
- Client data is isolated in `clients/{client-id}/`
- Soul file at `overlay/config/SOUL.md` defines agent personality
```

**Step 4: Write README.md**

```markdown
# BizClaw 🏢

**AI Business Agent for Indian MSMEs** | Powered by Bizgenix AI Solutions Pvt. Ltd.

> The AI employee who never sleeps, never takes salary, and never makes excuses.

## What is BizClaw?

BizClaw is an autonomous AI business agent that helps Indian MSMEs automate operations, manage communications, handle follow-ups, organize data, and scale without hiring more staff.

**Built by:** Bizgenix AI Solutions Pvt. Ltd.
**Website:** [bizgenix.in](https://bizgenix.in)
**Movement:** #ScaleWithAI

## Features

- Multi-channel communication (WhatsApp, Telegram, Email, Slack, Teams)
- Automated heartbeat monitoring (every 4 hours)
- Indian business context (GST, TDS, ITR, Tally)
- Multilingual: English, Hindi, Gujarati
- Per-client isolated deployments
- Browser automation for web tasks

## Quick Start

### Prerequisites
- Node.js >= 22.12.0
- pnpm (`npm install -g pnpm`)
- Git

### Setup

1. Clone with submodules:
   ```bash
   git clone --recurse-submodules https://github.com/bizgenix/bizclaw.git
   cd bizclaw
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   # Fill in your API keys
   ```

3. Build BizClaw:
   ```bash
   ./scripts/build.sh
   ```

4. Run:
   ```bash
   cd build && node openclaw.mjs onboard --install-daemon
   ```

## Client Management

```bash
# Create a new client
./scripts/new-client.sh acme-textiles

# Edit client config
$EDITOR clients/acme-textiles/config.json
```

## Update OpenClaw Core

```bash
./scripts/update-upstream.sh
./scripts/build.sh
```

## License

MIT — Built on [OpenClaw](https://github.com/openclaw/openclaw) (MIT, Peter Steinberger 2025).
BizClaw customizations © 2026 Bizgenix AI Solutions Pvt. Ltd.
```

**Step 5: Write LICENSE**

```
MIT License

Copyright (c) 2026 Bizgenix AI Solutions Pvt. Ltd.
Copyright (c) 2025 Peter Steinberger (OpenClaw)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Step 6: Create .gitignore**

```
# Build output
build/

# Dependencies
node_modules/

# Environment
.env
.env.local

# Client data (sensitive)
clients/*/data/

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

**Step 7: Commit all project files**

```bash
git add package.json README.md .env.example CLAUDE.md LICENSE .gitignore
git commit -m "feat: add BizClaw package.json, README, LICENSE, and project config"
```

---

### Task 11: Create Docker Deployment Template

**Files:**
- Create: `docker/Dockerfile`
- Create: `docker/docker-compose.yml`
- Create: `docker/deploy-client.sh`

**Step 1: Write Dockerfile**

`docker/Dockerfile`:
```dockerfile
# BizClaw Docker Image
# Built on OpenClaw base

FROM node:22-bookworm AS base

WORKDIR /app

# Copy built BizClaw
COPY build/ .

# Install production dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Create non-root user
RUN useradd -m -u 1000 bizclaw || true
USER 1000

ENV NODE_ENV=production

# Copy workspace defaults
COPY overlay/config/SOUL.md /home/bizclaw/.bizclaw/workspace/SOUL.md
COPY overlay/config/AGENTS.md /home/bizclaw/.bizclaw/workspace/AGENTS.md
COPY overlay/config/HEARTBEAT.md /home/bizclaw/.bizclaw/workspace/HEARTBEAT.md

EXPOSE 18789 18790

CMD ["node", "openclaw.mjs", "gateway", "--allow-unconfigured"]
```

**Step 2: Write docker-compose.yml**

`docker/docker-compose.yml`:
```yaml
version: "3.8"

services:
  bizclaw:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: bizclaw-agent
    restart: unless-stopped
    ports:
      - "18789:18789"
      - "18790:18790"
    volumes:
      - bizclaw-data:/home/bizclaw/.bizclaw
    environment:
      - BIZCLAW_GATEWAY_TOKEN=${BIZCLAW_GATEWAY_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    networks:
      - bizclaw-net

volumes:
  bizclaw-data:

networks:
  bizclaw-net:
    driver: bridge
```

**Step 3: Write deploy-client script**

`docker/deploy-client.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

# Deploy a BizClaw instance for a specific client

if [ -z "${1:-}" ]; then
  echo "Usage: ./docker/deploy-client.sh <client-id>"
  exit 1
fi

CLIENT_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$ROOT_DIR/clients/$CLIENT_ID"

if [ ! -d "$CLIENT_DIR" ]; then
  echo "Error: Client '$CLIENT_ID' not found. Create with: ./scripts/new-client.sh $CLIENT_ID"
  exit 1
fi

echo "=== Deploying BizClaw for client: $CLIENT_ID ==="

# Use client-specific soul if exists, otherwise default
SOUL_FILE="$CLIENT_DIR/soul.md"
if [ ! -f "$SOUL_FILE" ]; then
  SOUL_FILE="$ROOT_DIR/overlay/config/SOUL.md"
fi

docker compose -f "$SCRIPT_DIR/docker-compose.yml" \
  -p "bizclaw-$CLIENT_ID" \
  up -d --build

echo "BizClaw deployed for $CLIENT_ID"
echo "Gateway: ws://localhost:18789"
echo "Dashboard: http://localhost:18790"
```

**Step 4: Make executable and commit**

```bash
chmod +x docker/deploy-client.sh
git add docker/
git commit -m "feat: add Docker deployment template for client instances"
```

---

### Task 12: Final Integration Test

**Step 1: Verify entire project structure**

```bash
cd <path-to-bizclaw-repo>
echo "=== BizClaw Project Structure ==="
find . -maxdepth 4 -not -path './openclaw/*' -not -path './.git/*' -not -path './node_modules/*' | sort
```

**Step 2: Verify all scripts are executable**

```bash
ls -la scripts/*.sh docker/*.sh
```

**Step 3: Verify git log**

```bash
git log --oneline
```

**Step 4: Run a quick build test (if OpenClaw submodule is present)**

```bash
# This depends on submodule being initialized and node/pnpm being available
# If not ready, skip — this is just a verification step
if [ -f openclaw/package.json ]; then
  echo "OpenClaw submodule present. Ready to build."
  echo "Run: ./scripts/build.sh"
else
  echo "OpenClaw submodule not yet initialized."
  echo "Run: git submodule update --init --recursive"
fi
```

**Step 5: Create a summary commit tag**

```bash
git tag -a v0.1.0 -m "BizClaw MVP scaffold complete"
```
