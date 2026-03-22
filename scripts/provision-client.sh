#!/usr/bin/env bash
# ============================================================
# BizClaw Client Provision Script
# Inspired by NVIDIA NeMoClaw-style onboarding
# Bizgenix AI Solutions Pvt. Ltd.
#
# Usage:
#   ./scripts/provision-client.sh <client-id> <profile> [--dry-run]
#   ./scripts/provision-client.sh acme-textiles standard
#   ./scripts/provision-client.sh test-client restricted --dry-run
# ============================================================

set -euo pipefail

# === Script Configuration ===
readonly SCRIPT_VERSION="1.0.0"
readonly BLUEPRINT_VERSION="1.0"

# === Colors for output ===
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# === Helper Functions ===
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# === Usage ===
usage() {
    cat <<EOF
BizClaw Client Provisioner v${SCRIPT_VERSION}

Creates a new client environment from blueprint profiles.

USAGE:
    $0 <client-id> <profile> [options]

ARGUMENTS:
    client-id    Unique identifier (lowercase, hyphens only, e.g., acme-textiles)
    profile      Blueprint profile:
                 - standard   : Standard MSME (GST, Calendar, WhatsApp)
                 - enterprise : Enterprise MSME (all tools + Tally)
                 - restricted : Trial/Testing (WhatsApp only)

OPTIONS:
    --dry-run    Show what would be created without creating files
    --force      Overwrite existing client directory
    -h, --help   Show this help message

EXAMPLES:
    # Create a standard MSME client
    $0 acme-textiles standard

    # Preview a restricted trial client
    $0 test-client restricted --dry-run

    # Overwrite existing client with enterprise profile
    $0 acme-textiles enterprise --force

ENVIRONMENT:
    BIZCLAW_ROOT    Override root directory (default: script parent)
    BIZCLAW_PROFILE Override default profile validation

EOF
}

# === Argument Parsing ===
parse_args() {
    # Check for help flag first
    for arg in "$@"; do
        if [[ "$arg" == "-h" || "$arg" == "--help" ]]; then
            usage
            exit 0
        fi
    done

    # Validate minimum arguments
    if [[ $# -lt 2 ]]; then
        log_error "Missing required arguments"
        usage
        exit 1
    fi

    CLIENT_ID="$1"
    PROFILE="$2"
    DRY_RUN=""
    FORCE=""

    shift 2

    # Parse remaining arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN="true"
                ;;
            --force)
                FORCE="true"
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
        shift
    done
}

# === Validation ===
validate_inputs() {
    local errors=0

    # Validate client ID format
    if [[ ! "$CLIENT_ID" =~ ^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$ ]]; then
        log_error "Invalid client-id: '$CLIENT_ID'"
        log_error "  Must be lowercase, alphanumeric with hyphens (no leading/trailing hyphens)"
        ((errors++))
    fi

    # Validate profile
    case "$PROFILE" in
        standard|enterprise|restricted)
            ;;
        *)
            log_error "Invalid profile: '$PROFILE'"
            log_error "  Must be one of: standard, enterprise, restricted"
            ((errors++))
            ;;
    esac

    # Check directory doesn't exist (unless --force)
    if [[ -d "$CLIENT_DIR" && "$FORCE" != "true" ]]; then
        log_error "Client directory already exists: $CLIENT_DIR"
        log_error "  Use --force to overwrite or ./scripts/reset-client.sh $CLIENT_ID first"
        ((errors++))
    fi

    # Check template directory exists
    if [[ ! -d "$TEMPLATE_DIR" ]]; then
        log_error "Template directory not found: $TEMPLATE_DIR"
        ((errors++))
    fi

    return $errors
}

# === Directory Creation ===
create_directories() {
    log_info "Creating directory structure..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would create:"
        echo "    $CLIENT_DIR/"
        echo "    $CLIENT_DIR/data/"
        echo "    $CLIENT_DIR/data/agents/"
        echo "    $CLIENT_DIR/data/credentials/"
        echo "    $CLIENT_DIR/data/credentials/whatsapp/"
        echo "    $CLIENT_DIR/data/backups/"
        echo "    $CLIENT_DIR/data/logs/"
        echo "    $CLIENT_DIR/data/workspace/"
        echo "    $CLIENT_DIR/data/sessions/"
        echo "    $CLIENT_DIR/data/memory/"
        echo "    $CLIENT_DIR/data/config/"
        echo "    $CLIENT_DIR/logs/"
        return 0
    fi

    mkdir -p "$CLIENT_DIR"
    mkdir -p "$CLIENT_DIR/data"
    mkdir -p "$CLIENT_DIR/data/agents"
    mkdir -p "$CLIENT_DIR/data/credentials"
    mkdir -p "$CLIENT_DIR/data/credentials/whatsapp"
    mkdir -p "$CLIENT_DIR/data/backups"
    mkdir -p "$CLIENT_DIR/data/logs"
    mkdir -p "$CLIENT_DIR/data/workspace"
    mkdir -p "$CLIENT_DIR/data/sessions"
    mkdir -p "$CLIENT_DIR/data/memory"
    mkdir -p "$CLIENT_DIR/data/config"
    mkdir -p "$CLIENT_DIR/logs"

    log_success "Directories created"
}

