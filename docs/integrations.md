# BizClaw Integration Candidates

## 1. OpenClaw Mission Control
- **Repo:** https://github.com/abhi1693/openclaw-mission-control
- **Status:** v1.3.0, MIT, 2.4k stars
- **What:** Multi-agent orchestration dashboard (Next.js 16 + SQLite)
- **Use for BizClaw:** Admin dashboard to manage all clients from one place
  - Register each client gateway (18789, 18790, etc.)
  - Track token costs per client (billing)
  - Task board with approval workflows
  - Real-time health monitoring
  - Super Admin tenant provisioning
- **Deploy:** `pnpm install && pnpm start` on VPS port 3000
- **Priority:** HIGH — needed before scaling past 5 clients

## 2. Lossless-Claw (LCM)
- **Repo:** https://github.com/martian-engineering/lossless-claw
- **Status:** v0.3.0, MIT, 1.3k stars
- **What:** DAG-based context management plugin — agents never forget
- **Use for BizClaw:** Long WhatsApp sessions keep full context
  - Replaces sliding-window truncation with hierarchical summaries
  - Agents can search/recall old conversation details
  - Drop-in plugin, zero code changes
- **Install:** `openclaw plugins install @martian-engineering/lossless-claw`
- **Config:** Add `plugins.slots.contextEngine: "lossless-claw"` to openclaw.json
- **Priority:** MEDIUM — nice-to-have for long-running client sessions
