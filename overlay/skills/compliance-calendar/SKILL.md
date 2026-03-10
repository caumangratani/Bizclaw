---
name: compliance-calendar
description: Complete Indian business compliance calendar — GST, TDS, ROC, IT returns, PF, ESI, and more
metadata:
  {
    "openclaw": {
      "emoji": "📅"
    }
  }
---

# Compliance Calendar

The complete Indian business compliance tracker. GST is just the beginning — MSMEs have 50+ deadlines per year across GST, Income Tax, TDS, ROC, PF, ESI, and more. Miss one, pay a penalty. BizClaw makes sure you never miss any.

## Monthly Deadlines

| Date | Compliance | Details |
|------|-----------|---------|
| 7th | TDS/TCS Payment | Previous month's TDS/TCS deposit via challan 281 |
| 10th | GSTR-7 (TDS) | GST TDS return |
| 10th | GSTR-8 (TCS) | GST TCS return (e-commerce) |
| 11th | GSTR-1 | Outward supply details (sales) |
| 13th | IFF (QRMP) | Invoice Furnishing Facility |
| 13th | GSTR-6 | Input Service Distributor return |
| 15th | PF Payment | Employee Provident Fund deposit |
| 15th | ESI Payment | Employee State Insurance deposit |
| 20th | GSTR-3B | Summary return + tax payment |
| 25th | PF Return | Monthly PF ECR filing |
| 30th | TDS Return (Quarterly) | 26Q/24Q/27Q for Mar/Jun/Sep/Dec quarters |

## Quarterly Deadlines

| Month | Date | Compliance |
|-------|------|-----------|
| Apr | 30th | TDS return (Q4: Jan-Mar) |
| Apr | 30th | GSTR-4 (Composition annual) |
| May | 15th | TDS certificate 16A (Q4) |
| Jun | 15th | Advance Tax — 1st installment (15%) |
| Jul | 18th | CMP-08 (Composition Q1 payment) |
| Jul | 31st | Income Tax Return (non-audit) |
| Sep | 15th | Advance Tax — 2nd installment (45%) |
| Oct | 18th | CMP-08 (Composition Q2 payment) |
| Oct | 31st | Income Tax Return (audit cases) |
| Dec | 15th | Advance Tax — 3rd installment (75%) |
| Dec | 31st | GSTR-9 (Annual return) |
| Dec | 31st | GSTR-9C (Reconciliation, >5Cr) |
| Jan | 18th | CMP-08 (Composition Q3 payment) |
| Mar | 15th | Advance Tax — 4th installment (100%) |

## Annual Deadlines

| Month | Date | Compliance |
|-------|------|-----------|
| May | 30th | PF Annual Return |
| Sep | 30th | ROC Annual Filing (Form AOC-4, MGT-7) |
| Oct | 31st | Tax Audit Report (if applicable) |
| Nov | 30th | ROC Annual Return (OPC/Small) |
| Mar | 31st | Financial Year closes |

## Reminder Schedule

For each deadline, remind at these intervals:
- **7 days before** — First heads-up (normal priority)
- **3 days before** — Preparation reminder (important)
- **1 day before** — Final reminder (critical)
- **On the day** — "Today is the last day!" (critical)
- **Day after (if missed)** — Penalty warning + what to do now

## Reminder Format

### 7 Days Before
> 📅 **Compliance Alert**
> 🧾 **GSTR-3B** due on 20th (7 days left)
>
> Checklist:
> • Match sales with GSTR-1
> • Verify ITC claims
> • Calculate net tax
>
> _Start preparation now. Don't rush on the last day!_

### 1 Day Before
> ⚠️ **URGENT: Compliance Due Tomorrow!**
> 🧾 **GSTR-3B** — Due 20th (TOMORROW)
>
> Late fee: Rs.50/day + 18% interest on tax due
> File tonight if possible!
>
> _"Kal ho na ho" wali situation mat banao. Aaj hi file karo!_ 😄

### Missed Deadline
> 🔴 **DEADLINE MISSED**
> 🧾 **GSTR-3B** was due yesterday (20th)
>
> **What to do NOW:**
> 1. File immediately — every day adds Rs.50 late fee
> 2. Pay interest: 18% p.a. on outstanding tax (calculated daily)
> 3. Nil return? Max late fee capped at Rs.500
>
> ⚠️ Consult your CA if you need help filing late.

## Penalty Reference

| Compliance | Late Fee | Interest | Max Penalty |
|-----------|----------|----------|-------------|
| GSTR-3B | Rs.50/day | 18% p.a. | Rs.5,000 (nil) |
| GSTR-1 | Rs.50/day | — | Rs.5,000 (nil) |
| TDS Return | Rs.200/day | 1-1.5%/month | Until filed |
| Income Tax | Rs.5,000 | 1%/month (234B/C) | Rs.1,000 (<5L income) |
| ROC Forms | Rs.100/day | — | 10x normal fee |
| PF/ESI | 12-25% damages | — | Criminal prosecution |

## Client-Specific Configuration

Ask the client during onboarding:
1. **GST filing type** — Monthly or QRMP (quarterly)?
2. **Composition scheme** — Yes/No?
3. **TDS applicable** — Do they deduct TDS?
4. **PF/ESI registered** — Do they have employees under PF/ESI?
5. **Company type** — Proprietorship, Partnership, LLP, Pvt Ltd?
6. **Tax audit applicable** — Turnover > Rs.1 Crore?

Based on answers, enable only relevant deadlines. Don't spam with irrelevant reminders.

## Rules

1. Always show days remaining, not just date
2. Use urgency colors: 🟢 (7+ days) 🟡 (3-7 days) 🔴 (0-2 days) ⚫ (missed)
3. Include penalty amounts to create urgency
4. Customize based on client's GST type and company structure
5. Add Hindi motivational nudge in reminders
6. Always disclaim: "Confirm with your CA for your specific case"
7. Track which deadlines were met vs missed — show compliance score monthly
