import { describe, test } from "node:test";
import assert from "node:assert/strict";
// Use the built TypeScript source directly; Node ESM resolver supports .ts via ts-node transpile in tests
import { validateInvitedEmail } from "../lib/accountant/access.test.js";

describe("Accountant invite email validation", () => {
  test("rejects empty email", () => {
    assert.throws(() => validateInvitedEmail("   "));
  });

  test("accepts valid email", () => {
    assert.strictEqual(validateInvitedEmail("test@example.com"), "test@example.com");
  });
});
