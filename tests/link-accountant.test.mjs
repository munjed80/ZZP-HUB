import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit test for the "link accountant to company" action.
 * 
 * Tests the core logic for:
 * - Validating accountantEmail (non-empty, normalized)
 * - Creating invites for non-registered users (PENDING status)
 * - Linking registered users directly (ACTIVE status)
 * - Creating/upserting CompanyUser record with default permissions
 */

// Mock the normalizeEmail utility function
function normalizeEmail(input) {
  if (typeof input !== "string") {
    throw new Error("EMAIL_REQUIRED");
  }
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    throw new Error("EMAIL_REQUIRED");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error("EMAIL_INVALID");
  }
  return normalized;
}

// Mock database state
const mockDB = {
  users: [
    { id: "user-1", email: "accountant@example.com" },
    { id: "user-2", email: "normaluser@example.com" },
    { id: "company-1", email: "company@example.com" },
  ],
  companyUsers: [
    // User 1 is an accountant for company-1
    { id: "cu-1", companyId: "company-1", userId: "user-1", invitedEmail: "accountant@example.com", role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
  ],
};

// Mock link accountant logic (now supports invites for non-registered users)
async function linkAccountantToCompany(companyId, accountantEmail) {
  // Validate companyId
  if (!companyId || typeof companyId !== "string") {
    return { status: 400, error: "companyId is required and must be a valid UUID" };
  }

  // Validate and normalize email
  let normalizedEmail;
  try {
    normalizedEmail = normalizeEmail(accountantEmail);
  } catch {
    return { status: 400, error: "accountantEmail is required and must be a valid email" };
  }

  // Find user by email (optional - may not exist yet)
  const user = mockDB.users.find(u => u.email === normalizedEmail);

  // Prevent self-assignment as accountant
  if (user && user.id === companyId) {
    return { status: 400, error: "Cannot add yourself as accountant" };
  }

  // Check company exists
  const company = mockDB.users.find(u => u.id === companyId);
  if (!company) {
    return { status: 404, error: "Company not found" };
  }

  // Check for existing invite
  const existingLink = mockDB.companyUsers.find(cu => 
    cu.companyId === companyId && 
    (cu.invitedEmail === normalizedEmail || (user && cu.userId === user.id))
  );

  if (existingLink?.status === "ACTIVE") {
    return { status: 400, error: "This accountant is already linked to your company" };
  }

  if (existingLink) {
    // Update existing invite
    existingLink.userId = user?.id ?? null;
    existingLink.invitedEmail = normalizedEmail;
    existingLink.status = user ? "ACTIVE" : "PENDING";
    existingLink.canRead = true;
  } else {
    // Create new invite/link
    mockDB.companyUsers.push({
      id: `cu-${Date.now()}`,
      companyId: companyId,
      userId: user?.id ?? null,
      invitedEmail: normalizedEmail,
      role: "ACCOUNTANT",
      status: user ? "ACTIVE" : "PENDING",
      canRead: true,
      canEdit: false,
      canExport: false,
      canBTW: false,
    });
  }

  return {
    status: 200,
    ok: true,
    companyId: companyId,
    accountantUserId: user?.id ?? null,
    inviteStatus: user ? "ACTIVE" : "PENDING",
  };
}

describe("Link Accountant to Company", () => {
  describe("Input Validation", () => {
    test("returns 400 when companyId is missing", async () => {
      const result = await linkAccountantToCompany(undefined, "accountant@example.com");
      assert.strictEqual(result.status, 400);
      assert.ok(result.error.includes("companyId"));
    });

    test("returns 400 when accountantEmail is missing", async () => {
      const result = await linkAccountantToCompany("company-1", undefined);
      assert.strictEqual(result.status, 400);
      assert.ok(result.error.includes("accountantEmail"));
    });

    test("returns 400 when accountantEmail is invalid", async () => {
      const result = await linkAccountantToCompany("company-1", "invalid-email");
      assert.strictEqual(result.status, 400);
      assert.ok(result.error.includes("accountantEmail"));
    });

    test("normalizes email with whitespace and case", async () => {
      // Using a non-existent email now creates a PENDING invite
      const result = await linkAccountantToCompany("company-1", "  UNKNOWN@EXAMPLE.COM  ");
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.inviteStatus, "PENDING");
    });
  });

  describe("Invite Flow for Non-Registered Users", () => {
    test("creates PENDING invite when user email is not found", async () => {
      const result = await linkAccountantToCompany("company-1", "notfound@example.com");
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.accountantUserId, null);
      assert.strictEqual(result.inviteStatus, "PENDING");
    });

    test("creates ACTIVE link when user exists", async () => {
      const result = await linkAccountantToCompany("company-1", "normaluser@example.com");
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.accountantUserId, "user-2");
      assert.strictEqual(result.inviteStatus, "ACTIVE");
    });
  });

  describe("Company Lookup", () => {
    test("returns 404 when company is not found", async () => {
      const result = await linkAccountantToCompany("unknown-company", "accountant@example.com");
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.error, "Company not found");
    });

    test("prevents self-assignment as accountant", async () => {
      const result = await linkAccountantToCompany("company-1", "company@example.com");
      assert.strictEqual(result.status, 400);
      assert.strictEqual(result.error, "Cannot add yourself as accountant");
    });
  });

  describe("Successful Linking", () => {
    test("returns already linked error for active accountant", async () => {
      const result = await linkAccountantToCompany("company-1", "accountant@example.com");
      assert.strictEqual(result.status, 400);
      assert.strictEqual(result.error, "This accountant is already linked to your company");
    });

    test("creates CompanyUser record with default canRead=true", async () => {
      // Add a new company that doesn't have the accountant linked yet
      mockDB.users.push({ id: "company-2", email: "newcompany@example.com" });
      
      const result = await linkAccountantToCompany("company-2", "accountant@example.com");
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.ok, true);
      
      // Verify a new CompanyUser was created
      const newLink = mockDB.companyUsers.find(
        cu => cu.companyId === "company-2" && cu.userId === "user-1"
      );
      assert.ok(newLink, "CompanyUser record should be created");
      assert.strictEqual(newLink.canRead, true, "canRead should default to true");
      assert.strictEqual(newLink.canEdit, false, "canEdit should default to false");
      assert.strictEqual(newLink.canExport, false, "canExport should default to false");
      assert.strictEqual(newLink.canBTW, false, "canBTW should default to false");
      assert.strictEqual(newLink.status, "ACTIVE", "status should be ACTIVE for existing user");
    });
  });
});
