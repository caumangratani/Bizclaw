# UPI Payment Link Generator

**Description:** Generate UPI payment links for Indian customers. Creates shareable payment links that work with any UPI app (GPay, PhonePe, Paytm, WhatsApp Pay).

**Triggers:** "payment link", "upi link", "send payment", "pay link", "gpay link", "phonepe link", "request payment"

**Examples:**
- "Generate payment link for ₹5,000"
- "Create UPI link for invoice payment"
- "Send payment request to customer"

**Parameters:**
- amount: Payment amount in rupees
- description: What for (invoice number, purpose)
- payee_name: Your business name
- payee_upi: Your UPI ID
- validity: Link validity in hours (default: 24)

**Output:**
- UPI payment link (ready to share)
- QR code for the payment
- Deep link for specific UPI apps
- WhatsApp-shareable format

**Notes:**
- Supports all major UPI apps:
  - Google Pay
  - PhonePe
  - Paytm
  - WhatsApp Pay
  - BHIM
  - Any UPI-enabled app
- No transaction fees (your UPI charges apply)
- Perfect for:
  - Invoice payments
  - Advance payments
  - Partial payments
  - Deposit requests
- Works even if customer doesn't have your contact

**Generated Links Include:**
- `upi://pay` deep links
- Web-based payment page fallback
- QR code image
- WhatsApp-ready message format
