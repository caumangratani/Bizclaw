# CLAUDE.md — BizClaw Project Intelligence File
# This file is read automatically by Claude Code at every session start.
# Last updated: February 2026

---

## WHO I AM — THE OPERATOR

**Name:** Dr. CA Umang R. Ratani
**Credentials:** CA, CS, MBA, PhD, NET Qualified, TEDx Speaker, Author
**Role:** Founder & CEO — Bizgenix AI Solutions Pvt. Ltd. + Biz Bridge Consulting Group
**Experience:** 13+ years, 350+ companies, ₹750+ crore portfolio under Virtual CEO management
**Background:** Non-technical founder who builds via vibe coding. I understand business deeply. I learn technology by doing.
**Communication style:** Explain everything simply. No jargon. If you must use a technical term, define it immediately after.

---

## ABOUT BIZGENIX AI SOLUTIONS

**Company:** Bizgenix AI Solutions Pvt. Ltd.
**Sister company:** Biz Bridge Consulting Group
**Location:** Ahmedabad, Gujarat, India
**Mission:** Help Indian MSMEs scale using AI — without needing a technical team
**Movement:** #ScaleWithAI
**Positioning:** India's first AI Business Architecture firm for traditional MSMEs
**Website:** bizgenix.in
**Founder's key message:** "You don't need to be technical to use AI. You need to be strategic."

**What we do:**
- Virtual CEO services for 350+ companies
- AI implementation across 8 departments of business
- Scale with AI workshops (Ahmedabad, Surat, pan-India)
- ICAI AICA faculty — training CAs on AI
- Business Consultant Accelerator Program (45% conversion rate)
- BizClaw — AI agent platform for Indian MSMEs (this project)

---

## ABOUT THIS PROJECT — BIZCLAW

**Product name:** BizClaw
**Tagline:** "Your AI Employee. Never sleeps. Never asks for a raise."
**What it is:** A white-label wrapper of OpenClaw (open-source AI agent framework), rebranded and customized for Indian MSME clients
**Architecture:** Thin wrapper pattern — OpenClaw as untouched submodule, all customizations in `/overlay/`
**Tech approach:** Vibe coding with Claude Code — no traditional dev team

**Target customer:**
Traditional Indian business owner. 10-500 employees. ₹1cr-₹500cr annual revenue. Uses WhatsApp for everything. Probably uses Tally for accounts. Wants to scale but can't afford to hire more people. Trusts Umang and Bizgenix because of existing relationship.

**Business model:**
- Setup fee: ₹50,000-₹75,000 per client (one-time)
- Monthly subscription: ₹15,000-₹25,000 per client
- Hosting cost: ₹3,000-₹5,000 per client/month
- Net margin: Very healthy

**Deployment target:** Railway.app (primary), then custom domain per client
**Multi-tenancy:** Each client gets isolated environment under `/clients/client-XXX/`

---

## BRAND & DESIGN GUIDELINES

### Colors
```json
{
  "primary": "#1A1A2E",
  "secondary": "#16213E",
  "accent": "#0F3460",
  "highlight": "#E94560",
  "gold": "#F5A623",
  "white": "#FFFFFF",
  "light_gray": "#F8F9FA",
  "text_dark": "#2D2D2D",
  "text_light": "#6C757D"
}
```

### Typography
- Headings: Poppins Bold (modern, professional)
- Body: Inter Regular (clean, readable)
- Code/Terminal: JetBrains Mono

