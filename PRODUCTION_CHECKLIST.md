# Production Readiness Checklist

Status legend: ✅ done · ⚠️ partial · ❌ open · 🔒 needs a decision/credentials

## Build & Quality Gates
- ✅ `turbo build` succeeds (web + api)
- ✅ `typecheck` passes (web + api)
- ⚠️ Lint passes but ~162 `any`/`ts-ignore` escape hatches remain (web)
- ⚠️ Tests exist (Jest api, Playwright e2e) but coverage of critical business flows is thin

## Database
- ❌ **CRITICAL: schema drift** — 6 models (`ChatSession`, `ChatMessage`, `RagDocument`, `RagDocumentChunk`, `VirtualTryOnSession`, `PredictionReport`) have **no migration**; `prisma migrate deploy` won't create them → runtime "relation does not exist". Run `prisma migrate dev` locally, commit the migration. 🔒 *needs DB access + approval*
- ⚠️ Add indexes: `Order(createdAt)`, `Order(paymentStatus)`, `Coupon(isActive, expiresAt)`, `Wishlist(productId)`, `Review(userId)`
- ⚠️ Oversell risk — stock decrement is read-then-write without a row lock; use conditional `updateMany {where:{stockQuantity:{gte:qty}}}`
- ⚠️ A few money fields use `Float` (Affiliate/AffiliatePayout/Currency.rate) — convert to `Decimal`
- ❌ No automated backups / PITR / restore runbook 🔒 *infra decision*

## Security (see SECURITY_NOTES.md)
- ✅ CORS now allowlist-driven (set `CORS_ORIGINS` in prod)
- ✅ Internal error messages no longer leak to clients
- ❌ Refresh + access tokens in `localStorage` (XSS risk) 🔒 *architectural sign-off*
- ❌ reCAPTCHA not enforced on auth endpoints
- ❌ Refresh tokens stored in DB in plaintext
- ❌ No CSP header on web app

## API
- ✅ Health check `GET /api/v1/health` (DB probe)
- ✅ Global validation, exception filter, response envelope, throttling
- ⚠️ No env schema validation (boots on dev defaults if misconfigured)
- ⚠️ No global `JwtAuthGuard` (new routes public unless guarded)
- ⚠️ Payment webhook not strictly idempotent / no signature verification

## Frontend & SEO
- ✅ Sitemap/robots present; **fixed** broken `/api/v1/v1` API base (was emptying the sitemap)
- ✅ Root metadata + OG/Twitter; product/category `generateMetadata`
- ❌ No JSON-LD structured data (Product/Offer/Organization) — hurts rich results
- ❌ No canonical URLs / `alternates` (duplicate-content risk on filtered listings)
- ⚠️ Home + listing pages are `'use client'` with no server metadata (LCP/SEO)
- ⚠️ ~29 raw `<img>` tags bypass `next/image`; some missing `alt`
- ⚠️ Products listing lacks error/empty states

## Frontend Role Separation
- ❌ Seller layout guards auth but not seller status (UI-shell exposure)
- ❌ Recommerce seller dashboard has no guard at all

## DevOps / Deploy
- ✅ Multi-stage Dockerfiles, non-root, HEALTHCHECK; CI runs lint/typecheck/test/build/e2e
- 🔒 **Four overlapping web deploy targets** (Vercel, Netlify, Cloudflare, VPS) with divergent Node versions — **pick one**
- ⚠️ Duplicate API Dockerfiles (`apps/api/Dockerfile` vs `apps/api/docker/Dockerfile`) drift risk
- ⚠️ `deploy.yml` ships after typecheck only (no lint/test/build gate); deploys `:latest` (no atomic tag / rollback)
- ⚠️ Migrations auto-run on container start (race under multi-replica) — move to a one-shot job
- ❌ No error tracking (Sentry) / structured logging 🔒 *signup/credentials*
- ✅ Added: root `README.md`, `packages/database/.env.example`

## Pre-Deploy Gate (must be green)
1. Generate + commit the missing Prisma migration; `migrate status` clean
2. Set all prod env vars (`CORS_ORIGINS`, JWT secrets, DB/Redis URLs, gateway keys)
3. Choose a single web host; remove the other deploy configs
4. Enable managed-DB backups
5. Add error tracking (Sentry) + uptime monitor
6. Smoke-test: health, login, product list, add-to-cart, checkout, admin login
