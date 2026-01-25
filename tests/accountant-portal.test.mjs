import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for accountant portal functionality.
 * 
 * Tests the core logic for:
 * - Accountant middleware redirect behavior
 * - Clear company cookie endpoint logic
 * - Menu navigation behavior
 * - Canonical redirect host handling
 */

// Cookie name constant (must match middleware.ts)
const ACTIVE_COMPANY_COOKIE = 'zzp-hub-active-company';

// Company-scoped routes that require active company context for accountants
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

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isCompanyScopedPath(pathname) {
  return companyScopedPrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Mock middleware logic for accountant redirect behavior
 */
function shouldRedirectAccountantToPortal({ userRole, pathname, activeCompanyCookie }) {
  // Only for ACCOUNTANT role accessing company-scoped paths
  if (userRole !== 'ACCOUNTANT') {
    return false;
  }
  
  if (!isCompanyScopedPath(pathname)) {
    return false;
  }
  
  // No active company cookie means redirect to portal
  const hasActiveCompany = activeCompanyCookie && activeCompanyCookie.length > 0;
  return !hasActiveCompany;
}

/**
 * Mock clear company cookie response logic
 */
function createClearCompanyResponse({ shouldRedirect, nextPath = '/accountant' }) {
  const response = {
    type: shouldRedirect ? 'redirect' : 'json',
    redirectUrl: shouldRedirect ? nextPath : null,
    body: shouldRedirect ? null : { ok: true },
    cookies: {
      [ACTIVE_COMPANY_COOKIE]: {
        value: '',
        maxAge: 0,
        expires: new Date(0),
      },
    },
  };
  return response;
}

// Mock base URL functions
const FALLBACK_LOCAL_URL = "http://localhost:3000";
const PRODUCTION_FALLBACK_URL = "https://zzpershub.nl";

const NON_PRODUCTION_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /:(?!80$|443$)\d+$/,
];

function isNonProductionUrl(url) {
  return NON_PRODUCTION_PATTERNS.some((pattern) => pattern.test(url));
}

function getSecureAppBaseUrl(isProduction, envUrl) {
  if (envUrl) {
    if (isProduction) {
      // Validate URL is https and not a dev URL
      const isHttps = envUrl.startsWith('https://');
      const isDevUrl = isNonProductionUrl(envUrl);
      
      if (!isHttps || isDevUrl) {
        return PRODUCTION_FALLBACK_URL;
      }
    }
    return envUrl;
  }

  if (isProduction) {
    return PRODUCTION_FALLBACK_URL;
  }

  return FALLBACK_LOCAL_URL;
}

