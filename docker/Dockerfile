# BizClaw Docker Image
# Built on OpenClaw base

FROM node:22-bookworm AS base

WORKDIR /app

# Copy built BizClaw
COPY build/ .

# Install production dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Create non-root user
RUN useradd -m -u 1000 bizclaw || true
USER 1000

ENV NODE_ENV=production

# Copy workspace defaults
COPY overlay/config/SOUL.md /home/bizclaw/.bizclaw/workspace/SOUL.md
COPY overlay/config/AGENTS.md /home/bizclaw/.bizclaw/workspace/AGENTS.md
COPY overlay/config/HEARTBEAT.md /home/bizclaw/.bizclaw/workspace/HEARTBEAT.md

EXPOSE 18789 18790

CMD ["node", "openclaw.mjs", "gateway", "--allow-unconfigured"]
