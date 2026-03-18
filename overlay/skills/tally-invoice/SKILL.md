# Tally Invoice Generator

**Description:** Generate GST invoices compatible with Tally ERP. Creates properly formatted invoices with HSN codes, GST rates, and all required fields for Tally import.

**Triggers:** "generate invoice", "create invoice", "make bill", "tally invoice", "gst invoice"

**Examples:**
- "Generate invoice for Rahul Sharma ₹25,000"
- "Create GST invoice for 5 items"
- "Make a tax invoice for my sale"

**Parameters:**
- customer_name: Buyer name
- customer_gstin: GSTIN (if registered)
- items: List of items with quantities and rates
- invoice_number: Optional invoice number
- date: Invoice date
- due_date: Payment due date

**Output:**
- Properly formatted GST invoice
- HSN codes for items
- CGST/SGST or IGST bifurcation
- Exportable to Tally (CSV/XML format)
- Print-ready format

**Notes:**
- Pre-loaded with common HSN codes for:
  - Trading goods
  - Professional services
  - Consulting
  - Manufacturing inputs
- Auto-calculates tax breakdown
- Generates Tally-compatible format for easy import
- Includes all mandatory fields as per GST law

**Tally Export Format:**
```
Party Name,GSTIN,Invoice No,Date,Item Name,HSN Code,Quantity,Rate,Taxable Value,CGST %,SGST %,IGST %,Cess %
```
