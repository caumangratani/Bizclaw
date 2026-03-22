# Bizgenix Admin Panel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone admin dashboard for Bizgenix to manage all BizClaw client instances from one place.

**Architecture:** Express.js server on port 18800 serving plain HTML + Tailwind + Alpine.js pages. Reads clients/ directory for config, talks to Docker API for container management, connects to client gateways via HTTP for health checks. JSON files for billing/notes data. Password-protected with bcrypt.

**Tech Stack:** Node.js 22, Express, Tailwind CDN, Alpine.js CDN, bcrypt, dockerode (Docker API)

---

### Task 1: Admin Server Scaffold

**Files:**
- Create: `admin/package.json`
- Create: `admin/server.js`
- Create: `admin/config.json`
- Create: `admin/data/billing.json`
- Create: `admin/data/client-notes.json`
- Create: `admin/data/soul-history/.gitkeep`

**Step 1: Create package.json**

```json
{
  "name": "bizclaw-admin",
  "version": "1.0.0",
  "description": "Bizgenix Admin Panel for BizClaw",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.6",
    "dockerode": "^4.0.0"
  }
}
```

**Step 2: Create server.js — Express server with auth middleware**

Core routes:
- `GET /` → Dashboard (redirect to /login if not authed)
- `GET /login` → Login page
- `POST /api/login` → Verify password, set cookie
- `POST /api/logout` → Clear cookie
- `GET /api/clients` → List all clients with health status
- `GET /api/clients/:id` → Single client detail
- `POST /api/clients` → Create new client (runs new-client.sh)
- `POST /api/clients/:id/restart` → Restart container
- `POST /api/clients/:id/stop` → Stop container
- `POST /api/clients/:id/reset` → Reset memory (runs reset-client.sh)
- `GET /api/clients/:id/chat-preview` → Last 10 messages
- `GET /api/clients/:id/soul` → Get soul.md content
- `PUT /api/clients/:id/soul` → Save soul.md (with version history)
- `POST /api/clients/:id/soul/restore/:version` → Restore soul version
- `GET /api/clients/:id/notes` → Get notes
- `PUT /api/clients/:id/notes` → Save notes
- `GET /api/billing` → All billing records
- `PUT /api/billing/:id` → Update billing for client
- `GET /api/security` → Security overview

Auth middleware: check session cookie on all routes except /login and /api/login.

**Step 3: Create config.json with default admin password**

```json
{
  "port": 18800,
  "bind": "127.0.0.1",
  "adminPasswordHash": "",
  "sessionSecret": "",
  "clientsDir": "../clients",
  "scriptsDir": "../scripts"
}
```

**Step 4: Create empty data files**

billing.json: `{}`
client-notes.json: `{}`

**Step 5: Install dependencies and test server starts**

Run: `cd admin && npm install && node server.js`
Expected: "Bizgenix Admin Panel running on http://127.0.0.1:18800"

**Step 6: Commit**

```bash
git add admin/
git commit -m "feat(admin): scaffold Express server with auth and API routes"
```

---

### Task 2: Login Page

**Files:**
- Create: `admin/public/login.html`

**Step 1: Create login page**

