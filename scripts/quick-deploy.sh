#!/usr/bin/env bash
set -euo pipefail

# BizClaw Quick Deploy - One Command Setup
# Usage: curl -sSL https://raw.githubusercontent.com/caumangratani/BizClaw/main/scripts/quick-deploy.sh | bash -s -- --whatsapp +919999999999 --business "My Business"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
WHATSAPP=""
BUSINESS_NAME=""
PLAN="starter"
TEAM="starter"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --whatsapp)
      WHATSAPP="$2"
      shift 2
      ;;
    --business)
      BUSINESS_NAME="$2"
      shift 2
      ;;
    --plan)
      PLAN="$2"
      shift 2
      ;;
    --team)
      TEAM="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate required args
if [ -z "$WHATSAPP" ]; then
  echo -e "${RED}Error: --whatsapp is required${NC}"
  echo "Usage: curl -sSL https://bizclaw.ai/deploy | bash -s -- --whatsapp +919999999999 --business 'My Business'"
  exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   🚀 BizClaw Quick Deploy${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Detect OS
if [ "$(uname)" = "Darwin" ]; then
  OS="macos"
elif [ -f /etc/os-release ]; then
  . /etc/os-release
  OS="$ID"
else
  OS="unknown"
fi

echo -e "${YELLOW}Detected OS: $OS${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}Installing Docker...${NC}"
  if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    curl -fsSL https://get.docker.com | bash
  elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    curl -fsSL https://get.docker.com | bash
  fi
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"

# Generate random port
PORT=$((18790 + RANDOM % 100))
TOKEN=$(openssl rand -hex 16)

# Create client directory
CLIENT_DIR="/root/bizclaw-$(date +%s)"
mkdir -p "$CLIENT_DIR"

echo -e "${YELLOW}Creating BizClaw instance...${NC}"

# Create openclaw.json
cat > "$CLIENT_DIR/openclaw.json" <<EOF
{
  "channels": {
    "whatsapp": {
      "enabled": true,
      "dmPolicy": "allowlist",
      "allowFrom": ["$WHATSAPP"],
      "selfChatMode": true,
      "groupPolicy": "disabled"
    }
  },
  "gateway": {
    "port": $PORT,
    "mode": "local",
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "$TOKEN"
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto"
  }
}
EOF

# Pull and run OpenClaw
echo -e "${YELLOW}Starting BizClaw...${NC}"
docker run -d \
  --name bizclaw-$PORT \
  -p $PORT:8080 \
  -v "$CLIENT_DIR:/data" \
  -e OPENCLAW_CONFIG_PATH=/data/openclaw.json \
  openclawai/openclaw:latest

# Wait for startup
echo -e "${YELLOW}Waiting for startup...${NC}"
sleep 10

# Check if running
if docker ps | grep -q bizclaw-$PORT; then
  echo ""
  echo -e "${GREEN}======================================${NC}"
  echo -e "${GREEN}   ✅ BizClaw is Ready!${NC}"
  echo -e "${GREEN}======================================${NC}"
  echo ""
  echo -e "📱 WhatsApp: ${GREEN}$WHATSAPP${NC}"
  echo -e "🌐 URL: ${BLUE}http://$(hostname -I | awk '{print $1}'):${PORT}?token=${TOKEN}${NC}"
  echo ""
  echo -e "${YELLOW}Next Steps:${NC}"
  echo "1. Scan the QR code at the URL above"
  echo "2. Send a test message to verify"
  echo ""
  echo -e "📝 Save this info:"
  echo "   Port: $PORT"
  echo "   Token: $TOKEN"
else
  echo -e "${RED}Failed to start BizClaw. Check logs with: docker logs bizclaw-$PORT${NC}"
  exit 1
fi
