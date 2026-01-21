import { describe, test } from "node:test";
import assert from "node:assert/strict";

function canAcceptInvite(invite) {
  return invite?.status === "PENDING" && Boolean(invite.tokenHash);
}

describe("Accountant invite acceptance", () => {
  test("blocks reused or missing token", () => {
    assert.strictEqual(canAcceptInvite(null), false);
    assert.strictEqual(canAcceptInvite({ status: "ACTIVE", tokenHash: "x" }), false);
  });

  test("allows pending invite with token", () => {
    assert.strictEqual(canAcceptInvite({ status: "PENDING", tokenHash: "hash" }), true);
  });
});
