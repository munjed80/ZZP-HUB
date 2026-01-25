import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { resolveAuthSecret } from '@/lib/auth/secret';
import { shouldLogAuth } from '@/lib/auth/logging';
import { safeNextUrl } from '@/lib/auth/safe-next';

// Cookie name for active company (must match lib/auth/company-context.ts)
const ACTIVE_COMPANY_COOKIE = 'zzp-hub-active-company';

// UUID v4 validation regex for company ID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID v4
 */
function isValidUUID(value: string | undefined): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

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
  '/accountant',
];

// Company-scoped routes - these require an active company context for accountants
const companyScopedPrefixes = [
  '/dashboard',
  '/facturen',
  '/offertes',
  '/relaties',
  '/uren',
  '/uitgaven',
  '/btw-aangifte',
  '/agenda',
  '/instellingen',
];

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

const isCompanyScopedPath = (pathname: string) =>
  companyScopedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

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
  // Construct the next parameter from the original request path (pathname + search)
  // IMPORTANT: Do NOT read from an existing 'next' param to avoid nested next wrapping
  const originalPath = `${pathname}${request.nextUrl.search}`;

  // Only guard protected app routes - early return for public routes
  // This prevents unnecessary session lookups on public pages
  if (!isProtectedPath(pathname)) {
    logRedirect('PUBLIC_ROUTE_ALLOWED', { pathname });
    return NextResponse.next();
  }
  
  if (!authSecret) {
    const loginUrl = new URL('/login', request.url);
    // Use safeNextUrl to prevent nested next parameters and validate the path
    const defaultFallback = '/dashboard';
    const nextUrl = safeNextUrl(originalPath, defaultFallback);
    loginUrl.searchParams.set('next', nextUrl);
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
  const loginPath = '/login';

  if (!token) {
    const loginUrl = new URL(loginPath, request.url);
    // Use safeNextUrl to prevent nested next parameters and validate the path
    const defaultFallback = '/dashboard';
    const nextUrl = safeNextUrl(originalPath, defaultFallback);
    loginUrl.searchParams.set('next', nextUrl);
    logRedirect('REDIRECT_LOGIN_NO_TOKEN', { pathname, hasAuthSecret: Boolean(authSecret), tokenError: tokenErrorReason });
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string | undefined;

  const emailVerified = Boolean(token.emailVerified);
  const onboardingCookie = request.cookies.get('zzp-hub-onboarding-completed')?.value === 'true';
  const onboardingCompleted = onboardingCookie || Boolean(token.onboardingCompleted);

  // If logged in but email not verified, redirect to verify-required
  // (except if already on a pre-verification route)
  // SUPERADMIN bypasses email verification to ensure immediate admin access
  const requiresVerification = userRole !== 'SUPERADMIN' && !emailVerified;
  if (requiresVerification && !preVerificationRoutes.includes(pathname)) {
    const verifyUrl = new URL('/verify-required', request.url);
    // Use safeNextUrl to prevent nested next parameters and validate the path
    const defaultFallback = '/dashboard';
    const nextUrl = safeNextUrl(originalPath, defaultFallback);
    verifyUrl.searchParams.set('next', nextUrl);
    logRedirect('REDIRECT_VERIFY_EMAIL', { pathname, role: userRole });
    return NextResponse.redirect(verifyUrl);
  }

  // If email verified but onboarding not completed, redirect to setup
  // (except if already on setup/onboarding route)
  const onSetupRoute = setupRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (emailVerified && !onboardingCompleted && !onSetupRoute) {
    const setupUrl = new URL('/setup', request.url);
    // Use safeNextUrl to prevent nested next parameters and validate the path
    const defaultFallback = '/dashboard';
    const nextUrl = safeNextUrl(originalPath, defaultFallback);
    setupUrl.searchParams.set('next', nextUrl);
    logRedirect('REDIRECT_SETUP', { pathname, role: userRole });
    return NextResponse.redirect(setupUrl);
  }

  // For ACCOUNTANT role users: if accessing company-scoped pages without a valid active company cookie,
  // redirect them to the accountant portal to select a client
  // This ensures accountants always have an explicit company context before accessing data
  if (userRole === 'ACCOUNTANT' && isCompanyScopedPath(pathname)) {
    const activeCompanyCookie = request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value;
    // Validate cookie value is a proper UUID, not just non-empty
    const hasValidActiveCompany = isValidUUID(activeCompanyCookie);
    
    if (!hasValidActiveCompany) {
      const accountantUrl = new URL('/accountant', request.url);
      logRedirect('REDIRECT_ACCOUNTANT_NO_CONTEXT', { 
        pathname, 
        role: userRole,
        reason: activeCompanyCookie ? 'Invalid company ID format' : 'No active company cookie set'
      });
      return NextResponse.redirect(accountantUrl);
    }
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
    '/accountant/:path*',
  ],
};
