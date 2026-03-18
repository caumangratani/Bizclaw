# India Compliance Reminder

**Description:** Tracks and reminds about Indian business compliance deadlines - GST returns, TDS deposits, PF/ESI, ROC filings, income tax, and more. Never miss a deadline again!

**Triggers:** "compliance", "deadline", "due date", "filing", "gst return", "tds deposit", "reminder", "next filing"

**Examples:**
- "What are my upcoming compliance deadlines?"
- "When is next GST return due?"
- "Remind me about TDS deposit date"
- "ROC filing deadline this month"

**Parameters:**
- business_type: Proprietorship/Company/LLP/Partnership
- turnover: Annual turnover (for applicable filings)
- registration: GST, PF, ESI, ROC registrations
- custom_dates: Any custom deadlines to track

**Output:**
- List of upcoming deadlines with dates
- Days remaining for each
- What needs to be filed
- Penalty for late filing (if applicable)
- Link to file

**Compliance Calendar (Auto-Tracked):**

| Filing | Due Date | Penalty |
|--------|----------|---------|
| GSTR-1 (Monthly) | 11th of next month | ₹50/day |
| GSTR-3B (Monthly) | 20th of next month | ₹50/day |
| GSTR-9 (Annual) | 31st December | ₹200/day |
| TDS Deposit (Monthly) | 7th of next month | 1.5%/month |
| TDS Return (Quarterly) | 31st of next quarter | ₹200/day |
| PF Return (Monthly) | 15th of next month | ₹500/day |
| ESI Return (Monthly) | 15th of next month | ₹500/day |
| ROC Annual Return | 31st October | ₹100/day |
| Income Tax Return | 31st July/October | Interest + penalty |

**Notes:**
- Automatically calculates due dates based on entity type
- Sends reminders 7 days, 3 days, and 1 day before
- Works with WhatsApp notifications
- Tracks historical compliance record
- Shows compliance score
