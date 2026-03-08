# BizClaw Client Delivery SOP

This is the repeatable install flow for a sold BizClaw client.

## 1. Create the client

```bash
cd /Users/fs/Desktop/Bizgenix-Projects/BizClaw
./scripts/new-client.sh sharma-traders "Sharma Traders" "Trading & Distribution" "+919876543210"
```

## 2. Fill the client secrets

Edit:

- `clients/<client-id>/.env`

Set at least:

- `OPENAI_API_KEY` or `GOOGLE_API_KEY`
- `GATEWAY_TOKEN` if you want to override the generated token
- `TELEGRAM_BOT_TOKEN` if Telegram is part of the deal

## 3. Customize the business behavior

Edit:

- `clients/<client-id>/soul.md`
- `clients/<client-id>/AGENTS.md`
- `clients/<client-id>/openclaw.json` when channel or policy changes are needed

This is where you tune:

- language and tone
- owner greeting
- approval rules
- business workflows
- collections, compliance, reporting, or support use cases

## 4. Build BizClaw

```bash
./scripts/build.sh
```

## 5. Test locally first

```bash
./scripts/run-client-local.sh <client-id>
./scripts/client-launch-url.sh <client-id>
```

Open the printed `Channels` URL and connect WhatsApp.

If the first scan succeeds but the provider asks for a restart, restart the local gateway once and refresh the page.

## 6. Acceptance checklist

Before client handoff, verify all of this:

- dashboard opens from the tokenized URL
- branding says `BizClaw`
- WhatsApp shows `Configured: Yes`
- WhatsApp shows `Linked: Yes`
- WhatsApp shows `Running: Yes`
- WhatsApp shows `Connected: Yes`
- one inbound WhatsApp message gets an ack reaction
- one inbound WhatsApp message gets an actual reply
- chat page shows the WhatsApp conversation session

## 7. Deploy for the client

Docker path:

```bash
./docker/deploy-client.sh <client-id>
./scripts/client-launch-url.sh <client-id> https://client.example.com
```

VPS path:

```bash
sudo ./scripts/install-vps.sh
```

Then:

- place the correct `.env` on the server
- start `bizclaw`
- open the tokenized URL
- connect WhatsApp once

## 8. Internal operator setup

Track the client in the Bizgenix admin panel:

- setup fee
- AMC / retainer
- owner contact
- deployment URL
- last WhatsApp reconnect date
- renewal / billing date

## 9. Support posture

For every live client keep:

- one isolated client folder
- one isolated tokenized dashboard URL
- one isolated WhatsApp session
- one restart command
- one backup command

Useful commands:

```bash
./scripts/status-all.sh
./scripts/backup-client.sh <client-id>
./scripts/reset-client.sh <client-id>
```