# === Template Copying ===
copy_templates() {
    log_info "Copying template files..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would copy:"
        [[ -f "$TEMPLATE_DIR/config.json" ]] && echo "    config.json"
        [[ -f "$TEMPLATE_DIR/openclaw.json" ]] && echo "    openclaw.json"
        [[ -f "$TEMPLATE_DIR/soul.md" ]] && echo "    soul.md"
        [[ -f "$TEMPLATE_DIR/AGENTS.md" ]] && echo "    AGENTS.md"
        return 0
    fi

    [[ -f "$TEMPLATE_DIR/config.json" ]] && cp "$TEMPLATE_DIR/config.json" "$CLIENT_DIR/config.json"
    [[ -f "$TEMPLATE_DIR/openclaw.json" ]] && cp "$TEMPLATE_DIR/openclaw.json" "$CLIENT_DIR/openclaw.json"
    [[ -f "$TEMPLATE_DIR/soul.md" ]] && cp "$TEMPLATE_DIR/soul.md" "$CLIENT_DIR/soul.md"
    [[ -f "$TEMPLATE_DIR/AGENTS.md" ]] && cp "$TEMPLATE_DIR/AGENTS.md" "$CLIENT_DIR/AGENTS.md"

    log_success "Templates copied"
}

# === Environment File Generation ===
generate_env_file() {
    log_info "Generating .env file..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would generate with:"
        echo "    CLIENT_ID=$CLIENT_ID"
        echo "    BIZCLAW_PROFILE=$PROFILE"
        echo "    BIZCLAW_POLICY=$POLICY"
        echo "    (plus generated GATEWAY_TOKEN)"
        return 0
    fi

    # Generate gateway token (48 character hex)
    GATEWAY_TOKEN=$(openssl rand -hex 24 2>/dev/null || head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')
    DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat > "$CLIENT_DIR/.env" <<EOF
# ============================================================
# BizClaw Client Environment
# Generated by BizClaw Blueprint Provisioner v${SCRIPT_VERSION}
# Bizgenix AI Solutions Pvt. Ltd.
# Generated: ${DATE}
# ============================================================

# -- Client Identity --
CLIENT_ID=${CLIENT_ID}
CLIENT_NAME=YOUR_CLIENT_NAME
CLIENT_BUSINESS=YOUR_BUSINESS_TYPE

# -- Blueprint Profile --
BIZCLAW_PROFILE=${PROFILE}
BIZCLAW_POLICY=${POLICY}
BLUEPRINT_VERSION=${BLUEPRINT_VERSION}

# -- Gateway Security --
# Auto-generated token - replace for production
GATEWAY_TOKEN=${GATEWAY_TOKEN}

# -- Network --
BIZCLAW_PORT=18789

# -- Inference Configuration --
INFERENCE_PROVIDER=anthropic
INFERENCE_MODEL=${INFERENCE_MODEL}

# -- API Keys (REQUIRED) --
# Add your API keys below:
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
OPENAI_API_KEY=

# -- Admin Contacts --
ADMIN_PHONE=
ADMIN_EMAIL=
EMERGENCY_CONTACT=

# -- Business Configuration --
GSTIN=
TALLY_ENABLED=false
NOTION_ENABLED=false

# -- Advanced --
NODE_ENV=production
OPENCLAW_STATE_DIR=/data
OPENCLAW_CONFIG_PATH=/data/openclaw.json
OPENCLAW_WORKSPACE_DIR=/data/workspace

# -- Feature Flags --
FEATURE_ANALYTICS=$([[ "$PROFILE" == "restricted" ]] && echo "false" || echo "true")
FEATURE_ADVANCED_REPORTING=$([[ "$PROFILE" == "enterprise" ]] && echo "true" || echo "false")
FEATURE_API_ACCESS=$([[ "$PROFILE" == "enterprise" ]] && echo "true" || echo "false")
EOF

    # Set secure permissions
    chmod 600 "$CLIENT_DIR/.env"

    log_success ".env file generated"
}

# === Policy File Copy ===
copy_policy() {
    log_info "Applying policy: $PROFILE"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would copy policy file:"
        echo "    $POLICIES_DIR/${PROFILE}.yaml -> $CLIENT_DIR/data/config/policy.yaml"
        return 0
    fi

    mkdir -p "$CLIENT_DIR/data/config"

    if [[ -f "$POLICIES_DIR/${PROFILE}.yaml" ]]; then
        cp "$POLICIES_DIR/${PROFILE}.yaml" "$CLIENT_DIR/data/config/policy.yaml"
    elif [[ -f "$POLICIES_DIR/default.yaml" ]]; then
        cp "$POLICIES_DIR/default.yaml" "$CLIENT_DIR/data/config/policy.yaml"
        log_warning "Profile-specific policy not found, using default"
    else
        log_warning "No policy file found at $POLICIES_DIR"
        # Create a minimal default policy
        cat > "$CLIENT_DIR/data/config/policy.yaml" <<EOF
# Default BizClaw Policy
# Profile: ${PROFILE}
policy:
  name: "${PROFILE}"
  version: "1.0"
  tools:
$(for tool in ${TOOLS[@]}; do echo "    - ${tool}"; done)
EOF
    fi

    log_success "Policy applied"
}

# === Placeholder Replacement ===
replace_placeholders() {
    log_info "Replacing placeholders..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would replace in:"
        [[ -f "$CLIENT_DIR/config.json" ]] && echo "    config.json"
        [[ -f "$CLIENT_DIR/soul.md" ]] && echo "    soul.md"
        [[ -f "$CLIENT_DIR/openclaw.json" ]] && echo "    openclaw.json"
        return 0
    fi

    DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # macOS vs Linux sed compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires '' for -i
        [[ -f "$CLIENT_DIR/config.json" ]] && {
            sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"
            sed -i '' "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"
        }
        [[ -f "$CLIENT_DIR/openclaw.json" ]] && {
            sed -i '' "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/openclaw.json"
        }
        [[ -f "$CLIENT_DIR/soul.md" ]] && {
            sed -i '' "s/TEMPLATE_CLIENT_NAME/$CLIENT_ID/g" "$CLIENT_DIR/soul.md"
        }
    else
        # Linux sed
        [[ -f "$CLIENT_DIR/config.json" ]] && {
            sed -i "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/config.json"
            sed -i "s/\"createdAt\": \"\"/\"createdAt\": \"$DATE\"/" "$CLIENT_DIR/config.json"
        }
        [[ -f "$CLIENT_DIR/openclaw.json" ]] && {
            sed -i "s/TEMPLATE/$CLIENT_ID/g" "$CLIENT_DIR/openclaw.json"
        }
        [[ -f "$CLIENT_DIR/soul.md" ]] && {
            sed -i "s/TEMPLATE_CLIENT_NAME/$CLIENT_ID/g" "$CLIENT_DIR/soul.md"
        }
    fi

    # Copy soul.md to workspace
    [[ -f "$CLIENT_DIR/soul.md" ]] && cp "$CLIENT_DIR/soul.md" "$CLIENT_DIR/data/workspace/SOUL.md"
    [[ -f "$CLIENT_DIR/AGENTS.md" ]] && cp "$CLIENT_DIR/AGENTS.md" "$CLIENT_DIR/data/workspace/AGENTS.md"
    [[ -f "$CLIENT_DIR/openclaw.json" ]] && cp "$CLIENT_DIR/openclaw.json" "$CLIENT_DIR/data/openclaw.json"

    log_success "Placeholders replaced"
}

# === Blueprint Metadata ===
create_blueprint_metadata() {
    log_info "Creating blueprint metadata..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would create .blueprint.json"
        return 0
    fi

    cat > "$CLIENT_DIR/.blueprint.json" <<EOF
{
  "blueprintVersion": "${BLUEPRINT_VERSION}",
  "appliedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "provisionerVersion": "${SCRIPT_VERSION}",
  "profile": "${PROFILE}",
  "policy": "${POLICY}",
  "tools": [$(for ((i=0; i<${#TOOLS[@]}; i++)); do [[ $i -gt 0 ]] && echo -n ", "; echo -n "\"${TOOLS[$i]}\""; done)],
  "inference": "${INFERENCE_MODEL}"
}
EOF

    log_success "Blueprint metadata created"
}

# === Permissions ===
set_permissions() {
    log_info "Setting secure permissions..."

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would set:"
        echo "    chmod 600 $CLIENT_DIR/.env"
        echo "    chmod 700 $CLIENT_DIR/data/credentials"
        echo "    chmod 700 $CLIENT_DIR/data/credentials/whatsapp"
        return 0
    fi

    chmod 600 "$CLIENT_DIR/.env" 2>/dev/null || true
    chmod 700 "$CLIENT_DIR/data/credentials" 2>/dev/null || true
    chmod 700 "$CLIENT_DIR/data/credentials/whatsapp" 2>/dev/null || true

    log_success "Permissions set"
}

# === Summary ===
print_summary() {
    echo ""
    echo -e "${GREEN}============================================================${NC}"
    echo -e "${GREEN}  BizClaw Client Provisioning Complete!${NC}"
    echo -e "${GREEN}============================================================${NC}"
    echo ""
    echo -e "  ${BLUE}Client ID:${NC}   $CLIENT_ID"
    echo -e "  ${BLUE}Profile:${NC}     $PROFILE"
    echo -e "  ${BLUE}Policy:${NC}      $POLICY"
    echo -e "  ${BLUE}Inference:${NC}   $INFERENCE_MODEL"
    echo -e "  ${BLUE}Tools:${NC}       ${TOOLS[*]}"
    echo ""
    echo -e "  ${BLUE}Directory:${NC}   $CLIENT_DIR"
    if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "  ${BLUE}Config:${NC}      $CLIENT_DIR/config.json"
    echo -e "  ${BLUE}Policy:${NC}      $CLIENT_DIR/data/config/policy.yaml"
    echo -e "  ${BLUE}Environment:${NC} $CLIENT_DIR/.env"
    echo ""
    echo -e "${YELLOW}  Next Steps:${NC}"
    echo "    1. Edit $CLIENT_DIR/.env and add API keys"
    echo "    2. Edit $CLIENT_DIR/config.json with client details"
    echo "    3. Customize $CLIENT_DIR/soul.md for client personality"
    echo "    4. Bootstrap WhatsApp: ./scripts/bootstrap-client-auth.sh $CLIENT_ID"
    echo "    5. Run readiness check: ./scripts/client-readiness.sh $CLIENT_ID"
    echo "    6. Deploy client: ./docker/deploy-client.sh $CLIENT_ID"
    else
    echo ""
    echo -e "  ${YELLOW}DRY RUN - No files were created${NC}"
    fi
    echo ""
}

# === Main ===
main() {
    # Resolve paths
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ROOT_DIR="$(dirname "$SCRIPT_DIR")"
    ROOT_DIR="${BIZCLAW_ROOT:-$ROOT_DIR}"

    TEMPLATE_DIR="$ROOT_DIR/clients/TEMPLATE"
    POLICIES_DIR="$ROOT_DIR/overlay/bizclaw/config/policies"
    CLIENTS_DIR="$ROOT_DIR/clients"
    CLIENT_DIR="$CLIENTS_DIR/$CLIENT_ID"

    # Profile-specific settings
    case "$PROFILE" in
        standard)
            POLICY="default"
            INFERENCE_MODEL="claude-sonnet-4-6"
            TOOLS=("gst-lookup" "business-calendar" "whatsapp-templates")
            ;;
        enterprise)
            POLICY="enterprise"
            INFERENCE_MODEL="claude-opus-4-6"
            TOOLS=("gst-lookup" "business-calendar" "whatsapp-templates" "tally-bridge" "followup-manager")
            ;;
        restricted)
            POLICY="restricted"
            INFERENCE_MODEL="claude-haiku-4-5"
            TOOLS=("whatsapp-templates")
            ;;
    esac

    # Print header
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  BizClaw Client Provisioner v${SCRIPT_VERSION}${NC}"
    echo -e "${BLUE}  Bizgenix AI Solutions Pvt. Ltd.${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""

    # Show configuration
    echo "Configuration:"
    echo "  Client ID:  $CLIENT_ID"
    echo "  Profile:    $PROFILE"
    echo "  Policy:     $POLICY"
    echo "  Inference:  $INFERENCE_MODEL"
    echo "  Root:       $ROOT_DIR"
    echo "  Dry Run:    ${DRY_RUN:-false}"
    echo ""

    # Validate inputs
    if ! validate_inputs; then
        log_error "Validation failed"
        exit 1
    fi

    # Execute provisioning steps
    create_directories
    copy_templates
    generate_env_file
    copy_policy
    replace_placeholders
    create_blueprint_metadata
    set_permissions

    # Print summary
    print_summary
}

# === Entry Point ===
parse_args "$@"
main
