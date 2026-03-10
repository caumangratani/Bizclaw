---
name: onboarding-wizard
description: First-time setup flow — learn about the business, configure features, and teach the owner how to use BizClaw
metadata:
  {
    "openclaw": {
      "emoji": "🚀"
    }
  }
---

# Onboarding Wizard

First impressions matter. When a new client says "Hi" for the first time, make them feel welcome, learn about their business, and set up BizClaw perfectly for them — all in a 5-minute WhatsApp conversation.

## Trigger

When a new user messages BizClaw for the first time (no existing profile), start the onboarding flow.

## Flow — 5 Steps

### Step 1: Welcome (30 seconds)

> 🙏 **Namaste! Main BizClaw hun — aapka AI business partner!**
>
> Aap abhi se apna poora business WhatsApp se manage kar sakte hain — reminders, expenses, payments, team tasks, sab kuch.
>
> Setup sirf 5 minute mein ho jayega. Shuru karein? 🚀
>
> _Reply "haan" or "yes" to start!_

### Step 2: Business Profile (1 minute)

> 📋 **Step 1/5 — Aapke baare mein bataiye**
>
> 1. Aapka naam?
> 2. Business ka naam?
> 3. Business type? (Trading / Manufacturing / Services / Retail / CA Practice / Other)
> 4. City?

**After response:**
> ✅ **Saved!**
> 👤 [Name] — [Business Name]
> 🏢 [Type] | 📍 [City]
>
> _Aage badhein!_

### Step 3: Business Size (30 seconds)

> 📊 **Step 2/5 — Business size**
>
> 1. Team size? (Just me / 2-10 / 11-50 / 50+)
> 2. Monthly turnover range? (Under 10L / 10-50L / 50L-1Cr / 1Cr+)
>
> _Ye information se main aapke liye sahi features enable karunga._

### Step 4: Feature Selection (1 minute)

Based on business type and size, recommend features:

> ⚡ **Step 3/5 — Features setup**
>
> Aapke business ke liye main ye features recommend karta hun:
>
> ✅ Smart Reminders — Never forget anything
> ✅ Expense Tracker — Track every rupee
> ✅ Party Ledger — Who owes you, who you owe
> ✅ GST & Compliance — Never miss a deadline
> ✅ Follow-Up Engine — Chase leads automatically
> ✅ Daily Business Report — Morning update on WhatsApp
>
> Sab enable karein? Ya koi specific chahiye?
> _Reply "sab" for all, or feature names to select specific ones_

**For CA Practice, additionally recommend:**
- Compliance Calendar (multiple clients)
- Collection Tracker (client fee follow-up)

**For Trading/Manufacturing, additionally recommend:**
- Inventory Alerts
- Customer CRM

### Step 5: Quick Test (1 minute)

> 🎯 **Step 4/5 — Quick test! Try these:**
>
> Say any of these:
> 1. "Remind me to call bank at 3pm" → Sets a reminder
> 2. "Spent 500 on chai" → Logs expense
> 3. "Invoice Sharma 25000" → Creates ledger entry
> 4. "Show my cash flow" → Shows financial pulse
>
> _Try one now! Type or voice note — both work!_ 🎤

**After they try:**
> 🎉 **Dekha? Kitna easy hai!**
>
> Aap ab WhatsApp pe type ya voice note karke:
> • Reminders set kar sakte hain ⏰
> • Expenses track kar sakte hain 💰
> • Payments track kar sakte hain 📒
> • Team ko tasks de sakte hain 👥
> • Aur bahut kuch...
>
> _Ab aap ready hain! Kuch bhi poochiye — main hamesha available hun._

### Step 5: Compliance Setup (30 seconds)

> 📅 **Step 5/5 — Compliance setup (optional)**
>
> Kya aap GST registered hain?
> • "Haan" → I'll track all GST deadlines
> • "Nahi" → I'll skip GST reminders
>
> TDS deduct karte hain?
> • "Haan" → Monthly TDS reminders
> • "Nahi" → Skip TDS
>
> Company type?
> • Proprietorship / Partnership / LLP / Pvt Ltd

## Post-Onboarding

### Day 1 — Evening check-in
> 👋 **Sab theek chal raha hai?**
>
> Aaj kuch try kiya? Agar koi sawaal hai to bas pooch lo!
>
> 💡 Tip: Voice note bhejo — main usse bhi samajh leta hun! 🎤

### Day 3 — Feature reminder
> 📱 **3 cheezein jo aapne abhi tak try nahi ki:**
>
> 1. 📝 "Note karo: [kuch bhi]" — Save notes instantly
> 2. 🔄 "Follow up Sharma every 3 days" — Auto follow-up
> 3. 📸 Receipt ki photo bhejo — Auto expense log
>
> _Try karke dekho!_

### Day 7 — First weekly report
> 📊 **Aapka pehla weekly report!**
>
> [Show whatever data was collected in first week]
>
> _Har Monday ye report aayega. Business ki sehat ek nazar mein!_

## Language Adaptation

- Detect user's language from first few messages
- Match that language throughout onboarding
- If mixed (Hinglish), use Hinglish
- Available: English, Hindi, Gujarati, Hinglish

## Rules

1. Keep each step SHORT — max 5 lines. This is WhatsApp, not a form
2. One question at a time — don't overwhelm
3. Accept free-text answers — don't force structured responses
4. If user skips a step, move on — collect info later naturally
5. Make it feel like a conversation, not a survey
6. End with a win — let them experience a working feature immediately
7. Default to enabling all features — less friction is better
8. Remember everything from onboarding in the user's profile
9. Total onboarding should take under 5 minutes — if longer, you're doing it wrong
