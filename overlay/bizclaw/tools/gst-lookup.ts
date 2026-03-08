// ============================================================
// GST Lookup Tool — Validates GSTIN and returns business info
// Uses public GST search API (no auth required)
// ============================================================

interface GstLookupInput {
  gstin: string;
}

interface GstResult {
  valid: boolean;
  gstin: string;
  businessName?: string;
  legalName?: string;
  stateCode?: string;
  status?: string;
  registrationType?: string;
  error?: string;
}

/**
 * Validate a GSTIN format (15-character alphanumeric).
 * Format: 2-digit state code + 10-char PAN + 1 entity code + 1 check + Z
 */
function isValidGstinFormat(gstin: string): boolean {
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return pattern.test(gstin.toUpperCase());
}

/**
 * Get state name from first 2 digits of GSTIN.
 */
function getStateName(code: string): string {
  const states: Record<string, string> = {
    "01": "Jammu & Kashmir",
    "02": "Himachal Pradesh",
    "03": "Punjab",
    "04": "Chandigarh",
    "05": "Uttarakhand",
    "06": "Haryana",
    "07": "Delhi",
    "08": "Rajasthan",
    "09": "Uttar Pradesh",
    "10": "Bihar",
    "11": "Sikkim",
    "12": "Arunachal Pradesh",
    "13": "Nagaland",
    "14": "Manipur",
    "15": "Mizoram",
    "16": "Tripura",
    "17": "Meghalaya",
    "18": "Assam",
    "19": "West Bengal",
    "20": "Jharkhand",
    "21": "Odisha",
    "22": "Chhattisgarh",
    "23": "Madhya Pradesh",
    "24": "Gujarat",
    "25": "Daman & Diu",
    "26": "Dadra & Nagar Haveli",
    "27": "Maharashtra",
    "29": "Karnataka",
    "30": "Goa",
    "31": "Lakshadweep",
    "32": "Kerala",
    "33": "Tamil Nadu",
    "34": "Puducherry",
    "35": "Andaman & Nicobar",
    "36": "Telangana",
    "37": "Andhra Pradesh",
    "38": "Ladakh",
    "97": "Other Territory",
  };
  return states[code] || "Unknown State";
}

export const gstLookupTool = {
  name: "gst_lookup",
  description:
    "Validate an Indian GST Identification Number (GSTIN) and get basic business details like state, status, and registration type. Input: a 15-character GSTIN string.",

  parameters: {
    type: "object" as const,
    properties: {
      gstin: {
        type: "string",
        description: "The 15-character GSTIN to validate (e.g., 24AABCU9603R1ZM)",
      },
    },
    required: ["gstin"],
  },

  async execute(input: GstLookupInput): Promise<GstResult> {
    const gstin = (input.gstin || "").toUpperCase().trim();

    // Format validation
    if (!isValidGstinFormat(gstin)) {
      return {
        valid: false,
        gstin,
        error: `Invalid GSTIN format. A GSTIN must be 15 characters: 2-digit state code + 10-char PAN + entity code + Z + check digit. Example: 24AABCU9603R1ZM`,
      };
    }

    const stateCode = gstin.substring(0, 2);
    const stateName = getStateName(stateCode);
    const panNumber = gstin.substring(2, 12);

    // Try public GST API for live validation
    try {
      const response = await fetch(
        `https://sheet.best/api/sheets/gst-lookup?gstin=${gstin}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.legalName) {
          return {
            valid: true,
            gstin,
            businessName: data.tradeName || data.legalName,
            legalName: data.legalName,
            stateCode: `${stateCode} (${stateName})`,
            status: data.status || "Active",
            registrationType: data.registrationType || "Regular",
          };
        }
      }
    } catch {
      // API unavailable — fall back to format-only validation
    }

    // Fallback: return format validation + extracted info
    return {
      valid: true,
      gstin,
      stateCode: `${stateCode} (${stateName})`,
      status: "Format valid (live status check unavailable)",
      registrationType: "Check on GST portal: https://services.gst.gov.in/services/searchtp",
    };
  },
};
