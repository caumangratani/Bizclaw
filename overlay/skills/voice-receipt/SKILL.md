---
name: voice-receipt
description: Voice notes become actions, receipt photos become expenses — hands-free business input
metadata:
  {
    "openclaw": {
      "emoji": "🎤"
    }
  }
---

# Voice & Receipt Intelligence

Business owners are always on the go — in the car, at the warehouse, in meetings. They can't type. Let them voice-note or photo their way through business tasks. You convert media into structured actions.

## Voice Note Processing

### How It Works
1. User sends voice note on WhatsApp
2. Transcribe the audio (any language — Hindi, English, Gujarati, Hinglish)
3. Detect intent from transcription
4. Execute the appropriate action
5. Confirm back in text

### Voice → Action Mapping

| Voice Content | Detected Intent | Action |
|--------------|-----------------|--------|
| "Sharma ko 50 hazaar ka bill" | Party Ledger | Create invoice: Sharma Rs.50,000 |
| "Kal 3 baje Patel se milna hai" | Reminder | Set reminder: Meet Patel tomorrow 3 PM |
| "Aaj petrol mein 2000 kharch hua" | Expense | Log expense: Travel Rs.2,000 |
| "Note karo: steel rate 52000 hai" | Notes | Save note: Steel rate Rs.52,000 |
| "Mehta ka follow up karo har 3 din" | Follow-up | Set follow-up: Mehta every 3 days |
| "Mera cash flow dikhao" | Ledger view | Show cash flow pulse |

### Response to Voice Notes

> 🎤 **Voice Note Processed**
> 🗣️ _"Sharma ko pachas hazaar ka bill banao"_
>
> ✅ **Invoice Created**
> 📒 Sharma — Rs.50,000
> Date: Today
>
> _Sab samajh gaya! Anything else?_

### Multi-Action Voice Notes

Sometimes one voice note has multiple instructions:

**Voice:** "Aaj teen kaam karne hai — Sharma ka 50 hazaar ka bill, kal 10 baje bank jaana hai, aur Patel se follow up karo"

> 🎤 **Voice Note — 3 Actions Detected**
>
> 1. ✅ Invoice: Sharma Rs.50,000 — Logged
> 2. ⏰ Reminder: Bank visit tomorrow 10 AM — Set
> 3. 🔄 Follow-up: Patel — Created (frequency?)
>
> _For #3, kitne din mein follow up karun? (e.g., "3 din", "weekly")_

## Receipt/Photo Processing

### Receipt → Expense

When user sends a photo of a receipt or bill:

1. Read the image (OCR)
2. Extract: vendor name, amount, date, items, GST details
3. Auto-categorize the expense
4. Log it in expense tracker
5. Flag GST input credit if applicable

**Response:**
> 📸 **Receipt Processed**
>
> 🏪 Vendor: Sunrise Stationery
> 💰 Amount: Rs.2,450
> 🧾 GST: Rs.370 (18% — eligible for ITC)
> 📅 Date: 8 Mar 2026
> 🏷️ Category: Office Supplies
>
> ✅ Logged in expenses!
> 💡 _GST input credit of Rs.370 noted for your next GSTR-3B_

### Bill/Invoice Photo

When user sends a photo of a vendor bill:
> 📸 **Bill Processed**
>
> 🏪 From: Mehta Suppliers
> 💰 Amount: Rs.1,25,000
> 🧾 GST: Rs.19,068 (18%)
> 📅 Bill Date: 5 Mar 2026
> 📦 Items: Raw materials (HSN: 7209)
>
> **Actions:**
> • Reply "ledger" → Add to payables (Mehta Suppliers)
> • Reply "expense" → Log as expense only
> • Reply "both" → Both ledger + expense

### Visiting Card Photo

When user sends a photo of a business card:
> 📸 **Contact Saved**
>
> 👤 Rajesh Mehta
> 🏢 Mehta Trading Co.
> 📱 +91 98765 43210
> 📧 rajesh@mehtatrading.com
> 📍 Ring Road, Surat
>
> _Saved to your contacts! Need to set a follow-up?_

## PDF Processing

When user forwards a PDF document:

1. Read and summarize the document
2. Extract key information (amounts, dates, parties, terms)
3. Suggest relevant actions

**Response:**
> 📄 **PDF Summary**
> 📋 Type: Purchase Order
> 🏢 From: ABC Corp
> 💰 Value: Rs.3,50,000
> 📅 Delivery by: 15 Mar 2026
> 📦 Items: 500 units of Product X @ Rs.700
>
> Key terms: 30-day payment, 2% early payment discount
>
> _Reply "ledger" to track this in receivables_

## Rules

1. Always show the transcription/extraction so user can verify accuracy
2. If unsure about a number, ASK — don't guess ("Did you say 50,000 or 15,000?")
3. Handle mixed language naturally (Hinglish is the norm)
4. For receipts, always check for GST and flag ITC eligibility
5. Process one voice note at a time — confirm before moving on
6. If audio quality is poor, ask user to re-send or type it out
7. Keep confirmations short — the user is probably still busy
