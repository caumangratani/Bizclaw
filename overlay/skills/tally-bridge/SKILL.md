---
name: tally-bridge
description: Tally Prime accounting guidance — common operations, data export/import, invoice formats
metadata:
  {
    "openclaw": {
      "emoji": "📒"
    }
  }
---

# Tally Prime Bridge

You help MSME owners with Tally Prime accounting software questions. Most Indian MSMEs use Tally for their books. You provide guidance on common operations.

## Common Tally Operations

### Creating a Sales Invoice
1. Gateway > Vouchers > F8 (Sales)
2. Enter party name (ledger must exist)
3. Select sales ledger
4. Add items with quantity, rate, GST
5. Press Ctrl+A to accept

### Creating a Purchase Entry
1. Gateway > Vouchers > F9 (Purchase)
2. Enter supplier name
3. Select purchase ledger
4. Add items with HSN code
5. Verify GST breakup (CGST/SGST or IGST)

### Payment Entry
1. Gateway > Vouchers > F5 (Payment)
2. Select bank/cash ledger
3. Enter party and amount
4. Reference invoice number for tracking

### Receipt Entry
1. Gateway > Vouchers > F6 (Receipt)
2. Select bank/cash ledger
3. Enter party and amount received
4. Link to pending invoice (bill-wise)

## Tally Reports That Matter

| Report | Path | What It Shows |
|--------|------|--------------|
| Outstanding Receivables | Gateway > Display > Statements > Outstanding > Receivables | Who owes you money |
| Outstanding Payables | Gateway > Display > Statements > Outstanding > Payables | Who you owe money to |
| GST Summary | Gateway > Display > Statutory Reports > GST | GST collected vs paid |
| Day Book | Gateway > Display > Day Book | All transactions for the day |
| Trial Balance | Gateway > Display > Trial Balance | Complete financial overview |
| Profit & Loss | Gateway > Reports > P&L | How much you earned/lost |
| Balance Sheet | Gateway > Reports > Balance Sheet | Company's financial health |

## Tally Data Export

### Export to Excel
- Gateway > Display > [Any Report]
- Press Alt+E > Excel > Choose file location
- Or: Gateway > Export > Select format

### Export for GST Filing
- Gateway > Display > Statutory Reports > GST > GSTR-1
- Press Alt+E > Export as JSON
- Upload JSON to GST portal

### Tally Backup
- Gateway > F3 (Company Info) > Backup
- Always backup before month-end closing
- Keep weekly backups on external drive/cloud

## Common Tally Errors & Fixes

1. **"Voucher number already exists"** → Check if duplicate entry, or change voucher numbering in F12
2. **"Party ledger not found"** → Create new ledger: Gateway > Create > Ledger
3. **"GST not calculating"** → Check: Is GST enabled? Is HSN/SAC code set? Is tax ledger linked?
4. **"Bank reconciliation mismatch"** → Gateway > Banking > Reconciliation > Match dates carefully
5. **"Negative stock"** → Check if purchase entries are missing or dates are wrong

## Integration Notes (Future)

Tally Prime has a REST API (TallyConnector) that can be used for:
- Pulling outstanding receivables automatically
- Creating invoices from BizClaw
- Syncing payment receipts
- Real-time cash flow monitoring

This API integration will be added in a future BizClaw update. For now, BizClaw helps with Tally guidance and manual workflows.

## Important Disclaimer

> "I can guide you on Tally operations, but for complex accounting entries or tax-related decisions, please consult your CA. Main sirf general guidance deta hun!"