### Logo & Branding Rules
- Product name is always written as: BizClaw (capital B, capital C, no space)
- Company is always: Bizgenix AI Solutions Pvt. Ltd.
- Mascot concept: A professional lobster claw holding a briefcase (our Indian business twist on OpenClaw's lobster)
- Never show OpenClaw, Moltbot, or Clawdbot branding anywhere in the UI
- Every client-facing screen must show BizClaw logo + "Powered by Bizgenix" in footer

### UI Style
- Clean, minimal, professional — not startup-flashy
- Dark sidebar with light content area
- Mobile-first (clients will check on phone)
- Hindi/Gujarati font support required on all text elements
- WhatsApp green (#25D366) for WhatsApp integration buttons

---

## LANGUAGE & COMMUNICATION

- Default language: English
- Supported languages: English, Hindi (hi), Gujarati (gu)
- Tone in UI: Warm, professional, like a trusted business advisor
- Never use: Technical jargon in client-facing UI
- Always use in client UI: Simple action words — "Send", "Check", "Schedule", "Remind"

---

## CORE FEATURES TO BUILD (Priority Order)

1. Branded wrapper — BizClaw branding replacing all OpenClaw references
2. Soul file integration — /overlay/config/SOUL.md loads as default agent personality
3. MSME Onboarding wizard — Simple 5-step setup for non-technical clients
4. Web dashboard — Browser-based control panel (most important sales tool)
5. Multi-tenant client isolation — /clients/ directory structure
6. MSME Skills pack:
   - GST tracker (filing deadline reminders)
   - Daily business summary (WhatsApp report every morning)
   - Follow-up manager (pending collections, vendor payments)
   - Tally bridge (read Tally data, generate summaries)
   - Heartbeat tasks (every 4 hours check-in)
7. Multilingual support — Hindi + Gujarati UI strings
8. Docker deployment config — For client isolation on server

---

## PROJECT STRUCTURE REFERENCE

```
BizClaw/
├── openclaw/              # Git submodule — NEVER modify files here
├── overlay/               # ALL our customizations live here
│   ├── branding/          # Logos, colors, icons
│   ├── config/            # soul.md, default configs
│   ├── skills/            # MSME-specific agent skills
│   ├── i18n/              # Hindi + Gujarati translations
│   └── onboarding/        # Client setup wizard
├── clients/               # Per-client isolated environments
├── dashboard/             # Web control panel UI
├── docker/                # Deployment containers
├── patches/               # Git-format patches for upstream
├── scripts/               # Build, update, deploy scripts
├── docs/                  # Documentation
├── .env.example           # API key template
├── CLAUDE.md              # This file — project intelligence
└── package.json           # BizClaw meta-package
```

---

## CLAUDE CODE BEHAVIOUR INSTRUCTIONS

When working on this project, always:

1. **Explain before executing** — Tell me what you're about to do and why, before running any command
2. **Warn before risky actions** — If a command deletes, overwrites, or exposes data, say so clearly first
3. **Small steps always** — Break every task into numbered micro-steps. Do one, confirm, then proceed
4. **Simplest solution first** — If there are 3 ways to do something, suggest the easiest one first
5. **Never touch /openclaw/ submodule** — All changes go in /overlay/ only
6. **Check client isolation** — If creating anything client-specific, always put it under /clients/client-XXX/
7. **Mobile-first UI** — Every UI component must work on a phone screen first
8. **Brand check** — Before completing any UI task, verify no OpenClaw/Moltbot references remain
9. **Save progress** — After completing any significant step, remind me to commit to git
10. **When stuck** — Say so clearly. Give me 2-3 simple options. Don't silently try things.

---

## SECURITY RULES (Non-negotiable)

- Never store client API keys in shared files — always in client-specific .env files
- Never let one client's agent access another client's /data/ folder
- Always use Docker sandboxing for shell-access features
- Never auto-send emails or WhatsApp without explicit client confirmation in dashboard
- Log every agent action in /clients/client-XXX/logs/

---

## BIZGENIX CONTEXT FOR AI DECISIONS

When making product decisions, always ask: "Would a 55-year-old Gujarati textile business owner in Surat understand and trust this?" If yes — build it. If no — simplify it first.

The Indian MSME client trusts people first, technology second. BizClaw succeeds because Umang's personal brand and Bizgenix's credibility precede the technology. The product must feel like an extension of that trust — not a foreign tech tool.

---

This file is maintained by Dr. CA Umang R. Ratani with Claude as tech co-founder.
Update this file whenever major product decisions are made.
