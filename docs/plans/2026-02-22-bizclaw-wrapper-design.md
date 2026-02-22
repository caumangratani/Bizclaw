# BizClaw Wrapper Design

**Date:** 2026-02-22
**Author:** Dr. CA Umang R. Ratani / Bizgenix AI Solutions Pvt. Ltd.
**Status:** Approved

## Overview

BizClaw is an autonomous AI business agent for Indian MSMEs, built as a branded wrapper around the open-source OpenClaw project (MIT license). It is the flagship AI product of Bizgenix AI Solutions Pvt. Ltd.

**Target market:** Indian MSMEs, 10-500 employees, ₹1cr-₹500cr revenue, primarily in Ahmedabad, Surat, and pan-India.

**Movement:** #ScaleWithAI

## Architecture: Thin Wrapper (Overlay Pattern)

OpenClaw is included as a git submodule and remains untouched. All BizClaw customizations live in an `overlay/` directory. A build script merges them to produce the final product.

### Why This Approach
- Easy to pull upstream OpenClaw updates
- Clean separation: OpenClaw core vs. BizClaw IP
- Small codebase to maintain — you only own what you change
- Fastest path to MVP

## Project Structure

```
BizClaw/
├── openclaw/              # Git submodule — never touch directly
├── overlay/               # BizClaw IP — all customizations
│   ├── branding/          # Logo, icons, colors, splash page
│   ├── config/            # Default configuration, soul file
│   ├── skills/            # MSME-specific custom skills
│   ├── i18n/              # Hindi, Gujarati translations
│   └── onboarding/        # Custom MSME onboarding wizard
├── clients/               # Per-client isolated configs + data
│   └── {client-id}/
│       ├── config.json
│       ├── soul.md        # Optional personality override
│       ├── channels.json
│       ├── skills.json
│       └── data/
├── dashboard/             # Bizgenix-branded web control panel
├── docker/                # Deployment containers per client
├── patches/               # Git-format patches for upstream changes
├── scripts/               # Build, update, deploy scripts
│   ├── build.sh
│   ├── update-upstream.sh
│   └── brand-patch.sh
├── extension/             # Rebranded Chrome Extension
├── docs/
├── .env.example
├── CLAUDE.md
├── package.json
├── README.md
└── LICENSE
```

## Branding Strategy

### What Gets Rebranded
- "OpenClaw" / "Clawdbot" → "BizClaw"
- Logo, icons, colors → Bizgenix brand palette
- Chrome Extension → "BizClaw Browser Relay"
- CLI command: `openclaw` → `bizclaw`
- Web dashboard: fully custom Bizgenix-branded UI
- MIT attribution preserved (required) + "Built by Bizgenix AI Solutions Pvt. Ltd." added

### Brand Patch Script
`scripts/brand-patch.sh` handles:
- String replacement in built output
- Asset swapping (icons, logos)
- package.json and manifest.json updates

## Soul File & Agent Personality

The BizClaw soul file defines the agent's identity, personality, skills, boundaries, and heartbeat tasks. It is stored at `overlay/config/soul.md` and loaded on first boot.

### Key Personality Traits
- Simple, clear language — no jargon
- Action-oriented — executes, doesn't just suggest
- Respects Indian business culture — relationships first
- Multilingual: English, Hindi, Gujarati
- Confident but not arrogant

### Per-Client Overrides
Clients can have a custom `soul.md` in `clients/{client-id}/soul.md` that overrides or extends the default personality.

## Multi-Tenant Client Architecture

Each of the 350+ clients gets:
- Isolated configuration and data directory
- Their own Docker container
- Separate API keys and channel connections
- Independent heartbeat schedules
- Custom skill enablement

## Messaging Channels (All Supported)

Priority order:
1. WhatsApp (primary for Indian MSMEs)
2. Telegram
3. Email (Gmail/Google Workspace)
4. Slack / Microsoft Teams
5. All other OpenClaw-supported channels as needed

## Custom MSME Skills (Phase 2)

1. **GST Tracker** — Indian tax calendar, filing reminders (GST, TDS, ITR)
2. **Tally Bridge** — Integration with Tally accounting software
3. **Heartbeat** — Automated 4-hour health checks (email, tasks, follow-ups)
4. **Daily Summary** — Business health reports to operator
5. **Follow-up Manager** — Overdue follow-up tracking and alerts
6. **Multilingual Responses** — Hindi and Gujarati support

## Heartbeat System

Runs every 4 hours:
- Check email inbox for urgent items
- Summarize pending tasks
- Send daily business health report to operator
- Flag any overdue follow-ups

## Indian Business Context

BizClaw understands:
- GST, TDS, ITR filing cycles
- Diwali, financial year end (March), Indian business seasons
- MSME pain points: cash flow, collections, staff management
- Common software: Tally, Zoho, WhatsApp Business, Google Workspace

## Legal

- OpenClaw is MIT licensed — commercial use fully permitted
- Attribution to original author (Peter Steinberger) maintained
- BizClaw additions are proprietary IP of Bizgenix AI Solutions Pvt. Ltd.

## MVP Scope

Phase 1 (MVP):
1. Clone OpenClaw as submodule
2. Full rebrand to BizClaw / Bizgenix
3. Soul file integration as default agent personality
4. Custom onboarding flow for MSME clients
5. Rebrand Chrome Extension
6. Basic client isolation structure
7. Build and deploy scripts

Phase 2:
- Custom MSME skills
- Bizgenix-branded web dashboard
- Multi-tenant Docker deployment
- Hindi/Gujarati language support
- Heartbeat system
