// admin/stripe-billing.js
// Stripe billing integration for BizClaw SaaS
// Bizgenix AI Solutions Pvt. Ltd.

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || "http://127.0.0.1:18800";

// Lazy-load stripe to avoid crashing if env var missing
let stripe = null;
function getStripe() {
  if (!stripe && STRIPE_SECRET_KEY) {
    try { stripe = require("stripe")(STRIPE_SECRET_KEY); } catch {}
  }
  return stripe;
}

// ── Pricing Config (BizClaw SaaS Plans) ──────────────────────────────────
const PLANS = {
  standard: {
    id: "price_standard_monthly",
    name: "BizClaw Standard",
    description: "For growing MSMEs — WhatsApp AI, GST tracker, daily briefs",
    amount: 15000,      // ₹15,000/month
    setupFee: 50000,   // ₹50,000 one-time setup
    currency: "inr",
    interval: "month",
    features: [
      "WhatsApp AI assistant",
      "GST filing reminders",
      "Daily morning brief",
      "Follow-up manager",
      "5 GB data storage",
      "Email support"
    ]
  },
  enterprise: {
    id: "price_enterprise_monthly",
    name: "BizClaw Enterprise",
    description: "For larger teams — Tally bridge, Notion, priority support",
    amount: 25000,      // ₹25,000/month
    setupFee: 75000,   // ₹75,000 one-time setup
    currency: "inr",
    interval: "month",
    features: [
      "Everything in Standard",
      "Tally ERP integration",
      "Notion workspace sync",
      "Custom WhatsApp flows",
      "Priority support (4hr SLA)",
      "20 GB data storage",
      "Multi-user access (10 seats)"
    ]
  },
  trial: {
    id: "price_trial_monthly",
    name: "BizClaw Trial",
    description: "14-day trial — full features, no credit card",
    amount: 0,
    setupFee: 0,
    currency: "inr",
    interval: "month",
    features: [
      "Full Standard features",
      "14-day access",
      "Setup assistance",
      "No credit card required"
    ]
  }
};

// ── Customer Management ────────────────────────────────────────────────────
async function createCustomer(clientId, email, name, phone) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const customer = await s.customers.create({
    email,
    name,
    metadata: { bizclaw_client_id: clientId }
  });
  return customer;
}

async function getCustomerByClientId(clientId) {
  const s = getStripe();
  if (!s) return null;

  const customers = await s.customers.list({
    limit: 1,
    metadata: { bizclaw_client_id: clientId }
  });
  return customers.data[0] || null;
}

async function getOrCreateCustomer(clientId, email, name, phone) {
  const existing = await getCustomerByClientId(clientId);
  if (existing) return existing;
  return createCustomer(clientId, email, name, phone);
}

// ── Checkout Sessions ──────────────────────────────────────────────────────
async function createSetupCheckout(clientId, planId, successUrl, cancelUrl) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const customer = await getCustomerByClientId(clientId);

  const sessionParams = {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { bizclaw_client_id: clientId, plan: planId }
  };

  if (customer) {
    sessionParams.customer = customer.id;
  }

  if (plan.setupFee > 0) {
    sessionParams.line_items.push({
      price_data: {
        currency: plan.currency,
        product_data: { name: `${plan.name} — Setup Fee`, description: "One-time onboarding & configuration" },
        unit_amount: plan.setupFee * 100  // Stripe uses paisa
      },
      quantity: 1
    });
  }

  // Add first month fee
  if (plan.amount > 0) {
    sessionParams.line_items.push({
      price_data: {
        currency: plan.currency,
        product_data: { name: `${plan.name} — Monthly`, description: plan.description },
        unit_amount: plan.amount * 100,
        recurring: { interval: plan.interval }
      },
      quantity: 1
    });
  }

  return s.checkout.sessions.create(sessionParams);
}

async function createSubscriptionCheckout(clientId, planId, successUrl, cancelUrl) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);

  const customer = await getCustomerByClientId(clientId);
  if (!customer) throw new Error("No Stripe customer found for client");

  return s.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: plan.currency,
        product_data: { name: plan.name, description: plan.description },
        unit_amount: plan.amount * 100,
        recurring: { interval: plan.interval }
      },
      quantity: 1
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { bizclaw_client_id: clientId, plan: planId }
  });
}

// ── Webhook Handler ───────────────────────────────────────────────────────
async function handleWebhook(rawBody, signature) {
  const s = getStripe();
  if (!s) throw new Error("Stripe not configured");

  const event = s.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const clientId = session.metadata?.bizclaw_client_id;
      const planId = session.metadata?.plan;
      console.log(`[stripe] Checkout completed for ${clientId}, plan: ${planId}`);
      return { clientId, planId, sessionId: session.id, status: "paid" };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const clientId = sub.metadata?.bizclaw_client_id || sub.customer;
      console.log(`[stripe] Subscription ${event.type} for ${clientId}: ${sub.status}`);
      return { clientId, status: sub.status, subscriptionId: sub.id };
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const clientId = sub.metadata?.bizclaw_client_id;
      console.log(`[stripe] Subscription cancelled for ${clientId}`);
      return { clientId, status: "cancelled" };
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.log(`[stripe] Payment failed for customer ${invoice.customer}`);
      return { customerId: invoice.customer, status: "payment_failed" };
    }
    default:
      return { type: event.type };
  }
}

module.exports = {
  PLANS,
  getStripe,
  createCustomer,
  getCustomerByClientId,
  getOrCreateCustomer,
  createSetupCheckout,
  createSubscriptionCheckout,
  handleWebhook
};
