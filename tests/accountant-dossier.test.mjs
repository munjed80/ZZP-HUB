import { describe, test } from "node:test";
import assert from "node:assert/strict";

function canViewDossier(access) {
  return access?.status === "ACTIVE";
}

function dossierEmptyState(summary) {
  return summary.invoicesCount === 0 && summary.expensesCount === 0;
}

describe("Accountant dossier access and empty-state", () => {
  test("returns 403-equivalent when no access", () => {
    assert.strictEqual(canViewDossier(null), false);
    assert.strictEqual(canViewDossier({ status: "REVOKED" }), false);
  });

  test("shows empty state when access exists but no data", () => {
    const summary = { invoicesCount: 0, expensesCount: 0 };
    assert.strictEqual(dossierEmptyState(summary), true);
  });
});
