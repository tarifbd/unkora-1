# Testing Guide

## Test stack
| Layer | Tool | Location |
|-------|------|----------|
| API unit/integration | Jest (`jest.config.ts`) | `apps/api/**/*.spec.ts` |
| Web E2E | Playwright (`@playwright/test`) | `apps/web/tests` / `*.spec.ts` |
| CI | GitHub Actions | `.github/workflows/ci.yml`, `quality.yml` |

## Running locally
```bash
# API unit tests (needs Postgres + Redis; use docker-compose.dev.yml)
npm run test                         # all workspaces via turbo
npm --workspace @unkora/api run test # API only
npm --workspace @unkora/api run test -- --watch

# Type + lint gates
npm run typecheck
npm run lint

# Web E2E (Playwright) — needs web (and API) running
cd apps/web
npx playwright install --with-deps chromium   # first time
npx playwright test
npx playwright test --ui                       # interactive
```

E2E expects `BASE_URL` (default `http://localhost:3000`) and, for admin-flow
specs, `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` (set as CI secrets, never commit).

## What CI runs on every push (ci.yml)
1. **lint + typecheck** (all workspaces, Prisma client generated)
2. **unit tests** against ephemeral Postgres 16 + Redis 7 services, with `prisma migrate deploy`
3. **build** (web + api)
4. **E2E**: boots the API (waits on `/api/v1/health`), builds + starts web, runs Playwright, uploads the report artifact

`quality.yml` adds a weekly `npm audit` and a Lighthouse run (perf/SEO/a11y).

## Critical business flows to keep covered
These are the revenue/auth paths — keep at least one happy-path + one error-case test each:
- **Auth**: register → login → refresh → logout; invalid credentials; expired token
- **Catalog**: product list + filter/sort/paginate; product detail; empty/error states
- **Cart → Checkout**: add to cart (guest + auth), update qty, place order, stock decrement, out-of-stock rejection
- **Payments**: each gateway verify-callback (amount match, idempotency)
- **Admin**: login + RBAC denial for non-admin; order status transition
- **Seller**: `me/`-scoped data isolation (a seller cannot read another seller's data)
- **Recommerce**: create/update classified ownership enforcement

## Coverage status & gaps
Test scaffolding exists but **coverage of the flows above is thin** — this is
the top testing gap before launch. Prioritize: auth, checkout/stock, and
RBAC/ownership isolation (the security-sensitive paths).

## Conventions
- Co-locate API specs next to the unit (`*.spec.ts`).
- Use a dedicated test database (`unkora_test`); never run tests against a real DB.
- Mock external gateways/SMS/email in unit tests; exercise them only in a sandboxed integration suite.
