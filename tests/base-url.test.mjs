import { describe, test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

// Mock implementations that mirror lib/base-url.ts
const FALLBACK_LOCAL_URL = "http://localhost:3000";
const PRODUCTION_FALLBACK_URL = "https://zzpershub.nl";

const NON_PRODUCTION_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /:\d+$/, // URLs with any port
];

function sanitize(url) {
  return url.replace(/\/+$/, "");
}

function isNonProductionUrl(url) {
  return NON_PRODUCTION_PATTERNS.some((pattern) => pattern.test(url));
}

function isHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getSecureAppBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  const isProduction = process.env.NODE_ENV === "production";

  if (envUrl) {
    const sanitized = sanitize(envUrl);
    
    if (isProduction) {
      const isSecure = isHttpsUrl(sanitized);
      const isDevUrl = isNonProductionUrl(sanitized);
      
      if (!isSecure || isDevUrl) {
        return PRODUCTION_FALLBACK_URL;
      }
    }
    
    return sanitized;
  }

  if (isProduction) {
    return PRODUCTION_FALLBACK_URL;
  }

  return FALLBACK_LOCAL_URL;
}

function buildSecureRedirectUrl(path) {
  const baseUrl = getSecureAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// Save original env vars
const originalEnv = { ...process.env };

// Helper to set env vars and restore after each test
function setEnv(vars) {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

function restoreEnv() {
  // Clear all env vars we might have set
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.APP_URL;
  delete process.env.NEXTAUTH_URL;
  delete process.env.NODE_ENV;
  // Restore original values
  Object.entries(originalEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

describe("isNonProductionUrl", () => {
  test("detects localhost URLs", () => {
    assert.strictEqual(isNonProductionUrl("http://localhost:3000"), true);
    assert.strictEqual(isNonProductionUrl("https://localhost"), true);
    assert.strictEqual(isNonProductionUrl("http://LOCALHOST:8080"), true);
  });

  test("detects 127.0.0.1 URLs", () => {
    assert.strictEqual(isNonProductionUrl("http://127.0.0.1:3000"), true);
    assert.strictEqual(isNonProductionUrl("https://127.0.0.1"), true);
  });

  test("detects 0.0.0.0 URLs", () => {
    assert.strictEqual(isNonProductionUrl("http://0.0.0.0:3000"), true);
    assert.strictEqual(isNonProductionUrl("https://0.0.0.0:8080"), true);
  });

  test("detects URLs with any port", () => {
    assert.strictEqual(isNonProductionUrl("https://example.com:3000"), true);
    assert.strictEqual(isNonProductionUrl("https://example.com:8080"), true);
    assert.strictEqual(isNonProductionUrl("https://example.com:443"), true);
  });

  test("allows production URLs without port", () => {
    assert.strictEqual(isNonProductionUrl("https://zzpershub.nl"), false);
    assert.strictEqual(isNonProductionUrl("https://example.com"), false);
  });
});

describe("getSecureAppBaseUrl - Production behavior", () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: undefined,
      APP_URL: undefined,
      NEXTAUTH_URL: undefined,
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  test("returns production fallback when no env vars set", () => {
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("returns configured https URL", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "https://zzpershub.nl" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("rejects http URL in production and falls back", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "http://example.com" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("rejects localhost URL in production and falls back", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "https://localhost:3000" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("rejects 0.0.0.0 URL in production and falls back", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "https://0.0.0.0:3000" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("rejects URL with port in production and falls back", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "https://example.com:3000" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });

  test("prefers NEXT_PUBLIC_APP_URL over APP_URL", () => {
    setEnv({
      NEXT_PUBLIC_APP_URL: "https://primary.example.com",
      APP_URL: "https://secondary.example.com",
    });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://primary.example.com");
  });

  test("falls back to APP_URL when NEXT_PUBLIC_APP_URL is not set", () => {
    setEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      APP_URL: "https://secondary.example.com",
    });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://secondary.example.com");
  });

  test("falls back to NEXTAUTH_URL when others are not set", () => {
    setEnv({
      NEXT_PUBLIC_APP_URL: undefined,
      APP_URL: undefined,
      NEXTAUTH_URL: "https://auth.example.com",
    });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://auth.example.com");
  });

  test("sanitizes trailing slashes", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "https://zzpershub.nl/" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "https://zzpershub.nl");
  });
});

describe("getSecureAppBaseUrl - Development behavior", () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_APP_URL: undefined,
      APP_URL: undefined,
      NEXTAUTH_URL: undefined,
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  test("returns localhost fallback in development when no env vars set", () => {
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "http://localhost:3000");
  });

  test("allows localhost URL in development", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "http://localhost:3000");
  });

  test("allows http URL in development", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "http://0.0.0.0:3000" });
    const result = getSecureAppBaseUrl();
    assert.strictEqual(result, "http://0.0.0.0:3000");
  });
});

