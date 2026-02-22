// ============================================================
// Indian Business Calendar Tool
// Returns upcoming deadlines, holidays, and key business dates
// ============================================================

interface CalendarInput {
  month?: number; // 1-12, defaults to current month
  year?: number; // defaults to current year
  type?: "all" | "gst" | "income_tax" | "holidays" | "business";
}

interface CalendarEvent {
  date: string;
  title: string;
  type: "gst" | "income_tax" | "holiday" | "business";
  description: string;
  urgent: boolean;
}

interface CalendarResult {
  month: number;
  year: string;
  events: CalendarEvent[];
  nextDeadline: CalendarEvent | null;
}

/**
 * Get GST deadlines for a given month.
 */
function getGstDeadlines(month: number, year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const mm = String(month).padStart(2, "0");
  const y = String(year);

  // GSTR-7 / GSTR-8 (TDS/TCS) — 10th
  events.push({
    date: `${y}-${mm}-10`,
    title: "GSTR-7/8 Due (TDS/TCS)",
    type: "gst",
    description: "GST TDS (GSTR-7) and TCS (GSTR-8) returns due",
    urgent: false,
  });

  // GSTR-1 — 11th
  events.push({
    date: `${y}-${mm}-11`,
    title: "GSTR-1 Due",
    type: "gst",
    description: "Monthly outward supply statement. Upload all sales invoices.",
    urgent: false,
  });

  // IFF for QRMP — 13th
  events.push({
    date: `${y}-${mm}-13`,
    title: "IFF Due (QRMP Scheme)",
    type: "gst",
    description: "Invoice Furnishing Facility for quarterly filers (optional)",
    urgent: false,
  });

  // GSTR-3B — 20th
  events.push({
    date: `${y}-${mm}-20`,
    title: "GSTR-3B Due",
    type: "gst",
    description: "Summary return with tax payment. Most important monthly GST deadline!",
    urgent: true,
  });

  // Quarterly deadlines
  if ([1, 4, 7, 10].includes(month)) {
    events.push({
      date: `${y}-${mm}-22`,
      title: "GSTR-3B (Quarterly) Due",
      type: "gst",
      description: "Quarterly GSTR-3B for QRMP scheme businesses",
      urgent: false,
    });
  }

  // Annual — December only
  if (month === 12) {
    events.push({
      date: `${y}-12-31`,
      title: "GSTR-9 Annual Return Due",
      type: "gst",
      description: "Annual GST return for turnover > Rs.2 Crore",
      urgent: true,
    });
  }

  return events;
}

/**
 * Get Income Tax deadlines for a given month.
 */
function getIncomeTaxDeadlines(month: number, year: number): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const y = String(year);

  // Advance tax installments
  if (month === 6) {
    events.push({
      date: `${y}-06-15`,
      title: "Advance Tax — 1st Installment",
      type: "income_tax",
      description: "Pay 15% of estimated annual tax liability",
      urgent: true,
    });
  }
  if (month === 9) {
    events.push({
      date: `${y}-09-15`,
      title: "Advance Tax — 2nd Installment",
      type: "income_tax",
      description: "Pay 45% cumulative of estimated annual tax",
      urgent: true,
    });
  }
  if (month === 12) {
    events.push({
      date: `${y}-12-15`,
      title: "Advance Tax — 3rd Installment",
      type: "income_tax",
      description: "Pay 75% cumulative of estimated annual tax",
      urgent: true,
    });
  }
  if (month === 3) {
    events.push({
      date: `${y}-03-15`,
      title: "Advance Tax — 4th Installment",
      type: "income_tax",
      description: "Pay 100% of estimated annual tax. Last chance!",
      urgent: true,
    });
    events.push({
      date: `${y}-03-31`,
      title: "Financial Year End",
      type: "income_tax",
      description: "Last date for tax-saving investments (80C, 80D, etc.)",
      urgent: true,
    });
  }

  // TDS payment — 7th of every month
  events.push({
    date: `${y}-${String(month).padStart(2, "0")}-07`,
    title: "TDS Payment Due",
    type: "income_tax",
    description: "Deposit TDS deducted in previous month to government",
    urgent: false,
  });

  // ITR deadlines
  if (month === 7) {
    events.push({
      date: `${y}-07-31`,
      title: "ITR Filing Deadline (Non-Audit)",
      type: "income_tax",
      description: "Last date to file Income Tax Return without audit requirement",
      urgent: true,
    });
  }
  if (month === 9) {
    events.push({
      date: `${y}-09-30`,
      title: "ITR Filing Deadline (Audit Cases)",
      type: "income_tax",
      description: "Last date for businesses requiring tax audit",
      urgent: true,
    });
  }

  return events;
}

