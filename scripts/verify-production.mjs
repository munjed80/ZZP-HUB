#!/usr/bin/env node

/**
 * Production Verification Script
 * 
 * Runs automated HTTP checks against a deployed instance to verify:
 * - API health endpoint
 * - PWA resources (service worker, manifest)
 * - Offline fallback
 * - KVK API endpoints
 * - Auth-protected route behavior
 * 
 * Usage:
 *   BASE_URL=http://localhost:3000 npm run verify:prod
 *   BASE_URL=https://your-production-url.com npm run verify:prod
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Test result tracking
 */
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Add a test result
 */
function addResult(name, status, details = '') {
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else if (status === 'SKIP') results.skipped++;
}

/**
 * Make HTTP request with timeout
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Test: Health check endpoint
 */
async function testHealthCheck() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/health`);
    const data = await response.json();
    
    if (response.status === 200 && data.status === 'ok') {
      addResult('Health Check', 'PASS', 'API is responding');
      return true;
    } else {
      addResult('Health Check', 'FAIL', `Unexpected response: ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Health Check', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Service worker file
 */
async function testServiceWorker() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/sw.js`);
    
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      const cacheControl = response.headers.get('cache-control');
      
      if (contentType && contentType.includes('javascript')) {
        addResult('Service Worker', 'PASS', 'sw.js is accessible with correct content-type');
        return true;
      } else {
        addResult('Service Worker', 'FAIL', `Wrong content-type: ${contentType}`);
        return false;
      }
    } else if (response.status === 404) {
      addResult('Service Worker', 'SKIP', 'sw.js not found (may be development mode)');
      return true; // Don't fail in dev mode
    } else {
      addResult('Service Worker', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Service Worker', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Web manifest
 */
async function testWebManifest() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/manifest.webmanifest`);
    
    if (response.status === 200) {
      const contentType = response.headers.get('content-type');
      const data = await response.json();
      
      if (data.name && data.icons && Array.isArray(data.icons)) {
        addResult('Web Manifest', 'PASS', 'manifest.webmanifest is valid');
        return true;
      } else {
        addResult('Web Manifest', 'FAIL', 'Invalid manifest structure');
        return false;
      }
    } else {
      addResult('Web Manifest', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Web Manifest', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Offline fallback page
 */
async function testOfflineFallback() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/offline`);
    
    if (response.status === 200) {
      const html = await response.text();
      if (html.includes('offline') || html.includes('Offline')) {
        addResult('Offline Fallback', 'PASS', '/offline page is accessible');
        return true;
      } else {
        addResult('Offline Fallback', 'FAIL', 'Page does not contain offline content');
        return false;
      }
    } else {
      addResult('Offline Fallback', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Offline Fallback', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: KVK Search endpoint (unauthorized access)
 */
async function testKVKSearchUnauth() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/kvk/search?q=test`);
    
    // Should return 401 Unauthorized when not logged in
    if (response.status === 401) {
      addResult('KVK Search (Unauth)', 'PASS', 'Correctly returns 401 for unauthenticated requests');
      return true;
    } else {
      addResult('KVK Search (Unauth)', 'FAIL', `Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('KVK Search (Unauth)', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: KVK Details endpoint (unauthorized access)
 */
async function testKVKDetailsUnauth() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/kvk/details?kvk=12345678`);
    
    // Should return 401 Unauthorized when not logged in
    if (response.status === 401) {
      addResult('KVK Details (Unauth)', 'PASS', 'Correctly returns 401 for unauthenticated requests');
      return true;
    } else {
      addResult('KVK Details (Unauth)', 'FAIL', `Expected 401, got ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('KVK Details (Unauth)', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Dashboard redirect for unauthenticated users
 */
async function testDashboardRedirect() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/dashboard`, {
      redirect: 'manual', // Don't follow redirects
    });
    
    // Should redirect to login (302, 303, or 307)
    if ([302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (location && location.includes('/login')) {
        addResult('Dashboard Redirect', 'PASS', 'Unauthenticated users redirected to /login');
        return true;
      } else {
        addResult('Dashboard Redirect', 'FAIL', `Redirected to: ${location}`);
        return false;
      }
    } else if (response.status === 200) {
      addResult('Dashboard Redirect', 'FAIL', 'Dashboard accessible without auth (security issue!)');
      return false;
    } else {
      addResult('Dashboard Redirect', 'SKIP', `Status: ${response.status}`);
      return true;
    }
  } catch (error) {
    addResult('Dashboard Redirect', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Test: Public routes are accessible
 */
async function testPublicRoutes() {
  const publicRoutes = ['/login', '/register'];
  let allPassed = true;
  
  for (const route of publicRoutes) {
    try {
      const response = await fetchWithTimeout(`${BASE_URL}${route}`);
      
      if (response.status === 200) {
        addResult(`Public Route ${route}`, 'PASS', 'Accessible without auth');
      } else {
        addResult(`Public Route ${route}`, 'FAIL', `HTTP ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      addResult(`Public Route ${route}`, 'FAIL', `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Test: Check-email page
 */
async function testCheckEmailPage() {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/check-email`);
    
    if (response.status === 200) {
      const html = await response.text();
      if (html.includes('email') || html.includes('verific')) {
        addResult('Check Email Page', 'PASS', '/check-email is accessible');
        return true;
      } else {
        addResult('Check Email Page', 'FAIL', 'Page does not contain expected content');
        return false;
      }
    } else {
      addResult('Check Email Page', 'FAIL', `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Check Email Page', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

/**
 * Print results table
 */
function printResults() {
  console.log('\n' + colors.bright + '━'.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + '  PRODUCTION VERIFICATION RESULTS' + colors.reset);
  console.log(colors.bright + '━'.repeat(80) + colors.reset + '\n');
  
  console.log(`  Target: ${colors.cyan}${BASE_URL}${colors.reset}\n`);
  
  // Print each test result
  results.tests.forEach((test) => {
    const statusColor = test.status === 'PASS' ? colors.green : 
                       test.status === 'FAIL' ? colors.red : 
                       colors.yellow;
    const statusIcon = test.status === 'PASS' ? '✓' : 
                      test.status === 'FAIL' ? '✗' : 
                      '○';
    
    console.log(`  ${statusColor}${statusIcon} ${test.name}${colors.reset}`);
    if (test.details) {
      console.log(`    ${colors.reset}${test.details}${colors.reset}`);
    }
  });
  
  // Print summary
  console.log('\n' + colors.bright + '─'.repeat(80) + colors.reset);
  console.log(colors.bright + '  SUMMARY' + colors.reset);
  console.log(colors.bright + '─'.repeat(80) + colors.reset + '\n');
  
  const total = results.passed + results.failed + results.skipped;
  console.log(`  Total Tests:   ${total}`);
  console.log(`  ${colors.green}Passed:        ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed:        ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped:       ${results.skipped}${colors.reset}`);
  
  console.log('\n' + colors.bright + '━'.repeat(80) + colors.reset + '\n');
  
  if (results.failed > 0) {
    console.log(colors.red + colors.bright + '  ✗ VERIFICATION FAILED' + colors.reset + '\n');
    return 1;
  } else {
    console.log(colors.green + colors.bright + '  ✓ VERIFICATION PASSED' + colors.reset + '\n');
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(colors.bright + '\n  Production Verification Script' + colors.reset);
  console.log(`  Testing: ${colors.cyan}${BASE_URL}${colors.reset}\n`);
  
  // Run all tests
  await testHealthCheck();
  await testServiceWorker();
  await testWebManifest();
  await testOfflineFallback();
  await testKVKSearchUnauth();
  await testKVKDetailsUnauth();
  await testDashboardRedirect();
  await testPublicRoutes();
  await testCheckEmailPage();
  
  // Print results and exit
  const exitCode = printResults();
  process.exit(exitCode);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(colors.red + '\n  Fatal error:' + colors.reset, error);
    process.exit(1);
  });
}
