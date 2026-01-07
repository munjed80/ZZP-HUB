import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/check-email', '/verify-email', '/verify-required', '/resend-verification', '/offline', '/pricing', '/about'];

// Define public assets that should be accessible without authentication
const publicAssets = ['/sw.js', '/manifest.webmanifest', '/offline.html', '/robots.txt', '/sitemap.xml', '/favicon.ico'];

// Define routes that should be accessible even without email verification
const preVerificationRoutes = ['/check-email', '/verify-email', '/verify-required', '/resend-verification'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes, public assets, and API routes
  if (publicRoutes.includes(pathname) || publicAssets.includes(pathname) || pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return NextResponse.next();
  }

  // Get the JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // If not logged in, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in but email not verified, redirect to verify-required
  // (except if already on a pre-verification route)
  if (!token.emailVerified && !preVerificationRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/verify-required', request.url));
  }

  // If email verified but onboarding not completed, redirect to onboarding
  // (except if already on onboarding route)
  if (token.emailVerified && !token.onboardingCompleted && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
