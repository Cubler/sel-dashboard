# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ───────────────────────────────────────────────────────────
# Nitro bundles everything into .output — no node_modules needed at runtime
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "./.output/server/index.mjs"]
