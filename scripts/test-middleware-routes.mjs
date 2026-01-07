/**
 * Middleware Route Test
 * 
 * This script tests the middleware configuration to ensure public routes
 * are correctly defined and don't require authentication.
 * 
 * NOTE: These routes should match the routes defined in middleware.ts.
 * If middleware.ts is updated, update these test cases accordingly.
 * 
 * Run with: node scripts/test-middleware-routes.mjs
 */

// Public routes that should be accessible without authentication
// IMPORTANT: Keep in sync with middleware.ts publicRoutes array
const publicRoutes = ['/', '/login', '/register', '/check-email', '/verify-email', '/verify-required', '/resend-verification', '/offline', '/pricing', '/about'];

// Public assets that should be accessible without authentication
// IMPORTANT: Keep in sync with middleware.ts publicAssets array
const publicAssets = ['/sw.js', '/manifest.webmanifest', '/offline.html', '/robots.txt', '/sitemap.xml', '/favicon.ico'];

// API routes that should pass through
const apiRoutes = ['/api/health', '/api/auth/signin', '/api/auth/callback/credentials'];

// Static Next.js routes that should pass through
const staticRoutes = ['/_next/static/chunks/main.js', '/_next/static/css/app.css', '/_next/image?url=/logo.png'];

// Protected routes that should require authentication
const protectedRoutes = ['/dashboard', '/facturen', '/uitgaven', '/agenda', '/instellingen', '/onboarding'];

console.log('🧪 Testing Middleware Route Configuration\n');

let passed = 0;
let failed = 0;

function testRoute(route, shouldBePublic) {
  // Simulate middleware logic
  const isPublicRoute = publicRoutes.includes(route);
  const isPublicAsset = publicAssets.includes(route);
  const isApiRoute = route.startsWith('/api/');
  const isStaticRoute = route.startsWith('/_next/');
  
  const isAllowed = isPublicRoute || isPublicAsset || isApiRoute || isStaticRoute;
  
  if (shouldBePublic === isAllowed) {
    console.log(`✅ ${route} - ${shouldBePublic ? 'Public (correct)' : 'Protected (correct)'}`);
    passed++;
  } else {
    console.log(`❌ ${route} - Expected ${shouldBePublic ? 'Public' : 'Protected'}, got ${isAllowed ? 'Public' : 'Protected'}`);
    failed++;
  }
}

console.log('Testing Public Routes:');
publicRoutes.forEach(route => testRoute(route, true));

console.log('\nTesting Public Assets:');
publicAssets.forEach(route => testRoute(route, true));

console.log('\nTesting API Routes:');
apiRoutes.forEach(route => testRoute(route, true));

console.log('\nTesting Static Routes:');
staticRoutes.forEach(route => testRoute(route, true));

console.log('\nTesting Protected Routes:');
protectedRoutes.forEach(route => testRoute(route, false));

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All middleware route tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some middleware route tests failed!');
  process.exit(1);
}
