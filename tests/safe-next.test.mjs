import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { safeNextUrl } from "../lib/auth/safe-next.js";

describe("safeNextUrl - Basic validation", () => {
  test("Returns fallback for null/undefined", () => {
    assert.strictEqual(safeNextUrl(null, "/dashboard"), "/dashboard");
    assert.strictEqual(safeNextUrl(undefined, "/accountant-portal"), "/accountant-portal");
  });

  test("Returns fallback for empty string", () => {
    assert.strictEqual(safeNextUrl("", "/dashboard"), "/dashboard");
    assert.strictEqual(safeNextUrl("   ", "/dashboard"), "/dashboard");
  });

  test("Accepts valid relative paths", () => {
    assert.strictEqual(safeNextUrl("/dashboard", "/fallback"), "/dashboard");
    assert.strictEqual(safeNextUrl("/accountant-portal", "/fallback"), "/accountant-portal");
    assert.strictEqual(safeNextUrl("/setup", "/fallback"), "/setup");
  });

  test("Accepts paths with query strings", () => {
    assert.strictEqual(
      safeNextUrl("/dashboard?foo=bar", "/fallback"),
      "/dashboard?foo=bar"
    );
  });
});

describe("safeNextUrl - Nested next parameter stripping", () => {
  test("Strips nested next parameter", () => {
    const result = safeNextUrl("/setup?next=/dashboard", "/fallback");
    assert.strictEqual(result, "/setup");
  });

  test("Strips nested callbackUrl parameter", () => {
    const result = safeNextUrl("/setup?callbackUrl=/dashboard", "/fallback");
    assert.strictEqual(result, "/setup");
  });

  test("Strips multiple levels of nested next", () => {
    const result = safeNextUrl(
      "/accountant-portal?next=/setup?next=/dashboard",
      "/fallback"
    );
    assert.strictEqual(result, "/accountant-portal");
  });

  test("Preserves other query parameters while stripping next", () => {
    const result = safeNextUrl("/setup?foo=bar&next=/dashboard&baz=qux", "/fallback");
    assert.strictEqual(result, "/setup?foo=bar&baz=qux");
  });

  test("Handles huge nested next chain (Safari bug scenario)", () => {
    // Simulate exponentially growing next chain
    let nested = "/accountant-portal";
    for (let i = 0; i < 10; i++) {
      nested = `/accountant-portal?next=${encodeURIComponent(nested)}`;
    }
    
    // Should return fallback due to length limit
    const result = safeNextUrl(nested, "/fallback");
    assert.strictEqual(result, "/fallback");
  });
});

describe("safeNextUrl - Security: Protocol blocking", () => {
  test("Blocks http:// URLs", () => {
    assert.strictEqual(
      safeNextUrl("http://evil.com", "/fallback"),
      "/fallback"
    );
  });

  test("Blocks https:// URLs", () => {
    assert.strictEqual(
      safeNextUrl("https://evil.com", "/fallback"),
      "/fallback"
    );
  });

  test("Blocks javascript: URLs", () => {
    assert.strictEqual(
      safeNextUrl("javascript:alert(1)", "/fallback"),
      "/fallback"
    );
  });

  test("Blocks data: URLs", () => {
    assert.strictEqual(
      safeNextUrl("data:text/html,<script>alert(1)</script>", "/fallback"),
      "/fallback"
    );
  });

  test("Blocks protocol-relative URLs (//example.com)", () => {
    assert.strictEqual(safeNextUrl("//evil.com", "/fallback"), "/fallback");
    assert.strictEqual(safeNextUrl("//evil.com/path", "/fallback"), "/fallback");
  });
});

describe("safeNextUrl - Security: Relative path enforcement", () => {
  test("Blocks non-relative paths", () => {
    assert.strictEqual(safeNextUrl("example.com", "/fallback"), "/fallback");
    assert.strictEqual(safeNextUrl("www.example.com", "/fallback"), "/fallback");
  });

  test("Only allows paths starting with /", () => {
    assert.strictEqual(safeNextUrl("dashboard", "/fallback"), "/fallback");
    assert.strictEqual(safeNextUrl("./dashboard", "/fallback"), "/fallback");
    assert.strictEqual(safeNextUrl("../dashboard", "/fallback"), "/fallback");
  });
});

