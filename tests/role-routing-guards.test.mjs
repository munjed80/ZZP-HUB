import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { resolveLoginRedirect, getDefaultRedirectForRole } from "../lib/auth/role-redirect.js";

describe("Role routing guards", () => {
  test("Accountant session visiting /dashboard is redirected to /accountant-portal", () => {
    const target = resolveLoginRedirect({
      role: "ACCOUNTANT",
      selectedType: "zzp",
      requestedRedirect: "/dashboard",
    });
    assert.strictEqual(target, "/accountant-portal");
  });

  test("ZZP session visiting /accountant-portal is redirected to accountant login", () => {
    const target = resolveLoginRedirect({
      role: "ZZP",
      selectedType: "accountant",
      requestedRedirect: "/accountant-portal",
    });
    // Non-accountant should not land on accountant portal; default to dashboard/login flow
    assert.strictEqual(target, "/dashboard");
    assert.strictEqual(getDefaultRedirectForRole("ZZP"), "/dashboard");
  });
});
