# BizClaw SaaS Operating Model

BizClaw can be sold as SaaS commercially even if the runtime is deployed one-client-per-instance.

That is the right model now.

## What we sell today

Use this commercial structure:

- setup fee
- recurring monthly subscription
- AMC / support / prompt tuning
- optional workflow customization

The customer experiences it like SaaS:

- recurring billing
- branded login URL
- ongoing updates
- support and maintenance by Bizgenix

But operationally each client gets an isolated runtime.

That gives:

- safer data separation
- easier WhatsApp session handling
- cleaner support
- easier rollback when one client breaks

## Recommended model

### Mode 1: Managed private SaaS

Best for current stage.

You provision:

- one BizClaw instance per client
- one subdomain or port per client
- one WhatsApp session per client
- one billing relationship per client

Charge:

- setup
- monthly SaaS
- AMC / retainership

### Mode 2: Self-serve SaaS

Do later, not now.

That needs:

- central auth
- tenant database
- central billing
- self-serve onboarding
- automated tenant provisioning
- customer-facing password reset / invites

## Customer implementation flow

1. close the sale
2. create client folder
3. fill client `.env`
4. customize `soul.md`
5. run local demo
6. connect WhatsApp
7. deploy client instance
8. send tokenized URL
9. start monthly AMC / support

## What makes it SaaS in practice

The customer should only feel:

- "I have a BizClaw login"
- "my WhatsApp is connected"
- "it keeps working"
- "Bizgenix updates it"
- "I pay monthly"

They should not care whether the backend is multi-tenant or isolated.

## Recommended next product layer

To strengthen the SaaS feel, add these next:

- central customer registry in admin
- plan / subscription fields
- renewal reminders
- client health status
- deploy URL per client
- one-click restart / backup / relink actions
