import { describe, test } from "node:test";
import assert from "node:assert/strict";

function canAcceptInvite(invite) {
  return invite?.status === "PENDING" && Boolean(invite.tokenHash);
}

/**
 * Validates that the accept flow prerequisites are met before updating CompanyUser.
 * This mimics the validation logic in the accept route.
 * 
 * @param {object} params - Validation parameters
 * @param {object|null} params.invite - The CompanyUser invite record
 * @param {object|null} params.sessionUser - The session user (id, email)
 * @param {object|null} params.dbUser - The user from database lookup
 * @param {string|null} params.requestEmail - Email from request body or session
 * @returns {{ valid: boolean, error?: string, isIdempotent?: boolean }}
 */
function validateAcceptPrerequisites({ invite, sessionUser, dbUser, requestEmail }) {
  // 1. Session must exist
  if (!sessionUser?.id || !sessionUser?.email) {
    return { valid: false, error: "NO_SESSION" };
  }

  // 2. Invite must exist
  if (!invite) {
    return { valid: false, error: "INVITE_NOT_FOUND" };
  }

  // 3. Handle already accepted (idempotent)
  if (invite.status === "ACTIVE") {
    return { valid: true, isIdempotent: true };
  }

  // 4. Invite must be PENDING
  if (invite.status !== "PENDING") {
    return { valid: false, error: "INVALID_INVITE_STATUS" };
  }

  // 5. Email must match invite
  if (invite.invitedEmail && requestEmail && invite.invitedEmail !== requestEmail) {
    return { valid: false, error: "EMAIL_MISMATCH" };
  }

  // 6. CRITICAL: User must exist in database (prevents P2003)
  if (!dbUser?.id) {
    return { valid: false, error: "USER_NOT_IN_DB" };
  }

  // 7. Session email must match database email
  if (dbUser.email !== requestEmail) {
    return { valid: false, error: "SESSION_DB_EMAIL_MISMATCH" };
  }

  return { valid: true };
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

describe("Accept flow validation (P2003 prevention)", () => {
  const validInvite = { 
    status: "PENDING", 
    tokenHash: "hash123", 
    invitedEmail: "accountant@example.com" 
  };
  const validSession = { id: "user-uuid-123", email: "accountant@example.com" };
  const validDbUser = { id: "user-uuid-123", email: "accountant@example.com" };

  test("rejects when no session", () => {
    const result = validateAcceptPrerequisites({
      invite: validInvite,
      sessionUser: null,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "NO_SESSION");
  });

  test("rejects when session has no id", () => {
    const result = validateAcceptPrerequisites({
      invite: validInvite,
      sessionUser: { email: "test@example.com" },
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "NO_SESSION");
  });

  test("rejects when invite not found", () => {
    const result = validateAcceptPrerequisites({
      invite: null,
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "INVITE_NOT_FOUND");
  });

  test("accepts idempotent for already-accepted invite", () => {
    const result = validateAcceptPrerequisites({
      invite: { status: "ACTIVE", userId: "user-uuid-123" },
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.isIdempotent, true);
  });

  test("rejects revoked invite", () => {
    const result = validateAcceptPrerequisites({
      invite: { status: "REVOKED", tokenHash: "hash" },
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "INVALID_INVITE_STATUS");
  });

  test("rejects email mismatch between invite and session", () => {
    const result = validateAcceptPrerequisites({
      invite: { ...validInvite, invitedEmail: "other@example.com" },
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "EMAIL_MISMATCH");
  });

  test("CRITICAL: rejects when user not in database (prevents P2003)", () => {
    const result = validateAcceptPrerequisites({
      invite: validInvite,
      sessionUser: validSession,
      dbUser: null, // User deleted or invalid session
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "USER_NOT_IN_DB");
  });

  test("rejects when session email differs from database email", () => {
    const result = validateAcceptPrerequisites({
      invite: validInvite,
      sessionUser: validSession,
      dbUser: { id: "user-uuid-123", email: "different@example.com" },
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "SESSION_DB_EMAIL_MISMATCH");
  });

  test("accepts valid accept flow", () => {
    const result = validateAcceptPrerequisites({
      invite: validInvite,
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.isIdempotent, undefined);
  });

  test("accepts when invitedEmail is null (backward compatibility)", () => {
    const result = validateAcceptPrerequisites({
      invite: { status: "PENDING", tokenHash: "hash", invitedEmail: null },
      sessionUser: validSession,
      dbUser: validDbUser,
      requestEmail: "accountant@example.com",
    });
    assert.strictEqual(result.valid, true);
  });
});
