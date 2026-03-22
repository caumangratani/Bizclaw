# BizClaw

**AI Business Agent for Indian MSMEs** | Powered by Bizgenix AI Solutions Pvt. Ltd.

> The AI employee who never sleeps, never takes salary, and never makes excuses.

---

## What is BizClaw?

BizClaw is a white-label AI business agent platform that helps Indian MSMEs automate operations, manage communications, handle follow-ups, organize data, and scale without hiring more staff. Built on OpenClaw with deep customization for Indian business context (GST, TDS, ITR, Tally).

**Key Differentiators:**
- Multi-channel communication (WhatsApp, Telegram, Email, Slack, Teams)
- Indian business context built-in (GST, TDS, ITR, Tally integration)
- Multilingual: English, Hindi, Gujarati
- Per-client isolated deployments for data security
- Browser automation for web tasks
- Approval queue for controlled automation

**Built by:** Bizgenix AI Solutions Pvt. Ltd.
**Website:** [bizgenix.in](https://bizgenix.in)
**Movement:** #ScaleWithAI

---

## Quick Start (5 Steps)

### Step 1: Clone the Repository

```bash
git clone --recurse-submodules https://github.com/caumangratani/Bizclaw.git
cd Bizclaw
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `ADMIN_PASSWORD` - Password for admin dashboard
- `STRIPE_SECRET_KEY` - Stripe API key for billing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification secret
- `ANTHROPIC_API_KEY` - Anthropic API key for AI model

### Step 3: Provision Your First Client

```bash
./scripts/new-client.sh client-name "Client Business Name" "Industry" "+919876543210"
```

### Step 4: Start the Stack

**Local Development:**
```bash
./scripts/start-local-stack.sh client-name
```

**Docker (Self-Hosted):**
```bash
docker-compose -f docker-compose.saas.yml up --build -d
```

**Railway (Cloud):**
```bash
railway up
```

### Step 5: Access Dashboard

- Admin Panel: `http://localhost:18800` (or your deployment URL)
- Client Portal: `http://localhost:18789` (or your client's domain)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Railway / VPS                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Nginx Reverse Proxy                    │   │
│  │                   (SSL Termination)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐   │
│  │                     Admin Panel (18800)                    │   │
│  │  - Client Management                                       │   │
│  │  - Billing & Subscriptions                                 │   │
│  │  - Policy Configuration                                     │   │
│  │  - Usage Analytics                                         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ Client A    │ Client B    │ Client C    │ Client N        │  │
│  │ Gateway     │ Gateway     │ Gateway     │ Gateway         │  │
│  │ (18789)     │ (18790)     │ (18791)     │ (1879x)         │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           │                  │                  │                │
│  ┌────────▼─────┐  ┌────────▼─────┐  ┌────────▼─────┐           │
│  │   WhatsApp    │  │    Gmail     │  │     GST      │           │
│  │   Gateway    │  │   Gateway    │  │   Services   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Admin Panel**: Central management interface for all clients
- **Client Gateway**: Isolated AI agent instance per client
- **Nginx**: Reverse proxy with SSL, rate limiting, and routing
- **WhatsApp/Gmail/GST**: External service integrations

---

## Self-Hosting Guide

### Prerequisites

- VPS with Ubuntu 20.04+ (2GB RAM minimum)
- Docker & Docker Compose
- Domain with DNS configured
- SSL certificates (or use Let's Encrypt)

### Step 1: Server Setup

```bash
# SSH into your VPS
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose

# Create project directory
mkdir -p /opt/bizclaw
cd /opt/bizclaw
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone --recurse-submodules https://github.com/caumangratani/Bizclaw.git .
cd Bizclaw

# Create .env file
cp .env.example .env
nano .env
```

### Step 3: SSL Certificates

```bash
# Using Let's Encrypt
apt install certbot
certbot certonly --standalone -d your-domain.com

# Copy certificates to certs directory
mkdir -p certs
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/
```

### Step 4: Deploy with Docker Compose

```bash
# Build and start
docker-compose -f docker-compose.saas.yml up --build -d

# View logs
docker-compose -f docker-compose.saas.yml logs -f

# Check status
docker-compose -f docker-compose.saas.yml ps
```

### Step 5: Nginx Configuration

The included `nginx.conf` handles:
- SSL termination
- Rate limiting (API: 10r/s, Auth: 3r/s)
- WebSocket support for real-time features
- Client portal routing
- Static file caching
- Stripe webhook proxy (no buffering for webhook integrity)

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes | - | Admin dashboard password |
| `STRIPE_SECRET_KEY` | No | - | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | No | - | Stripe webhook verification |
| `ADMIN_BASE_URL` | No | http://localhost:18800 | Public URL of admin panel |
| `BIZCLAW_GATEWAY_PORT` | No | 18789 | Default client gateway port |
| `CLIENTS_DIR` | No | /clients | Directory for client data |

---

## Railway Deployment

### Step 1: Create Railway Project

1. Sign up at [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repository

### Step 2: Configure Environment

In Railway dashboard, add environment variables:
- `ADMIN_PASSWORD` - Secure password for admin access
- `STRIPE_SECRET_KEY` - Stripe live/test key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `ANTHROPIC_API_KEY` - Anthropic API key

### Step 3: Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway init
railway add

# Deploy
railway up
```

### Step 4: Custom Domain

1. In Railway dashboard, go to Settings > Networking
2. Add custom domain (e.g., `admin.your-domain.com`)
3. Configure DNS CNAME record pointing to Railway

---

## Client Management

### Adding a New Client

**CLI Method:**
```bash
# Create client configuration
./scripts/new-client.sh acme-textiles "Acme Textiles" "Textiles" "+919876543210"

# Provision managed client with billing
./scripts/provision-managed-client.sh acme-textiles "Acme Textiles" "Textiles" "+919876543210"
```

**Dashboard Method:**
1. Login to admin panel
2. Navigate to Clients > Add New
3. Fill in client details
4. Select subscription plan
5. Send provisioning link to client

### Client Directory Structure

```
clients/
└── client-name/
    ├── config.json          # Client configuration
    ├── .env                 # Client API keys
    ├── data/                # Client data (isolated)
    │   ├── state/           # Agent state
    │   ├── logs/            # Activity logs
    │   └── memory/          # Vector memory
    └── workspace/           # Client workspace
```

### Provisioning a Client Gateway

```bash
# On VPS
sudo ./scripts/add-client-vps.sh client-name "Client Name" "Industry" "+919876543210" "sk-ant-api-key"

# Generate client URLs
./scripts/client-launch-url.sh client-name https://your-domain.com
```

---

## Billing Setup

### Stripe Configuration

1. Create Stripe account and get API keys
2. Set up products and prices in Stripe dashboard

**Recommended Pricing Tiers:**

| Plan | Price | Features |
|------|-------|----------|
| Starter | ₹15,000/month | 1 user, WhatsApp only, basic reports |
| Professional | ₹25,000/month | 5 users, all channels, advanced reports |
| Enterprise | Custom | Unlimited users, dedicated support |

### Webhook Setup

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### Billing API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Create customer portal session |
| `/api/billing/webhook` | POST | Handle Stripe webhooks |
| `/api/billing/status` | GET | Get subscription status |

---

## Security

### Policy Tiers

BizClaw implements tiered security policies:

| Tier | Features | Use Case |
|------|----------|----------|
| **Sandbox** | No external actions, all approvals required | New clients, testing |
| **Standard** | Read operations auto-approved, write ops need approval | Regular operations |
| **Trusted** | Auto-approved with audit logging | Established clients |

### Approval Queue

All sensitive operations go through approval queue:
- External API calls
- Financial transactions
- Data exports
- Configuration changes

### Data Isolation

Each client runs in isolated environment:
- Separate Docker container
- Separate data directory
- Separate API keys
- Network isolation

---

## White-Label Setup

To rebrand BizClaw for your own SaaS:

### 1. Update Branding

Edit `overlay/branding/`:
- Replace logos with your brand assets
- Update color scheme in `config.json`
- Modify favicon and app icons

### 2. Configure Custom Domain

```bash
# In your DNS provider
CNAME admin.your-brand.com -> your-railway-app.railway.app
CNAME client.your-brand.com -> your-railway-app.railway.app
```

### 3. Update Footer

Edit `admin/public/index.html` and replace:
- "Powered by Bizgenix" with your company
- Links to point to your website

### 4. Set Up Your Stripe

Replace Stripe keys with your own:
- `STRIPE_SECRET_KEY` - Your Stripe account
- `STRIPE_WEBHOOK_SECRET` - Your webhook endpoint

---

## API Reference

### Admin API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/auth/login` | POST | None | Admin login |
| `GET /api/clients` | GET | Admin | List all clients |
| `POST /api/clients` | POST | Admin | Create new client |
| `GET /api/clients/:id` | GET | Admin | Get client details |
| `DELETE /api/clients/:id` | DELETE | Admin | Remove client |
| `POST /api/clients/:id/provision` | POST | Admin | Provision client gateway |
| `POST /api/clients/:id/suspend` | POST | Admin | Suspend client |
| `GET /api/clients/:id/usage` | GET | Admin | Get usage statistics |
| `GET /api/billing/plans` | GET | Admin | List billing plans |
| `POST /api/billing/create-checkout` | POST | Admin | Create checkout session |

### Client Gateway API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `GET /health` | GET | None | Health check |
| `GET /status` | GET | Client | Gateway status |
| `POST /message` | POST | Client | Send message to agent |
| `GET /logs` | GET | Client | Get activity logs |
| `POST /approve` | POST | Client | Approve pending action |
| `POST /reject` | POST | Client | Reject pending action |

---

## Troubleshooting

### Common Issues

**Admin panel not loading:**
```bash
# Check if admin container is running
docker ps | grep admin

# View logs
docker logs bizclaw-admin

# Restart container
docker-compose -f docker-compose.saas.yml restart admin
```

**Client gateway won't start:**
```bash
# Check port conflicts
netstat -tulpn | grep 18789

# Verify client config
cat clients/client-name/config.json

# Check API keys
cat clients/client-name/.env
```

**SSL certificate issues:**
```bash
# Renew Let's Encrypt certificate
certbot renew

# Restart nginx
docker-compose -f docker-compose.saas.yml restart nginx
```

**Stripe webhooks failing:**
- Verify webhook URL is publicly accessible
- Check Stripe dashboard for webhook failure logs
- Ensure `STRIPE_WEBHOOK_SECRET` matches exactly

### Health Checks

```bash
# Admin panel
curl http://localhost:18800/healthz

# All containers
docker-compose -f docker-compose.saas.yml ps

# Nginx status
docker exec bizclaw-nginx nginx -t
```

### Logs

```bash
# All services
docker-compose -f docker-compose.saas.yml logs -f

# Specific service
docker-compose -f docker-compose.saas.yml logs -f admin

# Last 100 lines
docker-compose -f docker-compose.saas.yml logs --tail=100
```

---

## License

MIT — Built on [OpenClaw](https://github.com/openclaw/openclaw) (MIT, Peter Steinberger 2025).

BizClaw customizations and SaaS platform: Copyright 2026 Bizgenix AI Solutions Pvt. Ltd. All rights reserved.

---

**Need Help?**

- Documentation: [bizgenix.in/bizclaw](https://bizgenix.in)
- Support: support@bizgenix.in
- GitHub Issues: [caumangratani/Bizclaw](https://github.com/caumangratani/Bizclaw/issues)

**#ScaleWithAI**
