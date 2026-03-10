---
name: customer-crm
description: Simple CRM on WhatsApp — lead pipeline, deal tracking, customer history, and dormant client alerts
metadata:
  {
    "openclaw": {
      "emoji": "🎯"
    }
  }
---

# Customer CRM — Deal Tracking on WhatsApp

A full CRM is overkill for most MSMEs. They need to track leads, know their best customers, and never forget a deal in progress. BizClaw is their CRM — no login required.

## Lead Pipeline

### Adding Leads

| Owner Says | Name | Source | Value | Stage |
|-----------|------|--------|-------|-------|
| "New lead: Patel from Surat, 2 lakh order possible" | Patel | Direct | Rs.2L | New |
| "Exhibition mein Sharma mila, interested in bulk" | Sharma | Exhibition | — | New |
| "Mehta referred by Gupta" | Mehta | Referral (Gupta) | — | New |

**Response:**
> 🎯 **Lead Added!**
> 👤 **Patel** — Surat
> 💰 Potential: Rs.2,00,000
> 📍 Source: Direct
> 📊 Stage: New Lead
>
> _Follow-up set? Reply "follow up 3 days" or I'll remind in a week._

### Pipeline Stages

| Stage | Emoji | Description |
|-------|-------|-------------|
| New Lead | 🆕 | Just identified, no contact yet |
| Contacted | 📞 | First conversation done |
| Proposal Sent | 📄 | Quote/proposal shared |
| Negotiation | 🤝 | Discussing terms and pricing |
| Closed Won | 🏆 | Deal done! Order confirmed |
| Closed Lost | ❌ | Lost to competitor/no budget/etc |
| On Hold | ⏸️ | Interested but not now |

### Moving Stages

"Patel contacted, sent quote 1.8 lakh"
> 📊 **Lead Updated**
> 👤 Patel — moved to **Proposal Sent** 📄
> 💰 Updated value: Rs.1,80,000
> 📅 Next: Follow up in 3 days

"Patel confirmed order!"
> 🏆 **DEAL WON!** 🎉
> 👤 Patel — Rs.1,80,000
> 📅 Days in pipeline: 12
>
> _Congratulations! Patel is now a customer. Badhai ho! 🎊_

## Pipeline View

### "Show my pipeline" or "Deals dikhao"

> 🎯 **Sales Pipeline**
>
> 🆕 **New Leads (3):**
> • Sharma — Exhibition lead (1 week ago)
> • Mehta — Referral from Gupta (3 days ago)
> • Singh — Website inquiry (today)
>
> 📄 **Proposal Sent (2):**
> • Patel — Rs.1.8L (sent 5 days ago)
> • Desai — Rs.3.2L (sent 2 days ago)
>
> 🤝 **Negotiation (1):**
> • ABC Corp — Rs.5L (discussing terms)
>
> **Pipeline Value: Rs.10L**
> **Win rate (last 3 months): 35%**

## Customer History

### "Tell me about Sharma" or "Sharma ke baare mein batao"

> 👤 **Sharma — Customer Profile**
>
> 🏢 Sharma Textiles, Surat
> 📱 +91 98765 43210
> 📅 Customer since: Jan 2025
>
> **Order History:**
> | Date | Order | Amount | Status |
> |------|-------|--------|--------|
> | Jan 2025 | First order | Rs.1.2L | Paid ✅ |
> | Apr 2025 | Repeat order | Rs.2.5L | Paid ✅ |
> | Aug 2025 | Bulk order | Rs.4.0L | Paid ✅ |
> | Feb 2026 | Current order | Rs.3.0L | Pending 🟡 |
>
> **Lifetime Value: Rs.10.7L**
> **Payment behavior:** Always pays within 20 days ✅
> **Last contact:** 2 weeks ago
>
> 💡 _Sharma is a top customer. Consider Diwali gift!_

## Dormant Client Alerts

### Auto-detect (via heartbeat)

When a customer hasn't ordered in 60+ days:

> 🔔 **Dormant Client Alert**
>
> These customers haven't ordered in 60+ days:
>
> 1. 😴 **Gupta Trading** — Last order 75 days ago (Rs.2L)
> 2. 😴 **Rajesh Pharma** — Last order 90 days ago (Rs.80K)
> 3. 😴 **Patel Exports** — Last order 65 days ago (Rs.3.5L)
>
> **At-risk revenue: Rs.6.3L**
>
> 💡 Suggestion: Send a "checking in" message or special offer
> _Reply number to draft a re-engagement message_

### Re-Engagement Message Draft

> 📨 **Re-engagement Message for Gupta Trading:**
>
> _"Gupta ji, namaskar! 🙏_
> _Bahut din ho gaye aapka order aaye hue. Sab theek hai na?_
> _Humne kuch naye products add kiye hain — aapko zaroor pasand aayenge._
> _Kab baat karein? Aapki convenience pe call karta hun._
>
> _— [Owner Name], [Business]"_
>
> Reply "send" to send or "edit" to modify.

## Monthly CRM Report (Auto)

> 📊 **Monthly Sales Report — [Month]**
>
> 🆕 New leads: 12
> 🏆 Deals won: 4 (Rs.8.5L)
> ❌ Deals lost: 2 (Rs.3L)
> 📊 Win rate: 33%
> ⏱️ Avg. close time: 14 days
>
> 🔝 **Top Customer:** Sharma (Rs.3L this month)
> 😴 **At Risk:** 3 dormant customers (Rs.6.3L)
>
> 💡 _"Pipeline bhari rakhni chahiye. Naye leads laate raho!"_

## Rules

1. Keep it simple — this isn't Salesforce, it's a WhatsApp CRM
2. Auto-create customer profiles on first mention
3. Track order history from ledger data (integrate with party-ledger)
4. Alert for dormant customers at 60 days (configurable)
5. Celebrate every deal won — positive reinforcement matters
6. Never expose one customer's data to another customer
7. Win rate and pipeline value help owners see the big picture
8. Support Hindi/English/Gujarati naturally in all interactions
9. Suggest re-engagement for dormant clients proactively
