# SmartMitra to BizClaw AI Consolidation Plan

## Decision

Run only one external product: **BizClaw AI**.

SmartMitra stays internal as a donor codebase until the useful SaaS pieces are absorbed into BizClaw AI.

## What BizClaw AI already covers

- customer-facing AI operator runtime
- WhatsApp-first agent experience
- per-client deployment model
- white-labeled control UI
- operator/admin panel
- managed deployment workflow

## What SmartMitra contributes

SmartMitra has useful SaaS features that BizClaw AI does not yet expose cleanly:

- login and session flow
- customer dashboard patterns
- Razorpay billing and subscription flow
- registration / onboarding flow
- customer data models for reminders, notes, expenses, follow-ups

## What to migrate first

### Phase 1: commercial SaaS shell

Lift into BizClaw AI first:

- Razorpay subscription flow from the SmartMitra FastAPI app (`app/api/payment.py`)
- login / auth flow from the SmartMitra FastAPI app
- simple customer account page based on SmartMitra templates (`app/templates/customer_dashboard.html`)

Reason:

- this creates a sellable BizClaw AI signup / pay / access path
- this is higher leverage than porting every SmartMitra feature immediately

### Phase 2: business data modules

Then port or re-implement:

- party ledger
- expense tracker
- compliance calendar
- follow-up engine
- smart reminders
- notes / memory

These map well to the emerging BizClaw overlay skill folders already appearing in the repo.

### Phase 3: customer self-serve

Later:

- signup onboarding wizard
- self-serve tenant provisioning
- subscription management
- account settings

## What not to migrate directly

Do not blindly copy SmartMitra as-is.

Avoid direct carry-over of:

- SmartMitra branding
- old template styling
- duplicated business logic that now belongs in BizClaw skills
- Twilio-specific assumptions if BizClaw runtime is the primary messaging layer

## Product architecture after consolidation

- BizClaw AI website and SaaS shell
- BizClaw AI operator/admin panel
- BizClaw AI customer runtime per client
- SmartMitra retired as an external product name

## Execution order

1. deploy BizClaw AI website on Railway
2. pilot one DigitalOcean customer runtime
3. add billing/auth shell into BizClaw AI
4. absorb SmartMitra business modules into BizClaw AI skills and admin
5. retire SmartMitra branding completely
