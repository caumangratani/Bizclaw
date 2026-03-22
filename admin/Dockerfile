# Admin Panel Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY admin/package*.json ./
RUN npm ci --production

COPY admin/ ./
COPY overlay/ /app/overlay/
COPY clients/ /clients/

ENV NODE_ENV=production
ENV ADMIN_PORT=18800

EXPOSE 18800

CMD ["node", "server.js"]
