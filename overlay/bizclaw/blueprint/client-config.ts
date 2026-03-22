// ============================================================
// BizClaw Blueprint Client Config Generator
// Inspired by NVIDIA NeMoClaw configuration management
// Bizgenix AI Solutions Pvt. Ltd.
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, chmodSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve paths relative to this script directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_ROOT = resolve(__dirname, "..");
const TEMPLATE_DIR = resolve(__dirname, "../../../clients/TEMPLATE");

// =============================================================================
// Types
// =============================================================================

export type ProfileType = "standard" | "enterprise" | "restricted";

export interface ClientMetadata {
  clientId: string;
  clientName: string;
  businessType?: string;
  employeeCount?: string;
  revenueRange?: string;
  primaryContact?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  adminPhone?: string;
  adminEmail?: string;
  emergencyContact?: string;
  tallyEnabled?: boolean;
  notionEnabled?: boolean;
  gstin?: string;
}

export interface BlueprintConfig {
  clientId: string;
  profile: ProfileType;
  metadata: ClientMetadata;
  config: {
    version: string;
    createdAt: string;
    profile: ProfileType;
    tools: string[];
    inference: string;
    maxConcurrentClients: number;
    features: Record<string, boolean>;
  };
  env: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// =============================================================================
// Profile Definitions (matches blueprint.yaml)
// =============================================================================

const PROFILES: Record<ProfileType, {
  tools: string[];
  inference: string;
  maxConcurrentClients: number;
  features: Record<string, boolean>;
  policy: string;
}> = {
  standard: {
    tools: ["gst-lookup", "business-calendar", "whatsapp-templates"],
    inference: "claude-sonnet-4-6",
    maxConcurrentClients: 50,
    features: { multiChannel: true, analytics: true, customBranding: true },
    policy: "default"
  },
  enterprise: {
    tools: ["gst-lookup", "business-calendar", "whatsapp-templates", "tally-bridge", "followup-manager"],
    inference: "claude-opus-4-6",
    maxConcurrentClients: 20,
    features: { multiChannel: true, analytics: true, customBranding: true, advancedReporting: true, apiAccess: true },
    policy: "enterprise"
  },
  restricted: {
    tools: ["whatsapp-templates"],
    inference: "claude-haiku-4-5",
    maxConcurrentClients: 100,
    features: { multiChannel: false, analytics: false, customBranding: false },
    policy: "restricted"
  }
};

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates client metadata before config generation
 */
export function validateConfig(metadata: ClientMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.clientId || metadata.clientId.trim() === "") {
    errors.push("clientId is required");
  } else if (!/^[a-z0-9-]+$/.test(metadata.clientId)) {
    errors.push("clientId must be lowercase alphanumeric with hyphens only");
  }

  if (!metadata.clientName || metadata.clientName.trim() === "") {
    errors.push("clientName is required");
  }

  // Phone validation (basic format check)
  if (metadata.adminPhone && !/^\+?[0-9]{10,13}$/.test(metadata.adminPhone.replace(/\s/g, ""))) {
    errors.push("adminPhone must be a valid phone number (10-13 digits)");
  }

  // GSTIN validation (basic format: 15 characters alphanumeric)
  if (metadata.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(metadata.gstin)) {
    warnings.push("gstin format may be invalid (expected 15-character GSTIN)");
  }

