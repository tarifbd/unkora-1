import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Account routes are protected client-side by account/layout.tsx (Zustand
// hydration guard + refresh-token awareness). We deliberately do NOT gate
// them in middleware because the middleware only sees the access_token cookie
// and would incorrectly bounce users whose short-lived cookie has expired but
// whose refresh_token (in localStorage) is still valid.
const PROTECTED_ROUTES: string[] = [];
const GUEST_ALLOWED_ROUTES: string[] = [];
const ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  const isGuestAllowed = GUEST_ALLOWED_ROUTES.some((r) => pathname.startsWith(r));
  const isProtected = !isGuestAllowed && PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  // /admin/login must be excluded — otherwise unauthenticated visits loop:
  // /admin/login → no token → redirect /admin/login → repeat
  const isAdmin = pathname !== '/admin/login' && ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated admins to the dedicated admin login page
  if (isAdmin && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users away from customer-protected routes
  if (isProtected && !accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const fullPath = request.nextUrl.pathname + request.nextUrl.search;
    url.searchParams.set('redirect', fullPath);
    return NextResponse.redirect(url);
  }

  // Redirect non-admins away from admin routes
  if (isAdmin && accessToken && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Security headers on all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
