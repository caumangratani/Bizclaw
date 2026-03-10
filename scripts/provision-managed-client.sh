#!/usr/bin/env bash
set -euo pipefail

# Provision a new managed BizClaw client and register it in Bizgenix admin.
#
# Usage:
#   ./scripts/provision-managed-client.sh <client-id> "<Client Name>" "<Business Type>" "<+phone>" [plan] [setup-fee-inr] [monthly-fee-inr]
#
# Example:
#   ./scripts/provision-managed-client.sh sharma-traders "Sharma Traders" "Trading & Distribution" "+919876543210"

if [ -z "${1:-}" ] || [ -z "${2:-}" ] || [ -z "${3:-}" ] || [ -z "${4:-}" ]; then
  echo "Usage: ./scripts/provision-managed-client.sh <client-id> \"<Client Name>\" \"<Business Type>\" \"<+phone>\" [plan] [setup-fee-inr] [monthly-fee-inr]"
  echo ""
  echo "Example:"
  echo "  ./scripts/provision-managed-client.sh sharma-traders \"Sharma Traders\" \"Trading & Distribution\" \"+919876543210\""
  exit 1
fi

CLIENT_ID="$1"
CLIENT_NAME="$2"
CLIENT_BUSINESS="$3"
CLIENT_PHONE="$4"
PLAN="${5:-Managed Private SaaS}"
SETUP_FEE_INR="${6:-75000}"
MONTHLY_FEE_INR="${7:-25000}"
PAYMENT_STATUS="PENDING"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ADMIN_DATA_DIR="$ROOT_DIR/admin/data"

if date -v+30d +"%Y-%m-%d" >/dev/null 2>&1; then
  NEXT_DUE_AT="$(date -v+30d +"%Y-%m-%d")"
else
  NEXT_DUE_AT="$(date -d "+30 days" +"%Y-%m-%d")"
fi

mkdir -p "$ADMIN_DATA_DIR"

"$ROOT_DIR/scripts/new-client.sh" "$CLIENT_ID" "$CLIENT_NAME" "$CLIENT_BUSINESS" "$CLIENT_PHONE"

CLIENT_ID="$CLIENT_ID" \
CLIENT_NAME="$CLIENT_NAME" \
CLIENT_BUSINESS="$CLIENT_BUSINESS" \
CLIENT_PHONE="$CLIENT_PHONE" \
PLAN="$PLAN" \
SETUP_FEE_INR="$SETUP_FEE_INR" \
MONTHLY_FEE_INR="$MONTHLY_FEE_INR" \
PAYMENT_STATUS="$PAYMENT_STATUS" \
NEXT_DUE_AT="$NEXT_DUE_AT" \
ADMIN_DATA_DIR="$ADMIN_DATA_DIR" \
node <<'NODE'
const fs = require("fs");
const path = require("path");

const billingPath = path.join(process.env.ADMIN_DATA_DIR, "billing.json");
const notesPath = path.join(process.env.ADMIN_DATA_DIR, "client-notes.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const billing = readJson(billingPath);
const notes = readJson(notesPath);
const clientId = process.env.CLIENT_ID;
const now = new Date().toISOString();

billing[clientId] = {
  plan: process.env.PLAN,
  setupFeeInr: Number(process.env.SETUP_FEE_INR || 0),
  monthlyFeeInr: Number(process.env.MONTHLY_FEE_INR || 0),
  paymentStatus: process.env.PAYMENT_STATUS,
  nextDueAt: process.env.NEXT_DUE_AT,
  notes: `Provisioned by Bizgenix on ${now}.`
};

notes[clientId] = [
  `Client onboarded: ${process.env.CLIENT_NAME}`,
  `Business type: ${process.env.CLIENT_BUSINESS}`,
  `Primary phone: ${process.env.CLIENT_PHONE}`,
  `Commercial plan: ${process.env.PLAN}`,
  `Setup fee: Rs.${process.env.SETUP_FEE_INR}`,
  `Monthly fee: Rs.${process.env.MONTHLY_FEE_INR}`,
  "",
  "Next actions:",
  "- add API keys in the client .env",
  "- tune soul.md and AGENTS.md for the client use case",
  "- start the local stack or deploy the VPS/container instance",
  "- connect WhatsApp and run acceptance tests"
].join("\n");

writeJson(billingPath, billing);
writeJson(notesPath, notes);
NODE

echo ""
echo "================================================================"
echo "  Managed BizClaw client provisioned: $CLIENT_NAME"
echo "================================================================"
echo ""
echo "Admin record:"
echo "  Plan:         $PLAN"
echo "  Setup fee:    Rs.$SETUP_FEE_INR"
echo "  Monthly fee:  Rs.$MONTHLY_FEE_INR"
echo "  Next due:     $NEXT_DUE_AT"
echo ""
echo "Next steps:"
echo "  1. Add provider keys to: $ROOT_DIR/clients/$CLIENT_ID/.env"
echo "  2. Bootstrap auth: ./scripts/bootstrap-client-auth.sh $CLIENT_ID"
echo "  3. Tune client behavior in: $ROOT_DIR/clients/$CLIENT_ID/soul.md"
echo "  4. Local demo: ./scripts/start-local-stack.sh $CLIENT_ID"
echo "  5. Readiness check: ./scripts/client-readiness.sh $CLIENT_ID"
echo "  6. VPS/container deploy: ./docker/deploy-client.sh $CLIENT_ID"
echo "  7. Open admin detail: http://127.0.0.1:18800/client/$CLIENT_ID"
echo ""
"$ROOT_DIR/scripts/client-launch-url.sh" "$CLIENT_ID"