  // Warnings for missing optional fields
  if (!metadata.businessType) warnings.push("businessType not provided");
  if (!metadata.adminEmail) warnings.push("adminEmail not provided");

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// Config Generation
// =============================================================================

/**
 * Generates a complete client configuration object
 */
export function generateClientConfig(
  clientId: string,
  profile: ProfileType,
  metadata: Partial<ClientMetadata>
): BlueprintConfig {
  const profileConfig = PROFILES[profile];

  // Merge metadata with defaults
  const fullMetadata: ClientMetadata = {
    clientId,
    clientName: metadata.clientName || clientId,
    ...metadata
  };

  // Generate config.json content
  const configJson = {
    clientId,
    clientName: fullMetadata.clientName,
    businessType: fullMetadata.businessType || "",
    employeeCount: fullMetadata.employeeCount || "",
    revenueRange: fullMetadata.revenueRange || "",
    primaryContact: fullMetadata.primaryContact || "",
    phone: fullMetadata.phone || "",
    email: fullMetadata.email || "",
    city: fullMetadata.city || "",
    state: fullMetadata.state || "",
    createdAt: new Date().toISOString(),
    profile,
    tools: profileConfig.tools,
    inference: profileConfig.inference,
    maxConcurrentClients: profileConfig.maxConcurrentClients,
    features: profileConfig.features,
    policyTier: profileConfig.policy
  };

  // Generate .env content
  const gatewayToken = generateRandomToken();
  const envVars: Record<string, string> = {
    "CLIENT_ID": clientId,
    "CLIENT_NAME": fullMetadata.clientName,
    "CLIENT_BUSINESS": fullMetadata.businessType || "",
    "BIZCLAW_PROFILE": profile,
    "BIZCLAW_POLICY": profileConfig.policy,
    "BIZCLAW_PORT": "18789",
    "GATEWAY_TOKEN": gatewayToken,
    "INFERENCE_PROVIDER": "anthropic",
    "INFERENCE_MODEL": profileConfig.inference,
    "ADMIN_PHONE": fullMetadata.adminPhone || "",
    "ADMIN_EMAIL": fullMetadata.adminEmail || "",
    "EMERGENCY_CONTACT": fullMetadata.emergencyContact || "",
    "GSTIN": fullMetadata.gstin || "",
    "TALLY_ENABLED": fullMetadata.tallyEnabled ? "true" : "false",
    "NOTION_ENABLED": fullMetadata.notionEnabled ? "true" : "false",
    "NODE_ENV": "production",
    "OPENCLAW_WORKSPACE_DIR": "/data/workspace",
    "OPENCLAW_STATE_DIR": "/data"
  };

  return {
    clientId,
    profile,
    metadata: fullMetadata,
    config: configJson,
    env: envVars
  };
}

/**
 * Applies blueprint to create a new client directory
 */
export function applyBlueprint(
  clientId: string,
  profile: ProfileType,
  metadata: Partial<ClientMetadata>,
  targetDir: string
): { success: boolean; path: string; errors: string[] } {
  const errors: string[] = [];

  // Validate first
  const validation = validateConfig({ clientId, clientName: metadata.clientName || clientId, ...metadata });
  if (!validation.valid) {
    return {
      success: false,
      path: "",
      errors: validation.errors
    };
  }

  // Generate config
  const config = generateClientConfig(clientId, profile, metadata);

  // Create directories
  const clientDir = join(targetDir, clientId);
  try {
    mkdirSync(clientDir, { recursive: true });
    mkdirSync(join(clientDir, "data"), { recursive: true });
    mkdirSync(join(clientDir, "data/agents"), { recursive: true });
    mkdirSync(join(clientDir, "data/credentials"), { recursive: true });
    mkdirSync(join(clientDir, "data/credentials/whatsapp"), { recursive: true });
    mkdirSync(join(clientDir, "data/backups"), { recursive: true });
    mkdirSync(join(clientDir, "data/logs"), { recursive: true });
    mkdirSync(join(clientDir, "data/workspace"), { recursive: true });
    mkdirSync(join(clientDir, "data/sessions"), { recursive: true });
    mkdirSync(join(clientDir, "data/memory"), { recursive: true });
    mkdirSync(join(clientDir, "data/config"), { recursive: true });
    mkdirSync(join(clientDir, "logs"), { recursive: true });
  } catch (e) {
    return {
      success: false,
      path: "",
      errors: [`Failed to create directories: ${(e as Error).message}`]
    };
  }

  // Write config.json
  try {
    writeFileSync(
      join(clientDir, "config.json"),
      JSON.stringify(config.config, null, 2)
    );
  } catch (e) {
    errors.push(`Failed to write config.json: ${(e as Error).message}`);
  }

  // Write .env
  try {
    const envContent = generateEnvFile(config.env);
    writeFileSync(join(clientDir, ".env"), envContent);
    chmodSync(join(clientDir, ".env"), 0o600);
  } catch (e) {
    errors.push(`Failed to write .env: ${(e as Error).message}`);
  }

  // Copy template files
  try {
    if (existsSync(join(TEMPLATE_DIR, "openclaw.json"))) {
      cpSync(join(TEMPLATE_DIR, "openclaw.json"), join(clientDir, "openclaw.json"));
    }
    if (existsSync(join(TEMPLATE_DIR, "soul.md"))) {
      let soulContent = readFileSync(join(TEMPLATE_DIR, "soul.md"), "utf-8");
      soulContent = soulContent
        .replace(/TEMPLATE_CLIENT_NAME/g, config.metadata.clientName)
        .replace(/TEMPLATE_CLIENT_BUSINESS/g, config.metadata.businessType || "");
      writeFileSync(join(clientDir, "soul.md"), soulContent);
    }
    if (existsSync(join(TEMPLATE_DIR, "AGENTS.md"))) {
      cpSync(join(TEMPLATE_DIR, "AGENTS.md"), join(clientDir, "AGENTS.md"));
    }
  } catch (e) {
    errors.push(`Failed to copy template files: ${(e as Error).message}`);
  }

  // Copy policy YAML
  try {
    const policyFile = join(BLUEPRINT_ROOT, "config/policies", `${profile}.yaml`);
    const defaultPolicy = join(BLUEPRINT_ROOT, "config/policies", "default.yaml");
    const destPolicy = join(clientDir, "data/config/policy.yaml");

    if (existsSync(policyFile)) {
      cpSync(policyFile, destPolicy);
    } else if (existsSync(defaultPolicy)) {
      cpSync(defaultPolicy, destPolicy);
    }
  } catch (e) {
    errors.push(`Failed to copy policy: ${(e as Error).message}`);
  }

  // Write blueprint metadata
  try {
    writeFileSync(
      join(clientDir, ".blueprint.json"),
      JSON.stringify({
        blueprintVersion: "1.0",
        appliedAt: new Date().toISOString(),
        profile,
        policy: PROFILES[profile].policy,
        tools: PROFILES[profile].tools
      }, null, 2)
    );
  } catch (e) {
    errors.push(`Failed to write .blueprint.json: ${(e as Error).message}`);
  }

  // Set secure permissions
  try {
    chmodSync(join(clientDir, ".env"), 0o600);
    chmodSync(join(clientDir, "data/credentials"), 0o700);
    chmodSync(join(clientDir, "data/credentials/whatsapp"), 0o700);
  } catch (e) {
    // Non-critical, just log
    console.warn(`Warning: Could not set permissions: ${(e as Error).message}`);
  }

  return {
    success: errors.length === 0,
    path: clientDir,
    errors
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateRandomToken(): string {
  const chars = "0123456789abcdef";
  let token = "";
  for (let i = 0; i < 48; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function generateEnvFile(envVars: Record<string, string>): string {
  const header = `# BizClaw Client Environment
# Generated by BizClaw Blueprint System
# Bizgenix AI Solutions Pvt. Ltd.
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

`;

  const lines = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  return header + lines + "\n";
}

// =============================================================================
// CLI Interface
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(`
BizClaw Blueprint Client Config Generator

Usage:
  npx tsx client-config.ts <client-id> <profile> [options]

Arguments:
  client-id    Unique identifier for the client (lowercase, hyphens only)
  profile      Profile type: standard | enterprise | restricted

Options:
  --name       Client display name
  --business   Business type/industry
  --phone      Admin phone number
  --email      Admin email address
  --gstin      GSTIN number
  --dry-run    Show what would be created without creating files

Example:
  npx tsx client-config.ts acme-textiles standard --name "Acme Textiles" --business "Textiles"
`);
    process.exit(1);
  }

  const clientId = args[0];
  const profile = args[1] as ProfileType;

  if (!["standard", "enterprise", "restricted"].includes(profile)) {
    console.error(`Error: Invalid profile '${profile}'. Must be one of: standard, enterprise, restricted`);
    process.exit(1);
  }

  // Parse options
  const options: Record<string, string> = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      options[key] = args[i + 1] || "";
      i++;
    }
  }

  const metadata: Partial<ClientMetadata> = {
    clientName: options.name,
    businessType: options.business,
    adminPhone: options.phone,
    adminEmail: options.email,
    gstin: options.gstin
  };

  const validation = validateConfig({ clientId, clientName: metadata.clientName || clientId, ...metadata });

  if (!validation.valid) {
    console.error("Validation failed:");
    validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn("Warnings:");
    validation.warnings.forEach(w => console.warn(`  - ${w}`));
  }

  if (options["dry-run"]) {
    console.log("\n=== DRY RUN - Would create the following ===\n");
    const config = generateClientConfig(clientId, profile, metadata);
    console.log("Config JSON:");
    console.log(JSON.stringify(config.config, null, 2));
    console.log("\nEnv variables (sample):");
    Object.entries(config.env).slice(0, 10).forEach(([k, v]) => {
      console.log(`  ${k}=${v.substring(0, 20)}...`);
    });
  } else {
    const rootDir = resolve(__dirname, "../../..");
    const result = applyBlueprint(clientId, profile, metadata, join(rootDir, "clients"));

    if (result.success) {
      console.log(`\nClient provisioned successfully!`);
      console.log(`Directory: ${result.path}`);
      console.log(`Profile: ${profile}`);
      console.log(`Policy: ${PROFILES[profile].policy}`);
      console.log(`Tools: ${PROFILES[profile].tools.join(", ")}`);
    } else {
      console.error("\nProvisioning failed:");
      result.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
  }
}

// Export for programmatic use
export default {
  generateClientConfig,
  validateConfig,
  applyBlueprint,
  PROFILES
};
