// ============================================================
// BizClaw Policy Manager
// Loads, validates, and enforces declarative YAML policies
// for MSME clients — inspired by NeMoClaw's policy approach
// Bizgenix AI Solutions Pvt. Ltd.
// ============================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────────────────────
// Types — aligned with the linter-approved YAML schema
// ──────────────────────────────────────────────────────────────

export interface ToolRateLimit {
  requestsPerMinute: number;
  burst?: number;
}

export interface ToolConfig {
  enabled: boolean;
  rateLimit?: ToolRateLimit;
  cache?: {
    enabled: boolean;
    ttlSeconds?: number;
  };
  maxMessageLength?: number;
  allowedLanguages?: string[];
  auditLogging?: boolean;
  dataExport?: boolean;
  escalationEnabled?: boolean;
  trialMode?: boolean;
  reason?: string;          // present when disabled
}

export interface PolicyTools {
  gstLookup?: ToolConfig;
  businessCalendar?: ToolConfig;
  whatsappTemplates?: ToolConfig;
  tallyBridge?: ToolConfig;
  followupManager?: ToolConfig;
  // Allow arbitrary tool keys
  [key: string]: ToolConfig | undefined;
}

export interface PolicySecurity {
  maxConcurrentClients?: number;
  rateLimit?: {
    global?: {
      requestsPerMinute: number;
      burst?: number;
    };
  };
  dataRetention?: {
    logsDays?: number;
    backupsDays?: number;
    auditDays?: number;
    trialAutoDelete?: boolean;
  };
  allowedOrigins?: string[];
  maxFileSize?: number;
  encryption?: {
    atRest?: boolean;
    inTransit?: boolean;
  };
  ipWhitelist?: string[];
  trial?: {
    enabled?: boolean;
    expiresAfterDays?: number;
    maxMessages?: number;
  };
}

export interface PolicyFeatures {
  multiChannel?: boolean;
  analytics?: boolean;
  customBranding?: boolean;
  advancedReporting?: boolean;
  apiAccess?: boolean;
  webhookSupport?: boolean;
  ssoEnabled?: boolean;
  watermark?: boolean;
  trialBadge?: boolean;
}

export interface PolicyAudit {
  enabled?: boolean;
  logAllToolCalls?: boolean;
  logAllMessages?: boolean;
  exportFormat?: "json" | "csv" | "both";
}

export interface PolicyNotifications {
  trialExpiryReminder?: boolean;
  trialUpgradePrompt?: boolean;
}

export interface Policy {
  version: string;
  name: string;
  description: string;
  tools?: PolicyTools;
  security?: PolicySecurity;
  features?: PolicyFeatures;
  audit?: PolicyAudit;
  notifications?: PolicyNotifications;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason: string;
  rule?: string;
  timestamp: string;
}

export interface SkillMetadata {
  name: string;
  description: string;
  capabilities: string[];
  triggers: {
    naturalLanguage?: string[];
    scheduled?: Array<{
      cron: string;
      action: string;
      reason: string;
    }>;
  };
  permissions: {
    network: string[];
    filesystem: string[];
  };
  tools?: Array<{
    name: string;
    source: string;
    args?: Record<string, unknown>;
  }>;
  config?: Record<string, unknown>;
}

// ──────────────────────────────────────────────────────────────
// PolicyManager
// ──────────────────────────────────────────────────────────────

export class PolicyManager {
  private policy: Policy;
  private policyName: string;
  private loadedFrom: string;

  // In-memory audit log — in production, push to a log drain
  private blockLog: PolicyCheckResult[] = [];

  constructor(policyName: string = "default") {
    this.policyName = policyName;
    this.loadedFrom = "";
    this.policy = this.loadPolicy(policyName);
  }

  // ── Loading ────────────────────────────────────────────────

  private loadPolicy(name: string): Policy {
    // 1. Client-specific override (per-tenant)
    const clientPolicyPath = resolve(
      process.env.CLIENT_CONFIG_DIR ?? "/data/config",
      "policy.yaml"
    );

    // 2. Plugin bundled default
    const bundlePolicyPath = resolve(__dirname, "config/policies", `${name}.yaml`);

    let resolvedPath: string;

    if (existsSync(clientPolicyPath)) {
      resolvedPath = clientPolicyPath;
    } else if (existsSync(bundlePolicyPath)) {
      resolvedPath = bundlePolicyPath;
    } else {
      throw new Error(
        `[bizclaw:policy] Policy "${name}" not found at client path (${clientPolicyPath}) ` +
        `or bundled path (${bundlePolicyPath}).`
      );
    }

    this.loadedFrom = resolvedPath;
    const rawContent = readFileSync(resolvedPath, "utf-8");

    try {
      const parsed = YAML.parse(rawContent) as Policy;
      this.validatePolicy(parsed, name);
      console.log(
        `[bizclaw:policy] Loaded policy "${parsed.name}" from ${resolvedPath}`
      );
      return parsed;
    } catch (err) {
      throw new Error(
        `[bizclaw:policy] Failed to parse/validate policy "${name}": ${(err as Error).message}`
      );
    }
  }

