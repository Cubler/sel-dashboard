# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/prod-server.mjs ./server/prod-server.mjs

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "server/prod-server.mjs"]
