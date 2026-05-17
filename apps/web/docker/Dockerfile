FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── deps ──────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
COPY packages/config/tailwind-config/package.json ./packages/config/tailwind-config/
RUN npm ci --ignore-scripts

# ── builder ───────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_TARGET=docker
RUN npx turbo build --filter=@unkora/web

# ── runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "apps/web/server.js"]
