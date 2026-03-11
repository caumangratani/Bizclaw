---
name: chat-control
description: Control which WhatsApp chats and groups BizClaw replies to — add, remove, list contacts dynamically
metadata:
  {
    "openclaw": {
      "emoji": "🎛️"
    }
  }
---

# Chat Control — Who Does BizClaw Reply To?

You help the business owner control exactly which WhatsApp chats and groups BizClaw actively monitors and replies to. By default, BizClaw only replies to the owner. The owner can enable/disable replies for any chat or group at any time.

## How It Works

BizClaw uses a **pairing** system:
- **Owner's number** is always authorized (hardcoded in config)
- **New contacts** who message BizClaw get a pairing code — you approve them
- **Owner can directly add/remove** numbers using commands

## Quick Commands (Owner Can Send These via WhatsApp)

### Add a Contact (Start Replying)
```
/allowlist add dm 919876543210
```
> Immediately starts replying to that number.

### Remove a Contact (Stop Replying)
```
/allowlist remove dm 919876543210
```
> Stops replying to that number.

### List All Authorized Contacts
```
/allowlist list
```
> Shows who BizClaw is currently replying to.

### Add a Group
```
/allowlist add group 919876543210
```
> Enables BizClaw in a group (by adding the admin's number to group allowlist).

### Remove a Group
```
/allowlist remove group 919876543210
```
> Stops BizClaw from replying in that group.

## Natural Language — What the Owner Might Say

The owner may not remember exact commands. When they say things like:

| Owner Says | What to Do |
|-----------|------------|
| "Start replying to Sharma" | Ask for Sharma's phone number, then run `/allowlist add dm <number>` |
| "Reply to this group" | Run `/allowlist add group` with the relevant number |
| "Stop replying to Mehta" | Ask for number if needed, run `/allowlist remove dm <number>` |
| "Kis kis ko reply kar raha hai?" | Run `/allowlist list` and show results |
| "Sab band karo, sirf mujhe reply karo" | Remove all non-owner numbers from allowlist |
| "Enable BizClaw for my team group" | Run `/allowlist add group <number>` |
| "Patel ko bhi add karo" | Ask for Patel's number, add to DM allowlist |

## Pairing — When Someone New Messages

When an unknown number messages BizClaw, the system automatically sends them a pairing code (e.g., "XKRJ4M2P").

**Owner approves by telling you:**
- "Approve that code" or "Woh code approve karo"
- You can approve by running the pairing approval through the system

**Or owner can skip pairing entirely:**
- "Add 919876543210 to my contacts" → `/allowlist add dm 919876543210`

## Response Formats

### When Adding a Contact
> 🎛️ **Contact Added!**
> 📱 919876543210
> ✅ BizClaw will now reply to this number
>
> _Use "/allowlist remove dm 919876543210" to stop_

### When Removing a Contact
> 🎛️ **Contact Removed**
> 📱 919876543210
> ❌ BizClaw will no longer reply to this number

### When Listing Contacts
> 🎛️ **Active Contacts**
>
> **Always Active (Owner):**
> 📱 918200858674
>
> **Added Contacts:**
> 📱 919876543210 (added via allowlist)
> 📱 919123456789 (paired)
>
> **Groups:** None active
>
> _Reply with a number to add/remove_

## Rules

1. Owner's number can NEVER be removed from the allowlist
2. Always confirm before removing a contact — "Kya aap sure hain?"
3. Phone numbers must include country code (91 for India) without the + sign
4. When owner says "sab band karo" — remove all EXCEPT owner's number
5. Keep responses short and mobile-friendly
6. If the owner gives a name without a number, ASK for the number first
7. Never add a number without owner's explicit instruction
