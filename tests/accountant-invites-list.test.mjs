import { describe, test } from "node:test";
import assert from "node:assert/strict";

// Simplified in-memory invite/access list logic mirroring /api/accountant/access GET
function listVisibleInvitesAndAccesses({ companyId, invites, accesses }) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId);
  if (!isUuid) {
    return { invites: [], accesses: [], reason: "WRONG_COMPANYID" };
  }
  const pending = invites.filter((inv) => inv.companyId === companyId && inv.status === "PENDING");
  const activeAccesses = accesses.filter((a) => a.companyId === companyId && a.status === "ACTIVE");
  const reason = pending.length === 0 && activeAccesses.length === 0 ? (invites.length > 0 ? "FILTERED_OUT" : "NO_INVITES") : null;
  return { invites: pending, accesses: activeAccesses, reason };
}

describe("ZZP accountant invites visibility", () => {
  test("includes SENT/PENDING invites for the correct company UUID", () => {
    const companyId = "123e4567-e89b-12d3-a456-426614174000";
    const invites = [
      { companyId, status: "PENDING", email: "a@example.com" },
      { companyId, status: "ACCEPTED", email: "b@example.com" },
      { companyId: "11111111-1111-1111-1111-111111111111", status: "PENDING", email: "c@example.com" },
    ];
    const accesses = [{ companyId, status: "ACTIVE", accountantUserId: "acc-1" }];

    const { invites: visibleInvites, accesses: visibleAccesses, reason } = listVisibleInvitesAndAccesses({
      companyId,
      invites,
      accesses,
    });

    assert.strictEqual(reason, null);
    assert.strictEqual(visibleInvites.length, 1);
    assert.strictEqual(visibleInvites[0].email, "a@example.com");
    assert.strictEqual(visibleAccesses.length, 1);
    assert.strictEqual(visibleAccesses[0].accountantUserId, "acc-1");
  });
});