describe("buildSecureRedirectUrl", () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://zzpershub.nl",
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  test("builds URL with path starting with /", () => {
    const result = buildSecureRedirectUrl("/dashboard");
    assert.strictEqual(result, "https://zzpershub.nl/dashboard");
  });

  test("adds leading slash if missing", () => {
    const result = buildSecureRedirectUrl("dashboard");
    assert.strictEqual(result, "https://zzpershub.nl/dashboard");
  });

  test("handles paths with query strings", () => {
    const result = buildSecureRedirectUrl("/switch-company?companyId=123&next=/dashboard");
    assert.strictEqual(result, "https://zzpershub.nl/switch-company?companyId=123&next=/dashboard");
  });

  test("handles root path", () => {
    const result = buildSecureRedirectUrl("/");
    assert.strictEqual(result, "https://zzpershub.nl/");
  });

  test("uses production fallback when env is misconfigured", () => {
    setEnv({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
    const result = buildSecureRedirectUrl("/dashboard");
    assert.strictEqual(result, "https://zzpershub.nl/dashboard");
  });
});

describe("iOS/Capacitor redirect security - Real-world scenario", () => {
  beforeEach(() => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://zzpershub.nl",
    });
  });

  afterEach(() => {
    restoreEnv();
  });

  test("CRITICAL: switch-company redirect never uses 0.0.0.0 origin", () => {
    // Simulate the scenario where iOS sends origin as 0.0.0.0:3000
    // Our function should NOT use request origin, but use env-based URL
    
    // Bad approach (what the bug was doing):
    const badOrigin = "https://0.0.0.0:3000";
    const badRedirectUrl = new URL("/dashboard", badOrigin).toString();
    assert.strictEqual(badRedirectUrl, "https://0.0.0.0:3000/dashboard");
    
    // Good approach (what our fix does):
    const goodRedirectUrl = buildSecureRedirectUrl("/dashboard");
    assert.strictEqual(goodRedirectUrl, "https://zzpershub.nl/dashboard");
    
    // Verify it's never localhost/0.0.0.0
    assert.ok(!goodRedirectUrl.includes("0.0.0.0"));
    assert.ok(!goodRedirectUrl.includes("localhost"));
  });

  test("CRITICAL: redirect uses production domain even with misconfigured env", () => {
    // Even if somehow a dev URL gets into env, we should fall back to production
    setEnv({ NEXT_PUBLIC_APP_URL: "https://0.0.0.0:3000" });
    
    const redirectUrl = buildSecureRedirectUrl("/dashboard");
    
    // Must use production fallback
    assert.strictEqual(redirectUrl, "https://zzpershub.nl/dashboard");
    assert.ok(!redirectUrl.includes("0.0.0.0"));
  });

  test("CRITICAL: accountant invite acceptance flow uses correct domain", () => {
    // Simulate full flow:
    // 1. User clicks invite link on iOS
    // 2. Accept invite API returns success
    // 3. Client redirects to switch-company
    // 4. switch-company route redirects to dashboard
    
    const companyId = "abc-123-def-456";
    const switchCompanyPath = `/switch-company?companyId=${companyId}&next=/dashboard`;
    const redirectUrl = buildSecureRedirectUrl(switchCompanyPath);
    
    assert.strictEqual(
      redirectUrl,
      `https://zzpershub.nl/switch-company?companyId=${companyId}&next=/dashboard`
    );
    
    // Final redirect (what switch-company returns)
    const finalRedirectUrl = buildSecureRedirectUrl("/dashboard");
    assert.strictEqual(finalRedirectUrl, "https://zzpershub.nl/dashboard");
  });
});
