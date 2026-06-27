# Security Notes

Findings from a full security audit (auth, RBAC, IDOR, XSS, CSRF, CORS, secrets, headers). Severity reflects production risk.

## Verified-good (no action needed)
- Passwords hashed with **argon2**; access tokens short-lived (15m); reset/verification tokens SHA-256 hashed at rest with expiry + single-use.
- **No IDOR** in core flows — orders, addresses, profiles, classifieds scope DB queries by authenticated `userId`. `passwordHash` stripped from all user DTOs.
- Admin routes guarded by `RolesGuard` + `@Roles`. Raw SQL uses Prisma parameterized tagged templates (no SQL-injection surface).
- `.env` / `.env.local` are gitignored and **not committed**; only placeholder `.env.example` values are tracked. JWT secret throws in prod if unset.
- No CSRF exposure — auth is Bearer-token in `Authorization` header, not cookies (`credentials:false`).

## Fixed in this pass
- **CORS wildcard** (`apps/api/src/main.ts`) — was `origin: true` + hardcoded `Access-Control-Allow-Origin: *`; now driven by the `CORS_ORIGINS` allowlist (reflect-any in dev, allowlist-only in prod). **Set `CORS_ORIGINS` in production.**
- **Internal error leakage** (`http-exception.filter.ts`) — non-HttpException (Prisma/runtime) errors now return a generic message; the real error is still logged.

## Open — prioritized

### HIGH
1. **Tokens in `localStorage`** (`apps/web/src/lib/api.ts`) — access + 7-day refresh token are XSS-exfiltratable. Recommended: move refresh token to an `httpOnly; Secure; SameSite=Strict` cookie, keep access token in memory. (Requires `credentials:true` + the CORS allowlist now in place.) Effort: L. *Architectural — needs sign-off.*
2. **reCAPTCHA built but never enforced** (`auth.module.ts` has `RecaptchaService`, no caller) — wire into login/register/forgot-password, or add account lockout after N failures. Effort: S.
3. **Refresh tokens stored in DB in plaintext** (`auth.service.ts` `saveRefreshToken`) — store a SHA-256 hash like reset/verification tokens already do. Effort: S. *Invalidates existing sessions on deploy — schedule it.*

### MEDIUM
4. **Regex HTML sanitizer is bypassable** (`components/ui/popup-renderer.tsx`) — replace with DOMPurify or render as text. Effort: S.
5. **Untyped `@Body() dto: any`** on classifieds + a few auth endpoints bypass `ValidationPipe` whitelist (mass-assignment risk) — add proper DTO classes. Effort: S.

### LOW
6. **No Content-Security-Policy on the web app** (`apps/web/next.config.js`) — add a CSP header for XSS containment. Effort: M.
7. **Admin email-preview** renders raw HTML (`dangerouslySetInnerHTML`) — self-XSS only; sandbox in an iframe. Effort: S.
8. **No env schema validation** (`app.module.ts`) — add a Joi/zod `validationSchema` so misconfigured prod fails fast at boot instead of running on dev defaults. Effort: M.
9. **Auth is opt-in per controller** (no global `JwtAuthGuard`) — a new controller is public unless a dev remembers the guard. Add a global guard + `@Public()` opt-out. Effort: M.

## Frontend role separation
- **Seller panel** (`apps/web/src/app/seller/layout.tsx`) guards only `isAuthenticated`, not seller status — exposes the seller **UI shell** (API data is `me/`-scoped server-side, so no data leaks). Note: there is **no `SELLER` value in the `UserRole` enum** — seller status = existence of a `Seller` record, so the client guard needs a seller flag (e.g. surfaced on the auth/me response), not a role string.
- **Recommerce seller** (`apps/web/src/app/recommerce/seller/dashboard`) has **no layout/guard at all** — add a `recommerce/seller/layout.tsx` auth guard.
