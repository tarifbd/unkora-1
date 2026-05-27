# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ packages/
COPY apps/api/ apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @unkora/database exec prisma generate

# Build API
RUN pnpm --filter @unkora/api build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ packages/
COPY apps/api/ apps/api/

RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter @unkora/database exec prisma generate

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/main.js"]
