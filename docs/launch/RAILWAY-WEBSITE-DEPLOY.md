# BizClaw AI Website on Railway

## Goal

Deploy only the public BizClaw AI website on Railway from the `website/` directory.

The customer runtime stays separate on DigitalOcean.

## Service setup

Create a new Railway service with:

- repo: BizClaw
- root directory: `website`

Railway will use:

- `website/package.json`
- `website/server.mjs`
- `website/railway.toml`

## Local validation

```bash
cd website
npm start
```

Checks:

- `/` should return the landing page
- `/healthz` should return JSON

## Railway CLI flow

```bash
cd website
railway login
railway init
railway up
```

## Environment variables

No required secrets for the website-only service.

Optional later:

- `PUBLIC_WHATSAPP_NUMBER`
- `PUBLIC_CALENDLY_URL`
- `PUBLIC_DEMO_FORM_URL`

## Domain setup

Attach:

- `bizclaw.ai`
- or `www.bizclaw.ai`
- or your chosen `bizclaw.in` domain

## What this service should do

- serve the landing page
- collect demo requests
- send users to WhatsApp / booking CTA

It should **not** host customer runtime state.
