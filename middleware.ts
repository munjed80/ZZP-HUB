import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { resolveAuthSecret } from '@/lib/auth/secret';
import { shouldLogAuth } from '@/lib/auth/logging';
import { safeNextUrl } from '@/lib/auth/safe-next';

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
  const loginPath = pathname.startsWith('/accountant-portal') ? '/login?type=accountant' : '/login';

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

  if (pathname.startsWith('/accountant-portal') && userRole !== 'ACCOUNTANT') {
    const loginUrl = new URL('/login?type=accountant', request.url);
    const defaultFallback = '/accountant-portal';
    const nextUrl = safeNextUrl(originalPath, defaultFallback);
    loginUrl.searchParams.set('next', nextUrl);
    logRedirect('REDIRECT_ACCOUNTANT_ONLY', { pathname, role: userRole });
    return NextResponse.redirect(loginUrl);
  }

  if (!pathname.startsWith('/accountant-portal') && userRole === 'ACCOUNTANT') {
    const portalUrl = new URL('/accountant-portal', request.url);
    logRedirect('REDIRECT_ACCOUNTANT_TO_PORTAL', { pathname });
    return NextResponse.redirect(portalUrl);
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
  ],
};