  private validatePolicy(p: Policy, name: string): void {
    if (!p || typeof p !== "object") {
      throw new Error("Policy must be a YAML object");
    }
    if (!p.version) {
      throw new Error(`Policy "${name}" missing required field: version`);
    }
    if (!p.name) {
      throw new Error(`Policy "${name}" missing required field: name`);
    }
    // AllowedVersions: only "1.0" for now
    if (p.version !== "1.0") {
      throw new Error(`Policy version must be "1.0", got "${p.version}"`);
    }
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Check if a named tool is permitted for use.
   * A tool is allowed if: not explicitly disabled, OR not listed at all (defaults to allow).
   * Use `isToolExplicitlyDisabled` to check strict denylist scenarios.
   */
  isToolAllowed(toolName: string): PolicyCheckResult {
    const timestamp = new Date().toISOString();
    const tools = this.policy.tools;

    if (!tools) {
      return { allowed: true, reason: "no tools section — all allowed by default", timestamp };
    }

    // Normalize tool name to camelCase key
    const key = this.normalizeToolKey(toolName);
    const toolConfig = (tools as Record<string, ToolConfig>)[key];

    if (!toolConfig) {
      // Tool not listed — allowed by default
      return { allowed: true, reason: `tool "${toolName}" not in policy — allowed by default`, timestamp };
    }

    if (toolConfig.enabled === false) {
      const result: PolicyCheckResult = {
        allowed: false,
        reason: toolConfig.reason ?? `tool "${toolName}" is disabled by policy`,
        rule: `tools.${key}.enabled = false`,
        timestamp,
      };
      this.logBlocked(result, { tool: toolName });
      return result;
    }

    return { allowed: true, reason: `tool "${toolName}" is enabled`, timestamp };
  }

  /**
   * Check if the policy tier matches a given tier name.
   */
  isTier(tier: string): boolean {
    return this.policy.name === tier;
  }

  /**
   * Returns rate limit config for a named tool, or the global fallback.
   */
  getRateLimit(toolName?: string): ToolRateLimit | { global: { requestsPerMinute: number; burst?: number } } | null {
    if (toolName) {
      const key = this.normalizeToolKey(toolName);
      const toolConfig = (this.policy.tools ?? {})[key];
      return toolConfig?.rateLimit ?? null;
    }
    return this.policy.security?.rateLimit?.global ?? null;
  }

  /**
   * Check if a feature flag is enabled.
   */
  isFeatureEnabled(feature: keyof PolicyFeatures): boolean {
    return this.policy.features?.[feature] ?? false;
  }

  /**
   * Returns the max file size allowed (in bytes), or null for unlimited.
   */
  getMaxFileSize(): number | null {
    return this.policy.security?.maxFileSize ?? null;
  }

  /**
   * Returns the audit configuration.
   */
  getAuditConfig(): PolicyAudit {
    return this.policy.audit ?? { enabled: false };
  }

  /**
   * Returns true if audit logging is enabled globally.
   */
  isAuditEnabled(): boolean {
    return this.policy.audit?.enabled ?? false;
  }

  /**
   * Returns all blocked attempts logged so far.
   */
  getBlockedLog(): PolicyCheckResult[] {
    return [...this.blockLog];
  }

  /**
   * Returns the full policy object.
   */
  getPolicy(): Policy {
    return { ...this.policy };
  }

  /**
   * Returns policy identity info.
   */
  getPolicyInfo(): { name: string; loadedFrom: string } {
    return { name: this.policy.name, loadedFrom: this.loadedFrom };
  }

  /**
   * Reload policy from disk (useful for hot-reload without restart).
   */
  reload(): void {
    console.log(`[bizclaw:policy] Reloading policy "${this.policyName}"...`);
    this.policy = this.loadPolicy(this.policyName);
  }

  // ── Private Helpers ────────────────────────────────────────

  private normalizeToolKey(name: string): string {
    // Map friendly tool names to YAML keys (case-insensitive)
    const map: Record<string, string> = {
      "gstlookup": "gstLookup",
      "gst-lookup": "gstLookup",
      "gst": "gstLookup",
      "businesscalendar": "businessCalendar",
      "business-calendar": "businessCalendar",
      "whatsapptemplates": "whatsappTemplates",
      "whatsapp-templates": "whatsappTemplates",
      "whatsapp": "whatsappTemplates",
      "tallybridge": "tallyBridge",
      "tally-bridge": "tallyBridge",
      "tally": "tallyBridge",
      "followupmanager": "followupManager",
      "followup-manager": "followupManager",
      "followup": "followupManager",
    };
    const normalized = name.toLowerCase().replace(/[^a-z]/g, "");
    return map[normalized] ?? name;
  }

  private logBlocked(result: PolicyCheckResult, context: Record<string, unknown>): void {
    this.blockLog.push(result);

    if (this.policy.audit?.enabled) {
      console.log(
        `[bizclaw:policy:BLOCKED] ${JSON.stringify(context)} rule="${result.rule}" reason="${result.reason}" ts=${result.timestamp}`
      );
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Skill Loader
// ──────────────────────────────────────────────────────────────

export function loadSkillsMetadata(): SkillMetadata[] {
  const skillsDir = resolve(__dirname, "skills");
  const skillFiles = [
    "gst-tracker.yaml",
    "daily-brief.yaml",
    "followup-manager.yaml",
    "tally-bridge.yaml",
  ];

  const skills: SkillMetadata[] = [];

  for (const file of skillFiles) {
    const filePath = join(skillsDir, file);
    if (!existsSync(filePath)) {
      console.warn(`[bizclaw:skills] Skill file not found: ${filePath}`);
      continue;
    }

    try {
      const raw = readFileSync(filePath, "utf-8");
      const parsed = YAML.parse(raw) as SkillMetadata;
      skills.push(parsed);
    } catch (err) {
      console.error(`[bizclaw:skills] Failed to load skill "${file}":`, (err as Error).message);
    }
  }

  return skills;
}

// ──────────────────────────────────────────────────────────────
// Singleton instance
// ──────────────────────────────────────────────────────────────

let _instance: PolicyManager | null = null;

export function getPolicyManager(policyName?: string): PolicyManager {
  if (!_instance || policyName !== undefined) {
    _instance = new PolicyManager(policyName ?? "default");
  }
  return _instance;
}
