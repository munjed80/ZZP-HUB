import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getDefaultRedirectForRole, resolveLoginRedirect } from "../lib/auth/role-redirect.js";

describe("Auth redirect by role", () => {
  test("ZZP/Company Admin go to dashboard", () => {
    assert.strictEqual(getDefaultRedirectForRole("ZZP"), "/dashboard");
    assert.strictEqual(getDefaultRedirectForRole("COMPANY_ADMIN"), "/dashboard");
  });

  test("Accountant roles go to accountant portal", () => {
    assert.strictEqual(getDefaultRedirectForRole("ACCOUNTANT"), "/accountant-portal");
    assert.strictEqual(getDefaultRedirectForRole("ACCOUNTANT_VIEW"), "/accountant-portal");
    assert.strictEqual(getDefaultRedirectForRole("ACCOUNTANT_EDIT"), "/accountant-portal");
  });

  test("Superadmin goes to admin", () => {
    assert.strictEqual(getDefaultRedirectForRole("SUPERADMIN"), "/admin");
  });

  test("Unknown roles default to dashboard", () => {
    assert.strictEqual(getDefaultRedirectForRole(undefined), "/dashboard");
    assert.strictEqual(getDefaultRedirectForRole(null), "/dashboard");
    assert.strictEqual(getDefaultRedirectForRole(""), "/dashboard");
  });
});

describe("Login redirect safety", () => {
  test("Accountant role goes to accountant portal even when ZZP type selected", () => {
    const target = resolveLoginRedirect({
      role: "ACCOUNTANT",
      selectedType: "zzp",
      requestedRedirect: "/dashboard",
    });
    assert.strictEqual(target, "/accountant-portal");
  });

  test("Non-accountant selecting accountant type is routed to dashboard", () => {
    const target = resolveLoginRedirect({
      role: "ZZP",
      selectedType: "accountant",
      requestedRedirect: "/accountant-portal",
    });
    assert.strictEqual(target, "/dashboard");
  });

  test("Keeps safe redirect when no requested redirect is provided", () => {
    const target = resolveLoginRedirect({
      role: "ACCOUNTANT_EDIT",
      selectedType: "accountant",
      requestedRedirect: undefined,
    });
    assert.strictEqual(target, "/accountant-portal");
  });

  test("Superadmin stays on admin even if accountant type is selected", () => {
    const target = resolveLoginRedirect({
      role: "SUPERADMIN",
      selectedType: "accountant",
      requestedRedirect: "/accountant-portal",
    });
    assert.strictEqual(target, "/admin");
  });
});
