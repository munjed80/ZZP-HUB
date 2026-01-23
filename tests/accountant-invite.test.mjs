import { describe, test } from "node:test";
import assert from "node:assert/strict";

function canAcceptInvite(invite) {
  return invite?.status === "PENDING" && Boolean(invite.tokenHash);
}

function canRevokeInvite(invite) {
  return invite?.status === "PENDING";
}

function canRemoveAccess(invite) {
  return invite?.status === "ACTIVE";
}

function canReInvite(invite) {
  return invite?.status === "REVOKED" || invite?.status === "EXPIRED";
}

function canDeleteInvite(invite) {
  return invite?.status === "REVOKED" || invite?.status === "EXPIRED";
}

describe("Accountant invite acceptance", () => {
  test("blocks reused or missing token", () => {
    assert.strictEqual(canAcceptInvite(null), false);
    assert.strictEqual(canAcceptInvite({ status: "ACTIVE", tokenHash: "x" }), false);
  });

  test("allows pending invite with token", () => {
    assert.strictEqual(canAcceptInvite({ status: "PENDING", tokenHash: "hash" }), true);
  });

  test("blocks revoked or expired invites", () => {
    assert.strictEqual(canAcceptInvite({ status: "REVOKED", tokenHash: "hash" }), false);
    assert.strictEqual(canAcceptInvite({ status: "EXPIRED", tokenHash: "hash" }), false);
  });
});

describe("Accountant invite management", () => {
  test("can revoke pending invites", () => {
    assert.strictEqual(canRevokeInvite({ status: "PENDING" }), true);
    assert.strictEqual(canRevokeInvite({ status: "ACTIVE" }), false);
    assert.strictEqual(canRevokeInvite({ status: "REVOKED" }), false);
  });

  test("can remove active access", () => {
    assert.strictEqual(canRemoveAccess({ status: "ACTIVE" }), true);
    assert.strictEqual(canRemoveAccess({ status: "PENDING" }), false);
    assert.strictEqual(canRemoveAccess({ status: "REVOKED" }), false);
  });

  test("can re-invite revoked or expired", () => {
    assert.strictEqual(canReInvite({ status: "REVOKED" }), true);
    assert.strictEqual(canReInvite({ status: "EXPIRED" }), true);
    assert.strictEqual(canReInvite({ status: "PENDING" }), false);
    assert.strictEqual(canReInvite({ status: "ACTIVE" }), false);
  });

  test("can delete revoked or expired", () => {
    assert.strictEqual(canDeleteInvite({ status: "REVOKED" }), true);
    assert.strictEqual(canDeleteInvite({ status: "EXPIRED" }), true);
    assert.strictEqual(canDeleteInvite({ status: "PENDING" }), false);
    assert.strictEqual(canDeleteInvite({ status: "ACTIVE" }), false);
  });
});
