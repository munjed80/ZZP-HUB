import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getDefaultRedirectForRole } from "../lib/auth/role-redirect.js";

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