BizClaw-branded login form:
- Bizgenix logo/name at top
- Username field (hardcoded "admin")
- Password field
- "Login" button
- Failed attempt counter with lockout message
- Tailwind styling: dark theme, green accent (#16A34A)

**Step 2: Wire up to POST /api/login**

Alpine.js x-data for form state, fetch to /api/login, redirect to / on success.

**Step 3: Test login flow**

Run: Set admin password via `node -e "require('bcryptjs').hash('test123',10).then(h=>console.log(h))"`
Put hash in config.json.
Open http://localhost:18800/login → enter "test123" → should redirect to dashboard.

**Step 4: Commit**

---

### Task 3: Dashboard Page

**Files:**
- Create: `admin/public/index.html`
- Create: `admin/public/js/dashboard.js`

**Step 1: Create dashboard HTML**

Layout:
- Top bar: "Bizgenix Admin" + logout button
- Stats row: Total Clients | Active | Down | Messages Today
- Client grid: cards with name, status dot, port, business type, quick actions
- "Add New Client" floating button (bottom right)

**Step 2: Create dashboard.js**

Alpine.js component:
- On load: fetch `/api/clients` → populate grid
- Poll every 30s for health updates
- Quick action buttons: restart, open dashboard (opens client port in new tab)
- Status colors: green=UP, red=DOWN, yellow=starting

**Step 3: Test dashboard**

Create 2 test clients, verify they show up in grid with correct status.

**Step 4: Commit**

---

### Task 4: Client Detail Page

**Files:**
- Create: `admin/public/client.html`
- Create: `admin/public/js/client.js`

**Step 1: Create client detail HTML**

Layout:
- Header: Client name + status badge + "Open Dashboard" button
- Row 1: Config summary (business type, phone, port, created date)
- Row 2: Channel status cards (WhatsApp: connected/not, Telegram: active/not)
- Row 3: Soul.md editor (textarea with Save + version history sidebar)
- Row 4: Client notes (textarea with auto-save)
- Row 5: Recent chat preview (last 10 messages, read-only)
- Row 6: Actions (Restart | Stop | Reset Memory | Backup | Delete)

**Step 2: Soul.md editor with version history**

- On save: PUT /api/clients/:id/soul → server saves + creates timestamped backup
- Version sidebar: shows last 5 versions with timestamps
- Click version → preview diff
- "Restore" button → POST /api/clients/:id/soul/restore/:version

**Step 3: Client notes**

- Textarea with debounced auto-save (save after 2s of no typing)
- PUT /api/clients/:id/notes

**Step 4: Action buttons**

- Restart: POST /api/clients/:id/restart → show spinner → refresh status
- Reset Memory: POST /api/clients/:id/reset → confirmation modal → run reset-client.sh
- Backup: POST /api/clients/:id/backup → run backup-client.sh → show result

**Step 5: Commit**

---

### Task 5: Add Client Page

**Files:**
- Create: `admin/public/new-client.html`
- Create: `admin/public/js/new-client.js`

**Step 1: Create form HTML**

Fields:
- Client Name (required) — e.g., "Sharma Traders"
- Business Type (dropdown: Textiles, IT Services, Manufacturing, Retail, Services, Other)
- Phone (required) — e.g., "+919876543210"
- Email (optional)
- Auto-generated preview: Client ID (slug), Port, Gateway Token

**Step 2: Create + Deploy flow**

On submit:
1. POST /api/clients → server runs new-client.sh with params
2. Show progress: "Creating client..." → "Deploying container..." → "Ready!"
3. On success: show dashboard URL + WhatsApp QR setup instructions
4. "Go to Client" button → opens client detail page

**Step 3: Commit**

---

### Task 6: Billing Page

**Files:**
- Create: `admin/public/billing.html`
- Create: `admin/public/js/billing.js`

**Step 1: Create billing table HTML**

Table columns: Client Name | Plan | Monthly Fee (₹) | Start Date | Status | Actions
Status: Paid (green) | Pending (yellow) | Overdue (red)
Actions: Mark Paid | Edit | View History

**Step 2: Wire up API**

- Load: GET /api/billing
- Mark paid: PUT /api/billing/:id with status
- Export CSV button: generate and download

**Step 3: Commit**

---

### Task 7: Security Page

**Files:**
- Create: `admin/public/security.html`
- Create: `admin/public/js/security.js`

**Step 1: Create security overview HTML**

Per-client checklist:
- ✅/❌ Gateway token set
- ✅/❌ API keys configured
- ✅/❌ Last backup < 24h
- ✅/❌ Container running
- ✅/❌ WhatsApp session active

Global:
- Admin password strength indicator
- HTTPS status
- Bind address (localhost vs 0.0.0.0)
- Failed login attempts (last 24h)

**Step 2: Commit**

---

### Task 8: Shared CSS + Navigation

**Files:**
- Create: `admin/public/css/styles.css`
- Create: `admin/public/js/app.js`

**Step 1: Create shared styles**

BizClaw admin theme:
- Dark sidebar (#1a1a2e) with green accent (#16A34A)
- Navigation: Dashboard | Clients | Billing | Security | Logout
- Mobile responsive (sidebar collapses to hamburger)
- Card components, status badges, form styles

**Step 2: Create shared app.js**

- Navigation component (Alpine.js)
- Toast notification system
- Confirmation modal component
- Date formatting helpers

**Step 3: Commit**

---

### Task 9: End-to-End Testing

**Step 1: Deploy self as Client #1**

```bash
cd <path-to-bizclaw-repo>
./scripts/new-client.sh bizgenix "Bizgenix Internal" "AI Consulting" "+918200858674"
# Copy API keys from master .env to clients/bizgenix/.env
./docker/deploy-client.sh bizgenix
```

**Step 2: Verify client dashboard**

Open http://localhost:18789 → verify BizClaw branding, chat works.

**Step 3: Test WhatsApp QR + persistence**

1. Open WhatsApp channel in dashboard → scan QR
2. Send message from phone → verify BizClaw responds
3. Restart container: `docker compose -p bizclaw-bizgenix restart`
4. Verify WhatsApp STILL connected (no re-scan needed)

**Step 4: Deploy second test client**

```bash
./scripts/new-client.sh test-demo "Demo Corp" "Technology" "+910000000000"
./docker/deploy-client.sh test-demo
```

**Step 5: Test isolation**

- Open :18789 (bizgenix) and :18790 (test-demo) in different browser tabs
- Verify different client names, different chat histories
- Verify one can't access the other's gateway

**Step 6: Start admin panel and verify**

```bash
cd admin && npm start
```

Open http://localhost:18800 → login → verify both clients show in dashboard.

**Step 7: Test admin actions**

- Restart test-demo from admin panel → verify container restarts
- Edit soul.md → save → verify version created → restore previous version
- Add client notes → refresh page → verify persisted
- Run backup from admin panel → verify tar.gz created

**Step 8: Security verification**

- Try accessing client gateway without token → should reject
- Try accessing admin panel without login → should redirect to login
- Enter wrong password 5 times → should get locked out
- Verify .env files are not in any git-tracked location

**Step 9: Cleanup and commit**

---

### Task 10: Admin Panel Docker Support

**Files:**
- Create: `admin/Dockerfile`
- Modify: `docker/docker-compose.yml` — add admin service

**Step 1: Create admin Dockerfile**

Simple Node.js container that runs the admin server.
Mount: clients/ directory + docker socket (for container management).

**Step 2: Add to docker-compose**

Admin service on port 18800, only accessible from localhost.

**Step 3: Commit**

---

## Post-Implementation

After all tasks complete:
1. Run full testing checklist (Task 9)
2. Use BizClaw for your own business for 1 week
3. Identify pilot client
4. Demo from phone
