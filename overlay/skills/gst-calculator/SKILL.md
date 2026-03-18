# GST Calculator

**Description:** Calculate GST (Goods and Services Tax) for Indian businesses. Supports CGST, SGST, IGST calculations with HSN/SAC codes.

**Triggers:** "gst", "calculate tax", "gst on", "add gst", "tax calculation"

**Examples:**
- "GST on ₹100,000 at 18%"
- "Calculate IGST for ₹50,000 export"
- "What's the GST on professional services?"

**Parameters:**
- amount: The base amount
- rate: GST rate (5%, 12%, 18%, 28%)
- type: CGST+SGST or IGST
- inclusive: Whether amount includes GST

**Output:**
- Base amount
- CGST amount
- SGST amount (or IGST)
- Total tax amount
- Final amount (with tax)

**Notes:**
- Uses Indian rupee (₹) format
- Supports all standard GST rates: 0%, 5%, 12%, 18%, 28%
- Shows bifurcation for B2B vs B2C
- Can handle composition scheme calculations
