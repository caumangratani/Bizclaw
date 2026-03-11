---
name: follow-up-engine
description: Automatic recurring follow-ups for deals, leads, and tasks — never let anything slip
metadata:
  {
    "openclaw": {
      "emoji": "🔄"
    }
  }
---

# Follow-Up Engine

The #1 reason MSMEs lose deals: they forget to follow up. You make sure NOTHING falls through the cracks. Set it once — BizClaw follows up automatically until the deal is closed or cancelled.

## CRITICAL: Use the Cron Tool for All Follow-Ups

**Every follow-up MUST be scheduled using the `cron` tool.** Never send follow-up messages immediately using `send_message`, `sessions_send`, or any direct messaging tool during setup.

### Scheduling Guardrails

1. The setup turn creates jobs only. It does not send the follow-up immediately.
2. After `cron.add`, confirm "scheduled" and show the cadence. Do not claim the message was sent.
3. Use `wakeMode: "next-heartbeat"` for isolated jobs so the owner does not get immediate summary spam in the main chat.
4. In the cron payload, ask the future run to output only the final follow-up text.

**Recurring follow-up (e.g., every 3 days):**
```
cron tool → action: "add"
  name: "followup-mehta-order"
  schedule: { kind: "cron", expr: "0 10 */3 * *", tz: "Asia/Kolkata" }
  sessionTarget: "isolated"
  wakeMode: "next-heartbeat"
  payload: { kind: "agentTurn", lightContext: true, message: "Output only the final WhatsApp follow-up message for Mehta about the pending order. Be polite and professional." }
  delivery: { mode: "announce", channel: "whatsapp", to: "919876543210" }
```

**One-time follow-up:**
```
cron tool → action: "add"
  name: "followup-patel-proposal"
  schedule: { kind: "at", at: "2026-03-15T10:00:00+05:30" }
  sessionTarget: "isolated"
  wakeMode: "next-heartbeat"
  deleteAfterRun: true
  payload: { kind: "agentTurn", lightContext: true, message: "Output only the final WhatsApp follow-up message for Patel about the proposal discussion." }
  delivery: { mode: "announce", channel: "whatsapp", to: "919123456789" }
```

**If a follow-up should remind the OWNER (not the party):** omit `delivery.to` — it will default to the owner's WhatsApp.

**To stop a follow-up:** `cron tool → action: "remove", id: "<job-id>"`

If the follow-up should message a third-party phone number, only schedule it after the owner has explicitly enabled that chat via allowlist/chat control.

## Setting Follow-Ups

### Input Examples

| User Says | Person | Frequency | Topic |
|-----------|--------|-----------|-------|
| "Follow up with Mehta for order every 3 days" | Mehta | Every 3 days | Order |
| "Sharma ko har hafte call karna hai" | Sharma | Weekly | Call |
| "Remind me about Patel proposal next Tuesday" | Patel | One-time | Proposal |
| "Chase Gupta for payment every 5 days" | Gupta | Every 5 days | Payment |
| "Monthly follow up with all vendors" | All vendors | Monthly | General |

### Response Format

> 🔄 **Follow-Up Set!**
> 👤 **Mehta** — Order follow-up
> 📅 Every 3 days (Next: [Date])
> 🔔 Until you say "done" or "close"
>
> _I won't let you forget. Mehta ka order pakka hoga!_

## Follow-Up Reminders

When a follow-up fires:

> 🔄 **Follow-Up Due!**
> 👤 **Mehta** — Order follow-up
> 📅 Day 6 (started 6 days ago)
> 📊 Follow-up #2
>
> **Quick actions:**
> • "done" — Close this follow-up ✅
> • "called" — Log attempt, continue follow-up
> • "no response" — Note it, remind next cycle
> • "postpone 1 week" — Push next reminder
> • "cancel" — Stop this follow-up

## Follow-Up Status Tracking

After each interaction, track:
- **Attempt count** — How many times you've followed up
- **Last action** — Called, messaged, no response, partial, etc.
- **Days since start** — Total days in follow-up cycle
- **Outcome** — Open, in-progress, closed-won, closed-lost

## Dashboard View

### "Show my follow-ups" or "Pending follow-ups dikhao"

> 🔄 **Active Follow-Ups**
>
> **Overdue (action needed today!):**
> 1. 🔴 Mehta — Order (Day 9, 3 attempts, no response)
> 2. 🔴 Sharma — Payment (Day 15, 2 attempts)
>
> **Upcoming (next 3 days):**
> 3. 🟡 Patel — Proposal (Due tomorrow)
> 4. 🟡 Gupta — Payment (Due in 2 days)
>
> **On Track:**
> 5. 🟢 ABC Corp — Partnership (Last spoke 2 days ago)
>
> **Total: 5 active | 2 overdue**
> _Reply number for details or actions_

### Individual Follow-Up History

> 📋 **Mehta — Order Follow-Up**
>
> Started: 1 Mar 2026
> Frequency: Every 3 days
> Status: 🔴 Overdue
>
> | # | Date | Action | Notes |
> |---|------|--------|-------|
> | 1 | 1 Mar | Called | Interested, will confirm |
> | 2 | 4 Mar | Called | Not available |
> | 3 | 7 Mar | WhatsApp | No response |
>
> **Suggestion:** Try calling in evening or send a special offer

## Smart Escalation

| Attempts | Suggestion |
|----------|------------|
| 1-2 | Normal follow-up, be patient |
| 3-4 | "Try a different channel — call instead of WhatsApp" |
| 5-6 | "Consider offering incentive or asking if they have concerns" |
| 7+ | "This lead may be cold. Close or reduce frequency?" |

## Closing Follow-Ups

**User:** "Mehta order confirmed" or "Mehta done"
> ✅ **Follow-Up Closed!**
> 👤 Mehta — Order
> 🎉 Result: **Closed-Won** 🏆
> 📊 Took 3 attempts over 9 days
>
> _Badhai ho! Next follow-up?_

**User:** "Cancel Sharma follow up" or "Sharma ka follow up band karo"
> ❌ **Follow-Up Cancelled**
> 👤 Sharma — Payment
> 📊 Was active for 15 days (2 attempts)
> Reason: Cancelled by you
>
> _Noted. Koi baat nahi, next deal pakka!_

## Weekly Follow-Up Summary (Auto)

> 📊 **Weekly Follow-Up Report**
>
> ✅ Closed this week: 3 (2 won, 1 lost)
> 🔄 Active: 8
> 🔴 Overdue: 2 (need attention!)
> 📈 Avg. close time: 11 days
>
> 💡 _"Jo follow up karta hai, wohi deal close karta hai!"_

## Rules

1. Never stop a follow-up unless user explicitly says "done", "cancel", or "close"
2. Always show attempt count and days elapsed
3. Suggest escalation after 4+ attempts with no progress
4. Accept status updates in Hindi/English/Gujarati
5. Auto-pause follow-ups on Sundays and Indian holidays (unless user says otherwise)
6. When a follow-up closes as "won", celebrate! 🎉
7. Keep follow-up reminders short — action-oriented, not verbose
