FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# =========================
# Dependencies
# =========================
FROM base AS deps

COPY package.json package-lock.json turbo.json ./

COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/config/tsconfig/package.json ./packages/config/tsconfig/
COPY packages/config/eslint-config/package.json ./packages/config/eslint-config/
COPY packages/config/tailwind-config/package.json ./packages/config/tailwind-config/
COPY packages/ui/package.json ./packages/ui/

RUN npm ci --ignore-scripts

# =========================
# Builder
# =========================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npx turbo build --filter=@unkora/api

# =========================
# Runner
# =========================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/prisma ./prisma

COPY --chown=nestjs:nodejs apps/api/docker/start.sh ./start.sh

RUN chmod +x ./start.sh

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["./start.sh"]