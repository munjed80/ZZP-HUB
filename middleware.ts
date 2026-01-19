import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { resolveAuthSecret } from '@/lib/auth/secret';
import { shouldLogAuth } from '@/lib/auth/logging';
// Edge-safe accountant role helper (server-only variant lives in lib/auth/tenant.ts)
import { isAccountantRole } from '@/lib/utils';

// Cookie name for accountant sessions
// Note: This cookie is scoped to path="/accountant-portal" - it will ONLY be sent by the browser
// for requests to /accountant-portal/* routes. This prevents session confusion where accountants
// could accidentally access ZZP-only pages like /instellingen.
const ACCOUNTANT_SESSION_COOKIE = 'zzp-accountant-session';

// Routes that should be accessible even without email verification
const preVerificationRoutes = ['/check-email', '/verify-email', '/verify-required', '/resend-verification'];

// Protected route prefixes (app area only)
const protectedPrefixes = [
  '/dashboard',
  '/onboarding',
  '/setup',
  '/facturen',
  '/offertes',
  '/relaties',
  '/uren',
  '/uitgaven',
  '/btw-aangifte',
  '/agenda',
  '/instellingen',
  '/admin',
  '/accountant-portal',
];

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

// Routes that accountants can access when they have an accountant session cookie
// Note: Since the cookie is scoped to path="/accountant-portal", the browser will only send it
// for /accountant-portal/* routes. This list is kept for future reference and explicit documentation.
const accountantAllowedPrefixes = [
  '/accountant-portal',
];

const isAccountantAllowedPath = (pathname: string) =>
  accountantAllowedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

const authSecret = resolveAuthSecret();

const logRedirect = (event: string, details: Record<string, unknown>) => {
  if (shouldLogAuth) {
    console.log(`[MIDDLEWARE] ${event}`, {
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nextParam = `${pathname}${request.nextUrl.search}`;

  // Only guard protected app routes - early return for public routes
  // This prevents unnecessary session lookups on public pages
  if (!isProtectedPath(pathname)) {
    logRedirect('PUBLIC_ROUTE_ALLOWED', { pathname });
    return NextResponse.next();
  }

  // EDGE-COMPATIBLE: Check for accountant session cookie presence via request.cookies
  // 
  // IMPORTANT: The accountant session cookie is scoped to path="/accountant-portal", meaning:
  // - The browser will ONLY send this cookie for requests to /accountant-portal/* routes
  // - For all other routes (like /instellingen, /facturen, etc.), the cookie is NOT sent
  // - This prevents the bug where accountants could accidentally access ZZP-only pages
  // 
  // Deep validation (session lookup, expiry, permissions, tenant isolation) 
  // is done server-side in API routes and server components
  const accountantSessionCookie = request.cookies.get(ACCOUNTANT_SESSION_COOKIE)?.value;
  
  if (accountantSessionCookie) {
    // Log that we detected an accountant session cookie (structured log)
    // This should only happen for /accountant-portal/* routes due to cookie path scoping
    if (shouldLogAuth || process.env.SECURITY_DEBUG === 'true') {
      console.log('[MIDDLEWARE] ACCOUNTANT_SESSION_COOKIE_DETECTED', {
        timestamp: new Date().toISOString(),
        pathname,
      });
    }
    
    // Since the cookie is path-scoped, we should only see it for /accountant-portal/* routes
    // Allow access to accountant portal routes
    if (isAccountantAllowedPath(pathname)) {
      return NextResponse.next();
    }
    
    // If somehow the cookie is present for a non-accountant route (shouldn't happen due to path scoping),
    // redirect to accountant portal as a safety measure
    const accountantPortalUrl = new URL('/accountant-portal', request.url);
    return NextResponse.redirect(accountantPortalUrl);
  }
  
  if (!authSecret) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', nextParam);
    logRedirect('REDIRECT_LOGIN_NO_SECRET', { pathname });
    return NextResponse.redirect(loginUrl);
  }
  
  // Get the JWT token for regular NextAuth sessions
  let token = null;
  let tokenErrorReason: string | undefined;
  try {
    token = await getToken({ req: request, secret: authSecret });
  } catch (error) {
    tokenErrorReason = error instanceof Error ? error.message : 'unknown_error';
    logRedirect('TOKEN_READ_ERROR', {
      pathname,
      error: tokenErrorReason,
    });
  }
  const setupRoutes = ['/setup', '/onboarding'];

  // If not logged in, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', nextParam);
    logRedirect('REDIRECT_LOGIN_NO_TOKEN', { pathname, hasAuthSecret: Boolean(authSecret), tokenError: tokenErrorReason });
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string | undefined;

  if (isAccountantRole(userRole) && !isAccountantAllowedPath(pathname)) {
    const accountantPortalUrl = new URL('/accountant-portal', request.url);
    accountantPortalUrl.searchParams.set('next', nextParam);
    logRedirect('REDIRECT_ACCOUNTANT_PORTAL', { pathname, role: userRole });
    return NextResponse.redirect(accountantPortalUrl);
  }

  const emailVerified = Boolean(token.emailVerified);
  const onboardingCookie = request.cookies.get('zzp-hub-onboarding-completed')?.value === 'true';
  const onboardingCompleted = onboardingCookie || Boolean(token.onboardingCompleted);

  // If logged in but email not verified, redirect to verify-required
  // (except if already on a pre-verification route)
  // SUPERADMIN bypasses email verification to ensure immediate admin access
  const requiresVerification = userRole !== 'SUPERADMIN' && !emailVerified;
  if (requiresVerification && !preVerificationRoutes.includes(pathname)) {
    const verifyUrl = new URL('/verify-required', request.url);
    verifyUrl.searchParams.set('next', nextParam);
    logRedirect('REDIRECT_VERIFY_EMAIL', { pathname, role: userRole });
    return NextResponse.redirect(verifyUrl);
  }

  // If email verified but onboarding not completed, redirect to setup
  // (except if already on setup/onboarding route)
  const onSetupRoute = setupRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (emailVerified && !onboardingCompleted && !onSetupRoute) {
    const setupUrl = new URL('/setup', request.url);
    setupUrl.searchParams.set('next', nextParam);
    logRedirect('REDIRECT_SETUP', { pathname, role: userRole });
    return NextResponse.redirect(setupUrl);
  }

  logRedirect('ALLOW_ROUTE', {
    pathname,
    role: userRole,
    emailVerified,
    onboardingCompleted,
  });
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/setup/:path*',
    '/facturen/:path*',
    '/offertes/:path*',
    '/relaties/:path*',
    '/uren/:path*',
    '/uitgaven/:path*',
    '/btw-aangifte/:path*',
    '/agenda/:path*',
    '/instellingen/:path*',
    '/admin/:path*',
    '/accountant-portal/:path*',
  ],
};