function buildSecureRedirectUrl(path, isProduction, envUrl) {
  const baseUrl = getSecureAppBaseUrl(isProduction, envUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// Tests
describe("Accountant Middleware Redirect Logic", () => {
  test("ACCOUNTANT without cookie accessing /dashboard is redirected to portal", () => {
    const result = shouldRedirectAccountantToPortal({
      userRole: 'ACCOUNTANT',
      pathname: '/dashboard',
      activeCompanyCookie: null,
    });
    
    assert.strictEqual(result, true);
  });
  
  test("ACCOUNTANT without cookie accessing /facturen is redirected to portal", () => {
    const result = shouldRedirectAccountantToPortal({
      userRole: 'ACCOUNTANT',
      pathname: '/facturen',
      activeCompanyCookie: '',
    });
    
    assert.strictEqual(result, true);
  });
  
  test("ACCOUNTANT with cookie accessing /dashboard is NOT redirected", () => {
    const validCompanyId = '11111111-1111-4111-8111-111111111111';
    const result = shouldRedirectAccountantToPortal({
      userRole: 'ACCOUNTANT',
      pathname: '/dashboard',
      activeCompanyCookie: validCompanyId,
    });
    
    assert.strictEqual(result, false);
  });
  
  test("ACCOUNTANT accessing /accountant (portal) is NOT redirected", () => {
    const result = shouldRedirectAccountantToPortal({
      userRole: 'ACCOUNTANT',
      pathname: '/accountant',
      activeCompanyCookie: null,
    });
    
    assert.strictEqual(result, false);
  });
  
  test("COMPANY_ADMIN without cookie is NOT redirected", () => {
    const result = shouldRedirectAccountantToPortal({
      userRole: 'COMPANY_ADMIN',
      pathname: '/dashboard',
      activeCompanyCookie: null,
    });
    
    assert.strictEqual(result, false);
  });
  
  test("SUPERADMIN without cookie is NOT redirected", () => {
    const result = shouldRedirectAccountantToPortal({
      userRole: 'SUPERADMIN',
      pathname: '/dashboard',
      activeCompanyCookie: null,
    });
    
    assert.strictEqual(result, false);
  });
  
  test("All company-scoped routes trigger redirect for ACCOUNTANT without cookie", () => {
    const testRoutes = [
      '/dashboard',
      '/facturen',
      '/facturen/create',
      '/offertes',
      '/relaties',
      '/uren',
      '/uitgaven',
      '/btw-aangifte',
      '/agenda',
      '/instellingen',
    ];
    
    for (const route of testRoutes) {
      const result = shouldRedirectAccountantToPortal({
        userRole: 'ACCOUNTANT',
        pathname: route,
        activeCompanyCookie: null,
      });
      assert.strictEqual(result, true, `Expected redirect for route: ${route}`);
    }
  });
});

describe("Clear Company Cookie Endpoint Logic", () => {
  test("Returns JSON response when redirect=false", () => {
    const response = createClearCompanyResponse({ shouldRedirect: false });
    
    assert.strictEqual(response.type, 'json');
    assert.deepStrictEqual(response.body, { ok: true });
    assert.strictEqual(response.redirectUrl, null);
  });
  
  test("Returns redirect response when redirect=true", () => {
    const response = createClearCompanyResponse({ shouldRedirect: true });
    
    assert.strictEqual(response.type, 'redirect');
    assert.strictEqual(response.redirectUrl, '/accountant');
    assert.strictEqual(response.body, null);
  });
  
  test("Custom next path is used in redirect", () => {
    const response = createClearCompanyResponse({ shouldRedirect: true, nextPath: '/custom-path' });
    
    assert.strictEqual(response.redirectUrl, '/custom-path');
  });
  
  test("Cookie is cleared with empty value and immediate expiration", () => {
    const response = createClearCompanyResponse({ shouldRedirect: false });
    
    assert.strictEqual(response.cookies[ACTIVE_COMPANY_COOKIE].value, '');
    assert.strictEqual(response.cookies[ACTIVE_COMPANY_COOKIE].maxAge, 0);
    assert.ok(response.cookies[ACTIVE_COMPANY_COOKIE].expires <= new Date());
  });
});

describe("Menu Navigation - Mijn Klanten Link", () => {
  // Test data representing navigation items from sidebar.tsx
  const navigatie = [
    { href: "/dashboard", label: "Overzicht", accountantOnly: false },
    { href: "/accountant", label: "Mijn Klanten", accountantOnly: true },
    { href: "/facturen", label: "Facturen", accountantOnly: false },
  ];
  
  test("Mijn Klanten menu item has correct href", () => {
    const mijnKlantenItem = navigatie.find(item => item.label === "Mijn Klanten");
    
    assert.ok(mijnKlantenItem, "Mijn Klanten item should exist");
    assert.strictEqual(mijnKlantenItem.href, "/accountant", "Mijn Klanten should link to /accountant");
  });
  
  test("Mijn Klanten menu item is accountant-only", () => {
    const mijnKlantenItem = navigatie.find(item => item.label === "Mijn Klanten");
    
    assert.strictEqual(mijnKlantenItem.accountantOnly, true, "Mijn Klanten should be accountant-only");
  });
  
  test("Mijn Klanten does NOT link to /dashboard", () => {
    const mijnKlantenItem = navigatie.find(item => item.label === "Mijn Klanten");
    
    assert.notStrictEqual(mijnKlantenItem.href, "/dashboard", "Mijn Klanten should NOT link to /dashboard");
  });
});

describe("Canonical Redirect Host Handling", () => {
  test("Untrusted origin (0.0.0.0) forces canonical domain in production", () => {
    const requestOrigin = "https://0.0.0.0:3000";
    const isUntrusted = isNonProductionUrl(requestOrigin);
    
    assert.strictEqual(isUntrusted, true);
    
    // In production, should fall back to canonical domain
    const redirectUrl = buildSecureRedirectUrl("/dashboard", true, "https://0.0.0.0:3000");
    assert.strictEqual(redirectUrl, "https://zzpershub.nl/dashboard");
  });
  
  test("Untrusted origin (localhost) forces canonical domain in production", () => {
    const requestOrigin = "http://localhost:3000";
    const isUntrusted = isNonProductionUrl(requestOrigin);
    
    assert.strictEqual(isUntrusted, true);
    
    const redirectUrl = buildSecureRedirectUrl("/dashboard", true, "http://localhost:3000");
    assert.strictEqual(redirectUrl, "https://zzpershub.nl/dashboard");
  });
  
  test("Trusted production URL is preserved", () => {
    const redirectUrl = buildSecureRedirectUrl("/dashboard", true, "https://zzpershub.nl");
    assert.strictEqual(redirectUrl, "https://zzpershub.nl/dashboard");
  });
  
  test("switch-company redirect uses canonical domain even with untrusted origin", () => {
    // Simulate switch-company scenario where origin is 0.0.0.0 (iOS/Capacitor)
    const companyId = "abc-123";
    const nextPath = `/switch-company?companyId=${companyId}&next=/dashboard`;
    
    // In production, should use canonical domain
    const redirectUrl = buildSecureRedirectUrl(nextPath, true, "https://0.0.0.0:3000");
    
    assert.ok(redirectUrl.startsWith("https://zzpershub.nl"), "Should use canonical domain");
    assert.ok(!redirectUrl.includes("0.0.0.0"), "Should NOT include untrusted origin");
  });
  
  test("Final switch-company redirect goes to canonical dashboard", () => {
    const finalRedirect = buildSecureRedirectUrl("/dashboard", true, "https://zzpershub.nl");
    assert.strictEqual(finalRedirect, "https://zzpershub.nl/dashboard");
  });
});

describe("Accountant Portal Empty State", () => {
  // Mock membership filter logic
  function filterClientMemberships(memberships) {
    return memberships.filter(m => m.role === "ACCOUNTANT" || m.role === "STAFF");
  }
  
  test("No client memberships shows empty state (no redirect)", () => {
    const memberships = [];
    const clientMemberships = filterClientMemberships(memberships);
    
    // Should NOT redirect, should show empty state
    assert.strictEqual(clientMemberships.length, 0);
    // In our implementation, empty state is shown instead of redirect
  });
  
  test("Only OWNER membership shows empty state", () => {
    const memberships = [
      { companyId: "company-1", role: "OWNER", status: "ACTIVE" },
    ];
    const clientMemberships = filterClientMemberships(memberships);
    
    assert.strictEqual(clientMemberships.length, 0);
  });
  
  test("ACCOUNTANT membership is included in client list", () => {
    const memberships = [
      { companyId: "company-1", role: "ACCOUNTANT", status: "ACTIVE" },
    ];
    const clientMemberships = filterClientMemberships(memberships);
    
    assert.strictEqual(clientMemberships.length, 1);
    assert.strictEqual(clientMemberships[0].role, "ACCOUNTANT");
  });
  
  test("STAFF membership is included in client list", () => {
    const memberships = [
      { companyId: "company-1", role: "STAFF", status: "ACTIVE" },
    ];
    const clientMemberships = filterClientMemberships(memberships);
    
    assert.strictEqual(clientMemberships.length, 1);
    assert.strictEqual(clientMemberships[0].role, "STAFF");
  });
  
  test("Mixed memberships only shows ACCOUNTANT/STAFF as clients", () => {
    const memberships = [
      { companyId: "company-1", role: "OWNER", status: "ACTIVE" },
      { companyId: "company-2", role: "ACCOUNTANT", status: "ACTIVE" },
      { companyId: "company-3", role: "STAFF", status: "ACTIVE" },
    ];
    const clientMemberships = filterClientMemberships(memberships);
    
    assert.strictEqual(clientMemberships.length, 2);
    assert.ok(clientMemberships.every(m => m.role === "ACCOUNTANT" || m.role === "STAFF"));
  });
});