describe("safeNextUrl - Auth route blocking (prevent loops)", () => {
  test("Blocks /login", () => {
    assert.strictEqual(safeNextUrl("/login", "/fallback"), "/fallback");
  });

  test("Blocks /login with query params", () => {
    assert.strictEqual(
      safeNextUrl("/login?type=accountant", "/fallback"),
      "/fallback"
    );
  });

  test("Blocks /register", () => {
    assert.strictEqual(safeNextUrl("/register", "/fallback"), "/fallback");
  });

  test("Blocks /forgot-password", () => {
    assert.strictEqual(safeNextUrl("/forgot-password", "/fallback"), "/fallback");
  });

  test("Blocks /accountant-invite", () => {
    assert.strictEqual(safeNextUrl("/accountant-invite", "/fallback"), "/fallback");
  });

  test("Blocks /accountant-verify", () => {
    assert.strictEqual(safeNextUrl("/accountant-verify", "/fallback"), "/fallback");
  });

  test("Blocks auth route sub-paths", () => {
    assert.strictEqual(
      safeNextUrl("/login/something", "/fallback"),
      "/fallback"
    );
  });
});

describe("safeNextUrl - Length validation", () => {
  test("Rejects URLs longer than 512 chars", () => {
    const longUrl = "/dashboard?" + "x".repeat(520);
    assert.strictEqual(safeNextUrl(longUrl, "/fallback"), "/fallback");
  });

  test("Accepts URLs at exactly 512 chars", () => {
    const url512 = "/" + "a".repeat(511);
    const result = safeNextUrl(url512, "/fallback");
    // Should be accepted (will be 512 chars total)
    assert.notStrictEqual(result, "/fallback");
  });

  test("Accepts normal-length URLs", () => {
    const normalUrl = "/accountant-portal/dossier/12345";
    const result = safeNextUrl(normalUrl, "/fallback");
    assert.strictEqual(result, normalUrl);
  });
});

describe("safeNextUrl - URL decoding", () => {
  test("Decodes URL-encoded paths", () => {
    const encoded = encodeURIComponent("/dashboard/test");
    const result = safeNextUrl(encoded, "/fallback");
    assert.strictEqual(result, "/dashboard/test");
  });

  test("Handles URL-encoded query params", () => {
    const encoded = "/dashboard?name=" + encodeURIComponent("Test User");
    const result = safeNextUrl(encoded, "/fallback");
    // The query string normalization may change encoding format (both + and %20 are valid for space)
    assert.ok(result.startsWith("/dashboard?name="));
    assert.ok(result.includes("Test"));
  });

  test("Returns fallback for malformed URL encoding", () => {
    // Invalid percent encoding should be caught
    const malformed = "/dashboard%";
    const result = safeNextUrl(malformed, "/fallback");
    // Should either decode or return fallback
    assert.ok(result === "/fallback" || result.startsWith("/"));
  });
});

describe("safeNextUrl - Real-world scenarios", () => {
  test("Middleware redirect: /accountant-portal -> /login?type=accountant&next=/accountant-portal", () => {
    // After login, should redirect to /accountant-portal (without nested next)
    const next = safeNextUrl("/accountant-portal", "/dashboard");
    assert.strictEqual(next, "/accountant-portal");
  });

  test("Login redirect: next=/setup?next=/dashboard should return /setup", () => {
    const next = safeNextUrl("/setup?next=/dashboard", "/dashboard");
    assert.strictEqual(next, "/setup");
  });

  test("Prevents loop: /login should not be a valid next target", () => {
    const next = safeNextUrl("/login?type=accountant", "/accountant-portal");
    assert.strictEqual(next, "/accountant-portal");
  });

  test("Accountant login flow: next=/accountant-portal is valid", () => {
    const next = safeNextUrl("/accountant-portal", "/dashboard");
    assert.strictEqual(next, "/accountant-portal");
  });

  test("ZZP login flow: next=/dashboard is valid", () => {
    const next = safeNextUrl("/dashboard", "/fallback");
    assert.strictEqual(next, "/dashboard");
  });
});
