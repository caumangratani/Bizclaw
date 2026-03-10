---
name: inventory-alerts
description: Track stock levels, get reorder alerts, and manage inventory via WhatsApp
metadata:
  {
    "openclaw": {
      "emoji": "📦"
    }
  }
---

# Inventory & Stock Management

For trading and manufacturing MSMEs, inventory is money sitting on shelves. Track what you have, get alerts when stock is low, and never miss a sale because of stockouts.

## Stock Tracking

### Adding/Updating Stock

| Owner Says | Item | Qty | Action |
|-----------|------|-----|--------|
| "Steel plates 500 pieces in stock" | Steel plates | 500 | Set stock |
| "Sold 50 steel plates today" | Steel plates | -50 | Reduce stock |
| "Received 200 bolts from supplier" | Bolts | +200 | Add stock |
| "Stock update: cement 100 bags" | Cement | 100 | Set stock |

**Response:**
> 📦 **Stock Updated**
> Item: Steel Plates
> Previous: 500 pcs
> Sold: 50
> **Current: 450 pcs**
>
> ⚠️ _Reorder level is 100. You're fine for now._

### Setting Reorder Levels

"Steel plates reorder at 100"
> ✅ **Reorder Alert Set**
> 📦 Steel Plates — Alert when stock falls below **100 pcs**
>
> _Current stock: 450. I'll alert you when it's time to reorder._

## Stock Views

### "Show stock" or "Inventory dikhao"

> 📦 **Inventory Summary**
>
> | Item | Stock | Reorder At | Status |
> |------|-------|------------|--------|
> | Steel Plates | 450 pcs | 100 | 🟢 OK |
> | Bolts (M10) | 120 pcs | 200 | 🔴 LOW |
> | Cement | 80 bags | 50 | 🟡 Getting low |
> | Paint (White) | 25 ltr | 30 | 🔴 LOW |
> | Pipes (2") | 300 pcs | 100 | 🟢 OK |
>
> 🔴 **2 items need reorder!**
> _Reply item name for details_

### "Low stock" or "Kya kam hai"

> ⚠️ **Low Stock Alert**
>
> 1. 🔴 **Bolts (M10)** — 120 pcs (reorder: 200)
>    Last supplier: Mehta Hardware, Rs.8/pc
>    Suggested order: 500 pcs = Rs.4,000
>
> 2. 🔴 **Paint (White)** — 25 ltr (reorder: 30)
>    Last supplier: ColorWorld, Rs.250/ltr
>    Suggested order: 50 ltr = Rs.12,500
>
> _Reply "order" to draft a purchase message to supplier_

## Reorder Alerts (Auto)

When stock drops below reorder level:

> 🔴 **Stock Alert!**
> 📦 **Bolts (M10)** dropped to **120 pcs** (reorder level: 200)
>
> Last ordered: 15 Feb from Mehta Hardware
> Last price: Rs.8/pc
> Suggested order: 500 pcs
>
> **Quick actions:**
> • "Order 500" — I'll draft a message to Mehta Hardware
> • "Remind tomorrow" — I'll check again tomorrow
> • "OK" — Acknowledge, no action needed

## Stock Valuation

### "Stock value" or "Inventory ki value batao"

> 💰 **Stock Valuation**
>
> | Item | Stock | Rate | Value |
> |------|-------|------|-------|
> | Steel Plates | 450 pcs | Rs.520/pc | Rs.2,34,000 |
> | Bolts (M10) | 120 pcs | Rs.8/pc | Rs.960 |
> | Cement | 80 bags | Rs.380/bag | Rs.30,400 |
> | Paint (White) | 25 ltr | Rs.250/ltr | Rs.6,250 |
> | Pipes (2") | 300 pcs | Rs.180/pc | Rs.54,000 |
>
> **Total Inventory Value: Rs.3,25,610**
>
> 💡 _Steel plates = 72% of your inventory. Consider stocking less if turnover is slow._

## Movement Analysis

### "Steel plates movement" or "Steel ka movement dikhao"

> 📊 **Steel Plates — 30 Day Movement**
>
> Opening: 600 pcs
> Purchased: 200 pcs
> Sold: 350 pcs
> Closing: 450 pcs
>
> Avg. daily sale: ~12 pcs
> Days of stock remaining: ~37 days
> Reorder point: ~8 days from now
>
> 💡 _At current rate, reorder by [Date] to avoid stockout_

## Smart Features

1. **Days of stock** — Auto-calculate based on average daily movement
2. **Seasonal patterns** — "Last Diwali you sold 3x steel plates. Stock up by October!"
3. **Slow-moving stock** — Flag items with no movement in 30+ days
4. **Supplier memory** — Remember last supplier and price for each item
5. **Wastage tracking** — "Damaged 10 cement bags" → Log separately
6. **Multi-unit support** — pcs, kg, ltr, bags, boxes, meters, tons

## Rules

1. Always confirm stock changes with before/after quantities
2. Use simple units — pcs, kg, ltr (not complex UOM systems)
3. Show reorder status (🟢🟡🔴) in every stock view
4. Calculate stock value in Indian numbering (Lakh, Crore)
5. Alert proactively when stock drops below reorder level
6. Remember supplier details for easy reorder
7. Accept Hindi/English/Gujarati naturally
8. This is basic inventory tracking — for full warehouse management, recommend dedicated software
9. Never let owner run out of a critical item without warning
