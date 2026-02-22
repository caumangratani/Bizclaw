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

## Architecture

BizClaw uses the **thin wrapper (overlay) pattern**:
- `openclaw/` — Git submodule containing the unmodified OpenClaw core
- `overlay/` — All BizClaw customizations (branding, config, skills, i18n)
- `clients/` — Per-client isolated configurations and data
- `scripts/` — Build, update, and deployment automation

## License

MIT — Built on [OpenClaw](https://github.com/openclaw/openclaw) (MIT, Peter Steinberger 2025).
BizClaw customizations (c) 2026 Bizgenix AI Solutions Pvt. Ltd.
