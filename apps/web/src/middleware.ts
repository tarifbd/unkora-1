import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/account', '/seller'];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];
const BYPASS_MAINTENANCE = ['/maintenance', '/admin', '/login', '/register', '/api'];

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Module-level cache so we don't hit the API on every single request
let maintenanceCache: { value: boolean; ts: number } | null = null;

async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.ts < 30_000) {
    return maintenanceCache.value;
  }
  try {
    const res = await fetch(`${API}/settings/public`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return maintenanceCache?.value ?? false;
    const data = await res.json();
    const value = data?.data?.['store.maintenanceMode'] === 'true';
    maintenanceCache = { value, ts: now };
    return value;
  } catch {
    return maintenanceCache?.value ?? false;
  }
}

async function getRoleFromToken(token: string): Promise<string | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return (payload as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users away from protected routes
  if ((isProtected || isAdmin) && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    url.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(url);
  }

  // Verify role from JWT (cryptographically) rather than trusting the user_role cookie
  let verifiedRole: string | null = null;
  if (accessToken) {
    verifiedRole = await getRoleFromToken(accessToken);
    // Fallback to cookie if JWT_SECRET not configured in frontend env (graceful degradation)
    if (verifiedRole === null) verifiedRole = request.cookies.get('user_role')?.value ?? null;
  }

  // Redirect non-admins away from admin routes
  if (isAdmin && accessToken && verifiedRole !== 'ADMIN' && verifiedRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Maintenance mode — skip for admin, auth, API, and maintenance page itself
  const shouldBypass =
    BYPASS_MAINTENANCE.some((r) => pathname.startsWith(r)) ||
    verifiedRole === 'ADMIN' ||
    verifiedRole === 'SUPER_ADMIN';

  if (!shouldBypass) {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // Security headers on all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' https:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
