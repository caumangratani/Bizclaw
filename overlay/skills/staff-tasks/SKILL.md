---
name: staff-tasks
description: Assign tasks to team members, track progress, and manage accountability via WhatsApp
metadata:
  {
    "openclaw": {
      "emoji": "👥"
    }
  }
---

# Staff Tasks & Team Management

MSME owners manage 5-50 people — often with no formal project management tool. They assign tasks on WhatsApp, then forget. BizClaw tracks everything so nothing gets lost.

## Assigning Tasks

### Input Examples

| Owner Says | Assignee | Task | Deadline |
|-----------|----------|------|----------|
| "Raj ko Surat delivery ka kaam de do by Friday" | Raj | Surat delivery | This Friday |
| "Tell Priya to prepare GST report" | Priya | Prepare GST report | No deadline |
| "Assign stock count to Gautam, due tomorrow" | Gautam | Stock count | Tomorrow |
| "Team ko bolo meeting kal 10 baje" | All team | Meeting | Tomorrow 10 AM |

### Response Format

> ✅ **Task Assigned**
> 👤 **To:** Raj
> 📌 **Task:** Surat delivery coordination
> 📅 **Due:** Friday, 14 Mar 2026
> 🔴 **Priority:** Normal
>
> _I'll remind Raj and track completion._

## Task Status Updates

### Owner checks: "Raj ka kaam ho gaya?"

> 📋 **Raj's Tasks**
>
> 1. 🟡 Surat delivery — Due Friday (2 days left)
>    _No update yet_
> 2. ✅ Bank deposit — Completed yesterday
> 3. 🔴 Client visit report — Overdue by 1 day!
>
> _Reply number for details or "remind Raj"_

### Staff updates via WhatsApp

If team members message BizClaw directly:
- "Surat delivery done" → Marks task complete, notifies owner
- "Delivery will be late, stuck in traffic" → Logs update, notifies owner
- "Need more time for stock count" → Flags to owner for decision

## Task Dashboard

### "Show all tasks" or "Team ka kaam dikhao"

> 👥 **Team Task Board**
>
> **Overdue** 🔴
> • Raj — Client visit report (1 day late)
> • Priya — GST reconciliation (2 days late)
>
> **Due Today** 🟡
> • Gautam — Stock count
> • Darsh — Invoice filing
>
> **On Track** 🟢
> • Raj — Surat delivery (due Friday)
> • Priya — Vendor payments (due Monday)
>
> **Completed This Week** ✅
> • 6 tasks completed (out of 10)
>
> _Reply name for individual view_

### Weekly Team Summary (Auto — Monday morning)

> 👥 **Team Weekly Report**
>
> **Completion Rate:** 75% (9/12 tasks)
>
> **Top Performer:** Priya (4/4 tasks on time) ⭐
> **Needs Attention:** Raj (2/4, 2 overdue)
>
> | Member | Assigned | Done | On Time | Overdue |
> |--------|----------|------|---------|---------|
> | Raj | 4 | 2 | 1 | 2 |
> | Priya | 4 | 4 | 4 | 0 |
> | Gautam | 3 | 2 | 2 | 1 |
> | Darsh | 1 | 1 | 1 | 0 |
>
> _"Team jitni strong, business utna strong!"_

## Team Member Management

### Adding team members
"Add Raj — phone 9876543210"
> ✅ **Team Member Added**
> 👤 Raj — +91 9876543210
> _Raj can now receive task notifications on WhatsApp_

### Viewing the team
"Show my team"
> 👥 **Your Team (4 members)**
>
> 1. Raj — +91 98765 43210 (Active tasks: 3)
> 2. Priya — +91 98765 43211 (Active tasks: 2)
> 3. Gautam — +91 98765 43212 (Active tasks: 1)
> 4. Darsh — +91 98765 43213 (Active tasks: 1)

## Task Reminders to Staff

BizClaw sends automated reminders to staff:

**Day before deadline:**
> 📋 Hi Raj! Reminder from [Business Name]:
>
> Task: Surat delivery coordination
> Due: Tomorrow (Friday)
>
> Please update status when done. Reply "done" or share progress.
>
> — BizClaw for [Owner Name]

**On overdue:**
> ⚠️ Hi Raj, your task is overdue:
>
> Task: Client visit report
> Was due: Yesterday
>
> Please complete ASAP or share a reason for delay.
> [Owner Name] has been notified.

## Rules

1. Owner is the boss — only they can assign, cancel, or modify tasks
2. Staff can only update status of their own tasks
3. Never share one staff member's performance with other staff (only with owner)
4. Respect work hours — no task reminders before 9 AM or after 7 PM
5. Keep task descriptions short and clear — staff reads on phone
6. Auto-escalate overdue tasks to owner after 24 hours
7. Maintain a simple completion rate per team member for weekly reports
8. Hindi/English/Gujarati — match the language each team member uses
9. Always get owner approval before sending first message to a new team member
