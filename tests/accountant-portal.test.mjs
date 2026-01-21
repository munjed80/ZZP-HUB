import { describe, test } from "node:test";
import assert from "node:assert/strict";

function canAccessDashboard(role) {
  return role !== "ACCOUNTANT";
}

function canAccessPortal(role) {
  return role === "ACCOUNTANT";
}

describe("Accountant role routing", () => {
  test("Accountant cannot access /dashboard", () => {
    assert.strictEqual(canAccessDashboard("ACCOUNTANT"), false);
  });

  test("ZZP cannot access /accountant-portal", () => {
    assert.strictEqual(canAccessPortal("ZZP"), false);
  });
});