/**
 * Get major Indian holidays for a given month.
 */
function getHolidays(month: number): CalendarEvent[] {
  // Key national holidays (dates vary for some — these are approximate)
  const fixedHolidays: Record<string, CalendarEvent[]> = {
    "1": [
      { date: "01-01", title: "New Year's Day", type: "holiday", description: "National holiday", urgent: false },
      { date: "01-26", title: "Republic Day", type: "holiday", description: "National holiday — banks closed", urgent: false },
    ],
    "3": [
      { date: "03-29", title: "Holi (approx)", type: "holiday", description: "Festival of colors — many businesses closed", urgent: false },
    ],
    "4": [
      { date: "04-14", title: "Ambedkar Jayanti", type: "holiday", description: "National holiday", urgent: false },
    ],
    "5": [
      { date: "05-01", title: "May Day", type: "holiday", description: "Labour Day — some states", urgent: false },
    ],
    "8": [
      { date: "08-15", title: "Independence Day", type: "holiday", description: "National holiday — banks closed", urgent: false },
    ],
    "10": [
      { date: "10-02", title: "Gandhi Jayanti", type: "holiday", description: "National holiday — banks closed", urgent: false },
      { date: "10-24", title: "Diwali (approx)", type: "holiday", description: "Festival of lights — peak business season!", urgent: false },
    ],
    "11": [
      { date: "11-01", title: "Diwali Padwa / Govardhan Puja", type: "holiday", description: "New business year for many traders", urgent: false },
    ],
    "12": [
      { date: "12-25", title: "Christmas", type: "holiday", description: "National holiday", urgent: false },
    ],
  };

  return (fixedHolidays[String(month)] || []).map((h) => ({
    ...h,
    date: `2026-${h.date}`, // Will be overridden with actual year
  }));
}

export const businessCalendarTool = {
  name: "indian_business_calendar",
  description:
    "Get Indian business calendar for a month — GST deadlines, income tax dates, holidays, and key business events. Defaults to current month.",

  parameters: {
    type: "object" as const,
    properties: {
      month: {
        type: "number",
        description: "Month number (1-12). Defaults to current month.",
      },
      year: {
        type: "number",
        description: "Year (e.g., 2026). Defaults to current year.",
      },
      type: {
        type: "string",
        enum: ["all", "gst", "income_tax", "holidays", "business"],
        description: "Filter by event type. Defaults to 'all'.",
      },
    },
  },

  async execute(input: CalendarInput): Promise<CalendarResult> {
    const now = new Date();
    const month = input.month || now.getMonth() + 1;
    const year = input.year || now.getFullYear();
    const type = input.type || "all";

    let events: CalendarEvent[] = [];

    if (type === "all" || type === "gst") {
      events = events.concat(getGstDeadlines(month, year));
    }
    if (type === "all" || type === "income_tax") {
      events = events.concat(getIncomeTaxDeadlines(month, year));
    }
    if (type === "all" || type === "holidays") {
      events = events.concat(getHolidays(month));
    }

    // Sort by date
    events.sort((a, b) => a.date.localeCompare(b.date));

    // Find next upcoming deadline
    const today = now.toISOString().split("T")[0];
    const nextDeadline = events.find(
      (e) => e.date >= today && e.type !== "holiday"
    ) || null;

    return {
      month,
      year: String(year),
      events,
      nextDeadline,
    };
  },
};
