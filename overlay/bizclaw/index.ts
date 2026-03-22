// ============================================================
// BizClaw Plugin — Main Entry Point
// Bizgenix AI Solutions Pvt. Ltd.
// ============================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to this plugin directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOUL_PATH = resolve(__dirname, "../soul/SOUL.md");

// Import tools
import { gstLookupTool } from "./tools/gst-lookup.js";
import { businessCalendarTool } from "./tools/business-calendar.js";
import { whatsappTemplatesTool } from "./tools/whatsapp-templates.js";

// Import policy system
import { getPolicyManager, loadSkillsMetadata, type PolicyCheckResult, type SkillMetadata } from "./policy-manager.js";

export default {
  id: "bizclaw",
  name: "BizClaw Plugin",

  register(api: any) {
    // ──────────────────────────────────────────────────────────
    // A. Policy Manager & Skills bootstrap
    // ──────────────────────────────────────────────────────────
    let policyManager: ReturnType<typeof getPolicyManager>;
    try {
      // Policy name can be overridden via config; default to "default"
      const policyName = api.config?.policyTier ?? "default";
      policyManager = getPolicyManager(policyName);

      const policyInfo = policyManager.getPolicyInfo();
      console.log(`[bizclaw] Policy system active: "${policyInfo.name}" from ${policyInfo.loadedFrom}`);

      // Load and register skill metadata
      const skills = loadSkillsMetadata();
      console.log(`[bizclaw] Loaded ${skills.length} skill definitions: ${skills.map((s) => s.name).join(", ")}`);
    } catch (err) {
      console.warn(`[bizclaw] Policy manager failed to initialize: ${(err as Error).message}. Running without policy enforcement.`);
    }

    // ──────────────────────────────────────────────────────────
    // B. Inject SOUL.md into every agent's system prompt
    // ──────────────────────────────────────────────────────────
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
    // 4. Policy enforcement — before_action hook
    // Intercepts every agent action and validates against policy
    // ----------------------------------------------------------
    if (policyManager) {
      api.on("before_action", (event: any) => {
        const { actionType, actionId, target, metadata } = event;
        const ts = new Date().toISOString();

        // Network access check
        if (actionType === "network_request" && target?.host) {
          const port = target.port ?? 443;
          const result = policyManager.canAccessNetwork(target.host, port);
          if (!result.allowed) {
            event.blocked = true;
            event.blockReason = result.reason;
            console.log(
              `[bizclaw:policy] BLOCKED network_access host=${target.host}:${port} rule="${result.rule}" reason="${result.reason}" ts=${ts}`
            );
          }
          return;
        }

        // Filesystem access check
        if (actionType === "filesystem_read" || actionType === "filesystem_write") {
          const path = target?.path ?? "";
          const result = policyManager.canAccessFile(path);
          if (!result.allowed) {
            event.blocked = true;
            event.blockReason = result.reason;
            console.log(
              `[bizclaw:policy] BLOCKED filesystem_${actionType.replace("filesystem_", "")} path="${path}" reason="${result.reason}" ts=${ts}`
            );
          }
          return;
        }

        // Approval required check — flag for human review
        if (actionId && policyManager.requiresApproval(actionId)) {
          event.requiresApproval = true;
          event.approvalReason = `Policy requires approval for action: ${actionId}`;
          console.log(
            `[bizclaw:policy] APPROVAL_REQUIRED action=${actionId} ts=${ts}`
          );
        }
      });

      // ────────────────────────────────────────────────────────
      // 5. Policy logging — after_action hook
      // Records every action with policy decision for audit trail
      // ────────────────────────────────────────────────────────
      api.on("after_action", (event: any) => {
        const { actionType, actionId, blocked, blockReason, requiresApproval, approved, durationMs } = event;
        const ts = new Date().toISOString();

        if (blocked) {
          console.log(
            `[bizclaw:policy:AUDIT] action=${actionId ?? actionType} outcome=BLOCKED reason="${blockReason}" ts=${ts}`
          );
        } else if (requiresApproval && !approved) {
          console.log(
            `[bizclaw:policy:AUDIT] action=${actionId ?? actionType} outcome=PENDING_APPROVAL reason="${event.approvalReason}" ts=${ts}`
          );
        } else if (requiresApproval && approved) {
          console.log(
            `[bizclaw:policy:AUDIT] action=${actionId ?? actionType} outcome=APPROVED_BY_HUMAN durationMs=${durationMs} ts=${ts}`
          );
        } else {
          console.log(
            `[bizclaw:policy:AUDIT] action=${actionId ?? actionType} outcome=ALLOWED durationMs=${durationMs ?? "?"} ts=${ts}`
          );
        }
      });
    }

    // ----------------------------------------------------------
    // 4b. Upsell detection hook — flag requests outside skill set
    // (renumbered; old #4 moved to policy section above)
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
