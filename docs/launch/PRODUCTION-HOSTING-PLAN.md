# BizClaw Production Hosting Plan

## Decision

Launch BizClaw as **managed private SaaS on DigitalOcean VPS**.

Do **not** use Railway or App Platform as the primary home for customer runtimes.

Use them only for optional supporting surfaces later:

- marketing site
- lightweight internal admin tools
- preview environments

## Why this is the right choice

BizClaw is not a stateless web app.

Each customer runtime needs:

- persistent local state
- persistent WhatsApp session data
- long-running gateway process
- stable restart behavior
- direct filesystem access for backup / restore
- predictable 24x7 uptime

That fits a VPS better than generic app hosting.

## Hosting model to use now

### Phase 1: 0 to 10 customers

Use **one DigitalOcean Droplet in BLR1** as the primary India production host.

Recommended starting size:

- 4 vCPU
- 8 GB RAM
- 160 GB SSD

Run:

- one BizClaw client container per customer
- one shared Bizgenix admin panel on the same host
- one reverse proxy in front

Why one host first:

- simplest ops
- lowest cost
- current admin panel reads local client folders directly
- easiest support and backup flow

### Phase 2: 10 to 30 customers

Split by host.

Recommended pattern:

- Host A: low-traffic / pilot customers
- Host B: production customers
- Host C: premium or high-volume customers

Still keep:

- one container per client
- one data directory per client
- one token / WhatsApp session per client

### Phase 3: 30 plus customers

Build a central control plane.

That should add:

- centralized customer registry
- remote host inventory
- per-host deployment actions
- central billing / renewals
- host health monitoring
- auto-provisioning

At that point you can place premium customers on dedicated Droplets.

## Provider decision

### Customer runtime: DigitalOcean Droplet

Use for:

- actual customer BizClaw instances
- WhatsApp-connected production workloads
- long-running business automations

Choose BLR1 for India-first customers.

### Optional cheaper alternative: Hetzner

Use only if:

- the customer is price-sensitive
- EU/Singapore latency is acceptable
- you are comfortable with a more hands-on support posture

Do not use Hetzner as the default India-first option.

### Railway

Allowed use:

- internal demos
- previews
- admin experiments

Do not use as the primary production runtime for customer WhatsApp instances.

## What not to use

### DigitalOcean App Platform

Do not use it for BizClaw runtime.

Reason:

- no persistent local filesystem for customer state
- no volumes
- local data can disappear on redeploy/replacement

## Exact launch architecture

### Public surfaces

- `www.bizclaw.in` -> website
- `ops.bizclaw.in` -> Bizgenix admin
- `clientname.bizclaw.in` -> customer BizClaw gateway

### Per-customer layout on the host

- `/srv/bizclaw/repo`
- `/srv/bizclaw/clients/<client-id>/.env`
- `/srv/bizclaw/clients/<client-id>/data`
- `/srv/bizclaw/clients/<client-id>/soul.md`
- `/srv/bizclaw/clients/<client-id>/AGENTS.md`

### Runtime pattern

- one Docker Compose project per client
- one customer subdomain per client
- one persistent data directory per client
- one backup archive set per client

## Customer onboarding path

1. close the deal
2. provision client locally
3. add model API keys
4. tune `soul.md`
5. test locally
6. deploy to production Droplet
7. connect WhatsApp
8. send production URL
9. monitor and support under AMC

## Commands we should use

Create the customer:

```bash
./scripts/provision-managed-client.sh sharma-traders "Sharma Traders" "Trading & Distribution" "+919876543210"
```

Test locally:

```bash
./scripts/start-local-stack.sh sharma-traders
./scripts/client-launch-url.sh sharma-traders
```

Deploy to production host:

```bash
./docker/deploy-client.sh sharma-traders
```

## Upstream OpenClaw update policy

Do not auto-merge upstream directly into production.

Use this safe flow:

```bash
./scripts/sync-openclaw-safe.sh
```

That should remain the update gate until BizClaw has:

- automated regression tests
- branded UI smoke tests
- WhatsApp session regression checks

## Immediate next build items

1. add reverse proxy + SSL config for client subdomains
2. add production deploy runbook for DigitalOcean
3. add admin fields for host, domain, and deployment URL
4. add backup automation
5. add remote health monitoring
