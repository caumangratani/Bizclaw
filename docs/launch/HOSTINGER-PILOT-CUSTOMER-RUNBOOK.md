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
- WhatsApp QR completes the full login cycle
- inbound message works
- reply works
- restart preserves session
- backup script works

## WhatsApp onboarding rule

On Hostinger, do not treat QR display as success.

The correct test is:

1. open Channels
2. click `Show QR`
3. keep the page open until the login cycle completes
4. confirm `Running: Yes`
5. confirm `Connected: Yes`
6. send a real inbound WhatsApp message

Implementation note:

- the BizClaw control UI now auto-triggers the wait step after `Show QR` / `Relink`
- this is required because the WhatsApp provider may return `status=515 restart required`
  once before the login stabilizes
- for Hostinger testing, use the SSH tunnel URL such as `http://127.0.0.1:48790/...`
  instead of the raw VPS IP
- if WhatsApp still ends in `logged out`, click `Logout`, generate a fresh QR, and retry
  the full flow once more before judging the VPS unstable
- if the runtime is stuck in `logged out` with provider `401 Unauthorized`, run
  `./scripts/reset-client-whatsapp.sh <client-id>`, restart the service, and relink

If the account falls back to `logged out`, do a clean `Logout` and retry with a fresh QR before moving on.

## Scale rule

If the Hostinger pilot is stable, keep using VPS-based customer runtimes.

Later you can:

- stay on Hostinger
- move premium customers to DigitalOcean
- split customers across multiple VPS hosts
