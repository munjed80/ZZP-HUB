import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that should be accessible even without email verification
const preVerificationRoutes = ['/check-email', '/verify-email', '/verify-required', '/resend-verification'];

// Protected route prefixes (app area only)
const protectedPrefixes = [
  '/dashboard',
  '/onboarding',
  '/facturen',
  '/offertes',
  '/relaties',
  '/uren',
  '/uitgaven',
  '/btw-aangifte',
  '/agenda',
  '/instellingen',
  '/admin',
];

const isProtectedPath = (pathname: string) =>
  protectedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard protected app routes
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // Get the JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const emailVerified = Boolean(token?.emailVerified);
  const onboardingCompleted = Boolean(token?.onboardingCompleted);
  const role = token?.role as string | undefined;

  // If not logged in, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in but email not verified, redirect to verify-required
  // (except if already on a pre-verification route)
  // SUPERADMIN bypasses email verification to ensure immediate admin access
  const requiresVerification = role !== 'SUPERADMIN' && !emailVerified;
  if (requiresVerification && !preVerificationRoutes.includes(pathname)) {
    const verifyUrl = new URL('/verify-required', request.url);
    verifyUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(verifyUrl);
  }

  // If email verified but onboarding not completed, redirect to onboarding
  // (except if already on onboarding route)
  if (emailVerified && !onboardingCompleted && !pathname.startsWith('/onboarding')) {
    const onboardingUrl = new URL('/onboarding', request.url);
    onboardingUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
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
