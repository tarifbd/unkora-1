# UNKORA

A full-stack e-commerce + marketplace platform for Bangladesh (books, electronics, handicrafts, recommerce/resale, and more) with a storefront, customer account area, seller panel, and a large admin console.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + npm workspaces (Node ≥ 22, `npm@10.9.2`) |
| Web | Next.js 15 (App Router), React 19, TanStack Query v5, Zustand, Tailwind CSS, next-intl |
| API | NestJS 11 on Fastify, Passport JWT, class-validator, Throttler |
| Database | PostgreSQL via Prisma ORM |
| Cache | Redis (cache-manager) |
| Auth | JWT access (15m) + rotating refresh tokens, argon2 password hashing, social + phone-OTP login |

## Repository Layout

```
apps/
  web/        Next.js storefront + customer/seller/admin panels
  api/        NestJS REST API (prefix /api/v1)
packages/
  database/   Prisma schema, migrations, seed
  types/      Shared TypeScript types
  ui/         Shared UI components
  config/     Shared eslint / tsconfig / tailwind configs
```

## Quick Start (Local Development)

Prerequisites: Node ≥ 22, npm 10, PostgreSQL, Redis (or use `docker-compose.dev.yml`).

```bash
# 1. Install
npm install

# 2. Configure environment (copy and fill each example)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp packages/database/.env.example packages/database/.env

# 3. Database: generate client, apply migrations, seed
npm run db:generate
npm run db:migrate
npm --workspace @unkora/database run db:seed   # optional demo data

# 4. Run everything
npm run dev          # turbo dev — web on :3000, api on :4000
```

Web: http://localhost:3000 · API: http://localhost:4000/api/v1 · Swagger (dev): http://localhost:4000/api/docs

## Common Scripts (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Run web + api in watch mode (turbo) |
| `npm run build` | Production build of all apps/packages |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Type-check all workspaces |
| `npm run test` | Run unit tests |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate` (dev) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run format` | Prettier write |

## Environment Variables

Each app documents its required vars in its own `.env.example`:

- Root `.env.example` — shared/infra vars (e.g. `CORS_ORIGINS`)
- `apps/api/.env.example` — `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, payment-gateway keys, `CORS_ORIGINS`, `SITE_URL`
- `apps/web/.env.example` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, analytics IDs
- `packages/database/.env.example` — `DATABASE_URL` (for Prisma CLI)

> **Production note:** set `CORS_ORIGINS` to your real web origin(s), comma-separated. The API restricts cross-origin requests to this allowlist in production.

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) and [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full guide. In short: web → Vercel, API → Docker on a VPS / Railway, database → managed Postgres (Neon). Migrations are applied with `prisma migrate deploy`.

Health check: `GET /api/v1/health`.

## License

Private / proprietary.
