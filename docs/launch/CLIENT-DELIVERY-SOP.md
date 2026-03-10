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

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` for fallback model coverage
- `GOOGLE_API_KEY` only if the client uses Gemini-specific flows
- `GATEWAY_TOKEN` if you want to override the generated token
- `TELEGRAM_BOT_TOKEN` if Telegram is part of the deal

Then run:

```bash
./scripts/bootstrap-client-auth.sh <client-id>
```

BizClaw now mirrors provider auth into both the client agent and the fallback `main`
agent, so WhatsApp replies do not leak backend auth errors.

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

BizClaw now auto-waits after QR generation, so `Show QR` should be treated as one flow:

- click `Show QR`
- keep the page open
- scan from WhatsApp Linked Devices
- wait for the UI to finish the login cycle

If you are operating a remote VPS through an SSH tunnel, use the local forwarded URL
for the control UI instead of the raw server IP. The control UI is only reliable on
`https://...` or `http://127.0.0.1:<port>` style loopback URLs.

If the provider returns `status=515 restart required`, the gateway wait flow should retry once automatically.
If WhatsApp still shows `logged out` after that, do a clean `Logout` and generate a fresh QR.
If the client is stuck in a stale `logged out` / `401 Unauthorized` loop, run:

```bash
./scripts/reset-client-whatsapp.sh <client-id>
```

Then restart the runtime and relink WhatsApp.

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

Run the backend readiness check too:

```bash
./scripts/client-readiness.sh <client-id>
```

The client is only launch-ready when it reports:

- token configured
- default agent auth present
- main agent auth present
- WhatsApp linked

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
- connect WhatsApp once and keep the Channels page open until the login cycle completes

## 8. WhatsApp production note

For VPS installs, the safe operating rule is:

- use a proper domain + HTTPS for the customer dashboard
- do not rely on bare IP for operator access
- do not treat `QR visible` as success
- success is only when WhatsApp shows `Running: Yes` and `Connected: Yes`

If a VPS pairing attempt fails with `logged out` or `status=515 restart required`:

1. click `Logout`
2. generate a fresh QR
3. keep the page open until the auto-wait flow finishes
4. only hand off after a real inbound message test

## 9. Internal operator setup

Track the client in the Bizgenix admin panel:

- setup fee
- AMC / retainer
- owner contact
- deployment URL
- last WhatsApp reconnect date
- renewal / billing date

## 10. Support posture

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
