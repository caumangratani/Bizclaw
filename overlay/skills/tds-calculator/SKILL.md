# TDS Calculator

**Description:** Calculate TDS (Tax Deducted at Source) for Indian payments. Supports all major sections - 194, 194C, 194J, 194H, etc.

**Triggers:** "tds", "deduct tax", "tds on", "section 194", "withhold tax"

**Examples:**
- "TDS on ₹1,00,000 professional fees"
- "Calculate TDS for rent payment ₹50,000"
- "Section 194J TDS for ₹2,00,000"

**Parameters:**
- amount: Payment amount
- section: TDS section (194, 194C, 194J, 194H, 194A, etc.)
- nature: Nature of payment (professional, rent, contractor, interest, salary)
- resident: Whether payee is resident or non-resident

**Output:**
- TDS rate applicable
- TDS amount deducted
- Net amount payable
- Certificate details (Form 16A)

**Notes:**
- Knows all current TDS rates (as of FY 2025-26)
- Handles different rates for individuals vs companies
- Considers threshold limits
- Shows due date for TDS deposit

**Common Sections:**
- 194: Salaries
- 194A: Interest payments
- 194C: Contractor payments
- 194H: Commission/Brokerage
- 194J: Professional fees, Technical services
- 194IB: Rent
