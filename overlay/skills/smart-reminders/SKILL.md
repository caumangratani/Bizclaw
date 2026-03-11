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

## CRITICAL: Use the Cron Tool — Never Send Immediately

**When a user asks to schedule or remind, you MUST use the `cron` tool to create a real persistent job. NEVER use `send_message`, `sessions_send`, or any direct messaging tool in the setup turn for a future-time reminder.**

### Scheduling Guardrails

1. Create exactly one `cron.add` job for each requested reminder.
2. After the job is created, reply only with a confirmation that it is **scheduled**.
3. Never say "sent" or "delivered" during setup unless the user explicitly asked for an immediate message.
4. For isolated cron jobs, prefer `wakeMode: "next-heartbeat"` so the owner's main chat does not get an immediate noisy summary.
5. Inside the cron payload, ask the future run to output only the final reminder text. Do not ask it to "set", "confirm", or "explain" the reminder again.

### How to Schedule with the Cron Tool

**One-time reminder:**
```
cron tool → action: "add"
  name: "reminder-call-mehta"
  schedule: { kind: "at", at: "2026-03-10T15:00:00+05:30" }
  sessionTarget: "isolated"
  wakeMode: "next-heartbeat"
  deleteAfterRun: true
  payload: { kind: "agentTurn", lightContext: true, message: "Output only this WhatsApp reminder text: 🔔 Reminder! Call Mehta — it's 3:00 PM" }
  delivery: { mode: "announce", channel: "whatsapp" }
```

**Recurring reminder:**
```
cron tool → action: "add"
  name: "weekly-gst-check"
  schedule: { kind: "cron", expr: "0 9 * * 1", tz: "Asia/Kolkata" }
  sessionTarget: "isolated"
  wakeMode: "next-heartbeat"
  payload: { kind: "agentTurn", lightContext: true, message: "Output only this WhatsApp reminder text: 🔔 Weekly Reminder! GST check karo" }
  delivery: { mode: "announce", channel: "whatsapp" }
```

**Snooze (reschedule):**
```
cron tool → action: "add"
  name: "snooze-call-mehta"
  schedule: { kind: "at", at: "<30 min from now in ISO 8601>" }
  deleteAfterRun: true
  ...same payload...
```

**Send to a SPECIFIC phone number (not the owner):**
```
cron tool → action: "add"
  name: "collection-sharma-traders"
  schedule: { kind: "at", at: "2026-03-13T10:00:00+05:30" }
  sessionTarget: "isolated"
  wakeMode: "next-heartbeat"
  deleteAfterRun: true
  payload: { kind: "agentTurn", lightContext: true, message: "Output only the final WhatsApp message to this party. Do not add setup notes, confirmations, or internal commentary." }
  delivery: { mode: "announce", channel: "whatsapp", to: "919876543210" }
```

The `delivery.to` field is the phone number (with country code, no +). This sends the message TO that number, not to the owner.

**Batch collection reminders (multiple parties):**
When the owner gives a list of parties, create ONE cron job per party:
```
Party: Sharma Traders, +919876543210, Rs.50,000 outstanding
Party: Patel Textiles, +919123456789, Rs.1,25,000 outstanding

→ Create 2 separate cron jobs:
  Job 1: delivery.to = "919876543210", schedule 3 days from now
  Job 2: delivery.to = "919123456789", schedule 3 days from now
```

Each job's payload.message should instruct the agent to compose a polite, professional collection message including the party name and amount.

### Time Conversion Rules
- Always convert user's time to ISO 8601 with `+05:30` offset (IST)
- "3 baje" = ask AM or PM, then convert
- "2 ghante baad" = current time + 2 hours, format as ISO 8601
- "kal subah 9 baje" = tomorrow 09:00:00+05:30
- "har Monday" = cron expression `0 9 * * 1` with tz `Asia/Kolkata`

### Managing Existing Reminders
- **List:** `cron tool → action: "list"`
- **Cancel:** `cron tool → action: "remove", id: "<job-id>"`
- **Snooze:** Remove old job, add new one with updated time

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
2. Never use messaging tools in the same turn while setting a future reminder
3. Use 12-hour format with AM/PM for display
4. Accept Hindi, English, Gujarati time expressions
5. If time is ambiguous, ask — don't guess (e.g., "3 baje" = 3 AM or 3 PM?)
6. Never set reminders in the past — suggest next occurrence
7. Keep reminder messages short and scannable on mobile
