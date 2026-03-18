# BizClaw Team Client Onboarding

This is the exact repeatable flow for creating a new BizClaw client on the VPS.

Use this for every new managed client.

## Before You Start

Collect these 4 things:

1. `client-id`
2. `client display name`
3. `business type`
4. `owner WhatsApp number`
5. `client Anthropic API key`

Example:

- `client-id`: `mayurbhai`
- `name`: `Mayurbhai Client UTC`
- `business`: `Trading & Distribution`
- `phone`: `+919XXXXXXXXX`
- `key`: `sk-ant-...`

## Step 1: Log Into VPS

```bash
ssh root@72.62.228.60
cd /opt/bizclaw
```

## Step 2: Sync Latest Code

```bash
git pull
```

If `git pull` fails because of local VPS changes, stop and escalate before continuing.

## Step 3: Create the Client

```bash
sudo ./scripts/add-client-vps.sh mayurbhai "Mayurbhai Client UTC" "Trading & Distribution" "+919XXXXXXXXX" "sk-ant-client-key-here"
```

What this does:

- creates a separate client instance
- writes the client's own API key into that client only
- bootstraps auth
- starts a separate systemd service
- prints a dashboard URL

## Step 4: Open the Dashboard

Copy the dashboard URL printed by the command and open it in the browser.

Then:

1. go to `Channels`
2. click `Show QR`

## Step 5: Connect Client WhatsApp

On the client phone:

1. open WhatsApp
2. go to `Linked Devices`
3. tap `Link a device`
4. scan the QR from BizClaw

If linking fails:

1. remove any old BizClaw/OpenClaw linked device from the phone
2. click `Logout`
3. click `Relink`
4. scan the fresh QR

## Step 6: Test Before Handoff

Do these 3 checks:

1. Send one normal message from the owner WhatsApp
2. Schedule one test message for `2 minutes later`
3. Send one message from an unauthorized number

Expected:

- owner chat should work
- scheduled message should actually deliver
- unauthorized number should be ignored

## Step 7: Service Commands

Replace `mayurbhai` with the real client id.

Check status:

```bash
systemctl status bizclaw-client@mayurbhai
```

View logs:

```bash
journalctl -u bizclaw-client@mayurbhai -f
```

Restart:

```bash
systemctl restart bizclaw-client@mayurbhai
```

Stop:

```bash
systemctl stop bizclaw-client@mayurbhai
```

## Step 8: Readiness Check

```bash
cd /opt/bizclaw
./scripts/client-readiness.sh mayurbhai --json
```

Client is ready only if:

- gateway is healthy
- token is configured
- agent auth is present
- WhatsApp is linked
- `ready: true`

## Important Rules

- One client = one isolated BizClaw service
- Do not reuse another client's folder
- Do not reuse another client's WhatsApp session
- Use the client's own API key whenever possible
- Hand off only after WhatsApp and scheduled message testing passes

## One-Line Command Template

```bash
cd /opt/bizclaw && git pull && sudo ./scripts/add-client-vps.sh <client-id> "<Client Name>" "<Business Type>" "+91XXXXXXXXXX" "<ANTHROPIC_API_KEY>"
```

## Example Ready to Copy

```bash
cd /opt/bizclaw && git pull && sudo ./scripts/add-client-vps.sh mayurbhai "Mayurbhai Client UTC" "Trading & Distribution" "+919724489521" "sk-ant-client-key-here"
```
