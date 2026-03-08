// ============================================================
// BizClaw Plugin — Main Entry Point
// Bizgenix AI Solutions Pvt. Ltd.
// ============================================================

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to this plugin directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOUL_PATH = resolve(__dirname, "../soul/SOUL.md");

// Import tools
import { gstLookupTool } from "./tools/gst-lookup.js";
import { businessCalendarTool } from "./tools/business-calendar.js";
import { whatsappTemplatesTool } from "./tools/whatsapp-templates.js";

export default {
  id: "bizclaw",
  name: "BizClaw Plugin",

  register(api: any) {
    // ----------------------------------------------------------
    // 1. Inject SOUL.md into every agent's system prompt
    // ----------------------------------------------------------
    api.on("before_prompt_build", (event: any) => {
      try {
        const soulPath =
          api.config?.soulFilePath
            ? resolve(api.config.soulFilePath)
            : DEFAULT_SOUL_PATH;

        const soulContent = readFileSync(soulPath, "utf-8");

        // Prepend soul to the system prompt
        if (event.systemPrompt !== undefined) {
          event.systemPrompt = soulContent + "\n\n---\n\n" + event.systemPrompt;
        }
      } catch (err) {
        console.warn("[bizclaw] Could not load SOUL.md:", (err as Error).message);
      }
    });

    // ----------------------------------------------------------
    // 2. Register custom tools
    // ----------------------------------------------------------
    api.registerTool(gstLookupTool, {
      description: "Validate an Indian GST number (GSTIN) and get business details",
    });

    api.registerTool(businessCalendarTool, {
      description: "Get Indian business calendar — holidays, deadlines, and key dates",
    });

    api.registerTool(whatsappTemplatesTool, {
      description:
        "Get pre-written WhatsApp message templates in Hindi, Gujarati, and English for common MSME scenarios",
    });

    // ----------------------------------------------------------
    // 3. Log all messages for analytics (future dashboard)
    // ----------------------------------------------------------
    api.on("message_received", (event: any) => {
      const { channel, from, text, timestamp } = event;
      // For now, just log. Future: send to analytics DB
      console.log(
        `[bizclaw] Message from ${from} via ${channel} at ${timestamp}: ${(text || "").substring(0, 100)}...`
      );
    });

    // ----------------------------------------------------------
    // 4. Upsell detection hook — flag requests outside skill set
    // ----------------------------------------------------------
    api.on("message_sending", (event: any) => {
      // If the outgoing message contains "I can't" or "I'm not able",
      // we could flag this for the Bizgenix team. For now, just log.
      const text = event.text || "";
      if (
        text.includes("I can't") ||
        text.includes("I'm not able") ||
        text.includes("outside my capabilities")
      ) {
        console.log(
          `[bizclaw] Potential upsell opportunity detected for ${event.to}`
        );
        // Future: webhook to Bizgenix CRM
      }
    });

    console.log("[bizclaw] Plugin loaded successfully! ⚡");
  },
};
