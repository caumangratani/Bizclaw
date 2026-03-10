# DigitalOcean Pilot Customer Runbook

## Goal

Pilot one real BizClaw AI customer on DigitalOcean before scaling.

## Recommended host

- provider: DigitalOcean
- region: BLR1
- size: 4 vCPU / 8 GB RAM / 160 GB SSD
- OS: Ubuntu 24.04 LTS

## Pilot structure

Run on one Droplet:

- one BizClaw customer runtime
- one persistent customer data directory
- one customer subdomain
- one WhatsApp session

## Provisioning sequence

1. create the client locally
2. add provider API keys
3. tune `soul.md`
4. test locally
5. deploy to the Droplet
6. connect WhatsApp
7. monitor for 7 days

## Commands

Create the customer:

```bash
cd /Users/fs/Desktop/Bizgenix-Projects/BizClaw
./scripts/provision-managed-client.sh demo-customer "Demo Customer" "Trading & Distribution" "+919876543210"
```

Test locally:

```bash
./scripts/start-local-stack.sh demo-customer
./scripts/client-launch-url.sh demo-customer
```

Deploy:

```bash
./docker/deploy-client.sh demo-customer
```

## Acceptance test

Pilot is valid only if:

- dashboard opens
- WhatsApp connects
- inbound message works
- reply works
- restart preserves session
- admin panel shows healthy runtime

## Scale trigger

After one customer runs cleanly for 7 to 14 days:

- onboard customer 2
- keep one instance per customer
- move to multiple Droplets only after customer count or load requires it
