# Bizgenix Admin Panel — Design Document

**Date:** 2026-02-22
**Status:** Approved
**Author:** BizClaw Engineering

## Overview

Standalone admin server for Bizgenix (the operator) to manage all BizClaw client instances from a single web dashboard. Includes client management, health monitoring, chat preview, soul.md editing with version history, billing tracking, security overview, and client notes (CRM).

## Architecture

- **Server:** Express.js on port 18800
- **Frontend:** Plain HTML + Tailwind CSS + Alpine.js (no build step)
- **Auth:** Password login with bcrypt hash, 24h session cookie
- **Data:** JSON files in `admin/data/` (no database)
- **Location:** `/BizClaw/admin/`
- **Communication:** Reads `clients/` directory + Docker API + client WebSocket

## Pages

### 1. Dashboard (`/`)
- Grid of client cards: name, status (UP/DOWN), port, last active, message count
- Top stats: total clients, messages today, alerts
- "Add New Client" button
- Quick actions per card: restart, logs, open dashboard

### 2. Client Detail (`/client/:id`)
- Config viewer (openclaw.json, soul.md preview)
- Live health: container status, gateway reachable, channels connected
- Recent chat preview (last 10 messages from agent)
- Channel status: WhatsApp (connected/disconnected), Telegram (active/inactive)
- **Soul.md editor** with version history (last 5 saves + restore button)
- **Client notes** text area (saves to admin/data/client-notes.json) — mini CRM
- Actions: Restart | Stop | Reset Memory | Backup | Open Client Dashboard

### 3. Add Client (`/client/new`)
- Form: Client Name, Business Type, Phone, Email
- Auto-generate: client ID (slug), gateway token, next available port
- "Create & Deploy" button → runs new-client.sh + deploy-client.sh
- Progress indicator: creating → deploying → ready (shows dashboard URL + QR instructions)

### 4. Security (`/security`)
- Per-client: gateway token set? API keys valid? Last backup date?
- HTTPS status / nginx proxy status
- Client isolation verification button
- Failed login attempts log

### 5. Billing (`/billing`)
- Per-client: plan name, monthly fee (INR), start date, payment status
- Manual payment marking (Paid/Pending/Overdue)
- Export to CSV
- Future: Razorpay integration (Sprint 2)

## Key Features (from review)

1. **Client Notes:** Simple text area per client, saved to JSON. Acts as CRM for tracking issues, customizations, and conversations with client.

2. **Soul.md Version History:** Every save creates a timestamped backup (last 5). One-click restore to any previous version. Prevents personality disasters.

3. **WhatsApp Session Persistence Test:** Part of the testing checklist — verify QR scan survives container restart without re-scanning.

## Security

- Admin: password + bcrypt, 24h sessions, rate-limited login (5 attempts → 15 min lockout)
- Bind to 127.0.0.1 by default (localhost only)
- API keys displayed masked (sk-...7890)
- Sprint 2: nginx reverse proxy + SSL + IP whitelist for remote access

## File Structure

```
admin/
  server.js          — Express server (entry point)
  package.json       — Dependencies
  config.json        — Admin password hash, port, settings
  data/
    billing.json     — Billing records per client
    client-notes.json — Notes per client
    soul-history/    — Soul.md version history per client
  public/
    index.html       — Dashboard page
    client.html      — Client detail page
    new-client.html  — Add client form
    security.html    — Security overview
    billing.html     — Billing tracker
    login.html       — Login page
    css/
      styles.css     — Tailwind + custom styles
    js/
      app.js         — Alpine.js components + API calls
      dashboard.js   — Dashboard-specific logic
      client.js      — Client detail logic
```

## Testing Checklist

1. Deploy self as Client #1 (bizgenix-internal)
2. Start container, verify BizClaw dashboard at :18789
3. Chat test — verify personality response
4. WhatsApp QR scan — verify connection
5. **WhatsApp persistence — restart container, verify still connected**
6. Create second test client on :18790
7. Isolation — verify client A can't access client B
8. Admin panel — verify all clients show up
9. Soul.md edit — edit, save, verify version history, restore
10. Backup + restore test
11. Reset memory test
12. Security: test gateway without token (should reject)
