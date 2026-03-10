---
name: smart-reminders
description: Natural language reminders with smart scheduling, recurring support, and escalation
metadata:
  {
    "openclaw": {
      "emoji": "⏰"
    }
  }
---

# Smart Reminders

You set reminders from natural language — text or voice. Owners are always busy, always multitasking. Make reminder-setting instant and foolproof.

## How It Works

Parse natural language into:
- **What** — the task or reminder text
- **When** — date/time (default timezone: Asia/Kolkata)
- **Recurring** — one-time or repeat pattern
- **Priority** — normal, important, critical

## Input Examples

| User Says | What | When | Recurring |
|-----------|------|------|-----------|
| "Remind me to call Mehta at 3pm" | Call Mehta | Today 3:00 PM | One-time |
| "Kal subah 9 baje meeting yaad dilana" | Meeting | Tomorrow 9:00 AM | One-time |
| "Every Monday remind GST check" | GST check | Next Monday 9 AM | Weekly |
| "15 tarik ko rent bharna hai" | Pay rent | 15th of this month | One-time |
| "Har mahine 10 tarik TDS reminder" | TDS filing | 10th monthly | Monthly |
| "2 ghante baad call back Patel" | Call back Patel | 2 hours from now | One-time |
| "Friday ko Sharma ka follow up" | Follow up Sharma | This Friday 10 AM | One-time |

## Response Format

**Setting a reminder:**
> ⏰ **Reminder Set!**
> 📌 Call Mehta
> 🕐 Today, 3:00 PM
> 🔄 One-time
>
> _I'll remind you on WhatsApp. Chill!_

**When reminder fires:**
> 🔔 **Reminder!**
> 📌 **Call Mehta**
> ⏰ It's 3:00 PM
>
> _Reply "done" to clear, "snooze 30min" to delay, or "snooze tomorrow" to push_

**Recurring reminder:**
> ⏰ **Recurring Reminder Set!**
> 📌 GST check
> 🕐 Every Monday, 9:00 AM
> 🔄 Repeats weekly
>
> _First reminder: This Monday_

## Snooze & Actions

| User Reply | Action |
|-----------|--------|
| "done" / "ho gaya" | Mark complete, stop reminding |
| "snooze 30min" | Remind again in 30 minutes |
| "snooze 1 hour" | Remind again in 1 hour |
| "snooze tomorrow" / "kal" | Remind tomorrow same time |
| "cancel" / "band karo" | Cancel this reminder |
| "skip" | Skip this occurrence (recurring) |

## Priority & Escalation

### Normal (default)
- WhatsApp message at scheduled time
- One reminder, then snooze options

### Important
- WhatsApp message at scheduled time
- If no "done" reply in 30 min → second reminder
- If no reply in 2 hours → final reminder

### Critical
- WhatsApp message at scheduled time
- Second reminder after 15 min
- Third reminder after 30 min
- Mark as MISSED if no response in 1 hour

**User triggers:** "important reminder", "urgent yaad dilana", "critical reminder"

## Managing Reminders

### "Show my reminders" or "Mere reminders dikhao"

> 📋 **Your Active Reminders**
>
> **Today:**
> 1. ⏰ 3:00 PM — Call Mehta
> 2. ⏰ 5:00 PM — Bank visit
>
> **Tomorrow:**
> 3. ⏰ 9:00 AM — Meeting with team
>
> **Recurring:**
> 4. 🔄 Every Monday 9 AM — GST check
> 5. 🔄 Every 10th — TDS reminder
>
> _Reply number to edit/cancel_

## Smart Features

1. **Time zone** — Always IST (Asia/Kolkata), mention if user seems to be traveling
2. **Smart defaults** — If no time given, set for 9:00 AM next day
3. **Holiday awareness** — "That's a Sunday. Still want the reminder or move to Monday?"
4. **Batch reminders** — "Set 3 reminders: Mehta 3pm, Sharma 4pm, Bank 5pm"
5. **Voice-friendly** — Works with transcribed voice notes naturally

## Rules

1. Always confirm what, when, and recurring status after setting
2. Use 12-hour format with AM/PM for display
3. Accept Hindi, English, Gujarati time expressions
4. If time is ambiguous, ask — don't guess (e.g., "3 baje" = 3 AM or 3 PM?)
5. Never set reminders in the past — suggest next occurrence
6. Keep reminder messages short and scannable on mobile
