# BizClaw Production Docker Image
# Bizgenix AI Solutions Pvt. Ltd.
# Multi-tenant ready — one container per client

FROM node:22-bookworm AS base

WORKDIR /app

# Copy built BizClaw (OpenClaw + overlay merged by build.sh)
COPY build/ .

# Install production dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod 2>/dev/null || pnpm install --prod

# Install WhatsApp MCP for WhatsApp Web session management
RUN npm install -g whatsapp-mcp 2>/dev/null || true

# Create non-root user
RUN useradd -m -u 1000 bizclaw || true

# Create persistent data directories
RUN mkdir -p /data/workspace /data/backups /data/credentials \
    && chown -R 1000:1000 /data

# Copy overlay (skills, plugin, soul defaults)
COPY overlay/ /app/overlay/

# Copy workspace defaults (used if client doesn't have custom ones)
COPY overlay/soul/SOUL.md /data/workspace/SOUL.md
COPY clients/TEMPLATE/AGENTS.md /data/workspace/AGENTS.md

# Fix permissions
RUN chown -R 1000:1000 /app /data

USER 1000

# Environment defaults (overridden per-client via .env)
ENV NODE_ENV=production
ENV OPENCLAW_STATE_DIR=/data
ENV OPENCLAW_CONFIG_PATH=/data/openclaw.json
ENV OPENCLAW_WORKSPACE_DIR=/data/workspace
ENV OPENCLAW_GATEWAY_PORT=18789

# Health check — verify gateway is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.OPENCLAW_GATEWAY_PORT || '18789') + '/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 18789

CMD ["node", "openclaw.mjs", "gateway", "--allow-unconfigured", "--bind", "lan", "--port", "18789"]
