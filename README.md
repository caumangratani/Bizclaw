# BizClaw

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

4. Build BizClaw:
   ```bash
   ./scripts/build.sh
   ```

5. Create a client:
   ```bash
   ./scripts/new-client.sh demo-local "BizClaw Demo Local" "Trading & Distribution" "+919876543210"
   ```

6. Run that client locally:
   ```bash
   ./scripts/run-client-local.sh demo-local
   ```

7. Print the exact launch URLs:
   ```bash
   ./scripts/client-launch-url.sh demo-local
   ```

8. Start the full local demo stack:
   ```bash
   ./scripts/start-local-stack.sh demo-local
   ```

## Client Management

```bash
# Create a new client
./scripts/new-client.sh acme-textiles "Acme Textiles" "Textiles" "+919876543210"

# Provision a managed sellable client + admin billing record
./scripts/provision-managed-client.sh acme-textiles "Acme Textiles" "Textiles" "+919876543210"

# Run locally
./scripts/run-client-local.sh acme-textiles

# Generate operator/client URLs
./scripts/client-launch-url.sh acme-textiles
```

## Delivery Runbook

The working install and handoff process is documented in:

- `docs/launch/CLIENT-DELIVERY-SOP.md`
- `docs/launch/SAAS-OPERATING-MODEL.md`
- `docs/launch/PRODUCTION-HOSTING-PLAN.md`
- `docs/launch/SMARTMITRA-CONSOLIDATION-PLAN.md`
- `docs/launch/RAILWAY-WEBSITE-DEPLOY.md`
- `docs/launch/DO-PILOT-CUSTOMER-RUNBOOK.md`

## Public Website Deployment

The BizClaw AI website is Railway-ready from the `website/` directory:

```bash
cd website
npm start
```

For Railway, set the service root directory to `website/` and use the local `railway.toml`.

## Local Demo Stack

```bash
./scripts/start-local-stack.sh demo-local
./scripts/stop-local-stack.sh
```

## Upstream Sync

To safely pull new OpenClaw changes into BizClaw:

```bash
./scripts/sync-openclaw-safe.sh
```

That flow:

- creates a local sync branch
- updates the OpenClaw submodule pointer
- rebuilds BizClaw
- creates a checkpoint commit for review

## Update OpenClaw Core

```bash
./scripts/update-upstream.sh
./scripts/build.sh
```

## Architecture

BizClaw uses the **thin wrapper (overlay) pattern**:
- `openclaw/` — Git submodule containing the unmodified OpenClaw core
- `overlay/` — All BizClaw customizations (branding, config, skills, i18n)
- `clients/` — Per-client isolated configurations and data
- `scripts/` — Build, update, and deployment automation

## License

MIT — Built on [OpenClaw](https://github.com/openclaw/openclaw) (MIT, Peter Steinberger 2025).
BizClaw customizations (c) 2026 Bizgenix AI Solutions Pvt. Ltd.
