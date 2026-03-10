# Hostinger Pilot Customer Runbook

## Decision

Use your existing Hostinger VPS for the first BizClaw AI customer pilot.

That is valid.

DigitalOcean can remain the scale-up option later.

## Why this works

BizClaw AI needs:

- Ubuntu or Debian VPS
- SSH access
- Docker / Docker Compose
- persistent local storage
- stable 24x7 process runtime

Hostinger VPS is good enough for a first pilot if those are available.

## Recommended setup

- OS: Ubuntu 24.04 LTS
- access: root or sudo
- runtime: Docker Compose
- one BizClaw runtime per customer

## Pilot flow

1. create customer locally
2. add API keys
3. test locally
4. copy or clone BizClaw to the Hostinger VPS
5. deploy one customer runtime
6. connect WhatsApp
7. run for 7 to 14 days

## Commands

Create the customer:

```bash
cd /Users/fs/Desktop/Bizgenix-Projects/BizClaw
./scripts/provision-managed-client.sh pilot-client "Pilot Client" "Trading & Distribution" "+919876543210"
```

Test locally:

```bash
./scripts/start-local-stack.sh pilot-client
./scripts/client-launch-url.sh pilot-client
```

Deploy on the VPS:

```bash
./docker/deploy-client.sh pilot-client
```

## Acceptance checklist

- dashboard opens from VPS URL
- WhatsApp QR connects
- inbound message works
- reply works
- restart preserves session
- backup script works

## Scale rule

If the Hostinger pilot is stable, keep using VPS-based customer runtimes.

Later you can:

- stay on Hostinger
- move premium customers to DigitalOcean
- split customers across multiple VPS hosts
