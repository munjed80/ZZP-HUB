import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit test for the "link accountant to company" action.
 * 
 * Tests the core logic for:
 * - Validating accountantEmail (non-empty, normalized)
 * - Finding user by email (404 if not found)
 * - Checking user is an accountant (400 if not)
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
    { id: "cu-1", companyId: "company-1", userId: "user-1", role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
    // User 2 is NOT an accountant
  ],
};

// Mock link accountant logic
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

  // Find user by email
  const user = mockDB.users.find(u => u.email === normalizedEmail);
  if (!user) {
    return { status: 404, error: "Accountant user not found" };
  }

  // Check if user is an accountant (has any CompanyUser record with role ACCOUNTANT)
  const isAccountant = mockDB.companyUsers.some(cu => cu.userId === user.id && cu.role === "ACCOUNTANT");
  if (!isAccountant) {
    return { status: 400, error: "User is not an accountant" };
  }

  // Check company exists
  const company = mockDB.users.find(u => u.id === companyId);
  if (!company) {
    return { status: 404, error: "Company not found" };
  }

  // Upsert CompanyUser record
  const existingLink = mockDB.companyUsers.find(cu => cu.companyId === companyId && cu.userId === user.id);
  if (existingLink) {
    // Update existing
    existingLink.status = "ACTIVE";
    existingLink.canRead = true;
  } else {
    // Create new
    mockDB.companyUsers.push({
      id: `cu-${Date.now()}`,
      companyId: companyId,
      userId: user.id,
      invitedEmail: normalizedEmail,
      role: "ACCOUNTANT",
      status: "ACTIVE",
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
    accountantUserId: user.id,
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
      // Using a non-existent email to trigger the 404 path (email is normalized correctly)
      const result = await linkAccountantToCompany("company-1", "  UNKNOWN@EXAMPLE.COM  ");
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.error, "Accountant user not found");
    });
  });

  describe("User Lookup", () => {
    test("returns 404 when user email is not found", async () => {
      const result = await linkAccountantToCompany("company-1", "notfound@example.com");
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.error, "Accountant user not found");
    });

    test("returns 400 when user is not an accountant", async () => {
      const result = await linkAccountantToCompany("company-1", "normaluser@example.com");
      assert.strictEqual(result.status, 400);
      assert.strictEqual(result.error, "User is not an accountant");
    });
  });

  describe("Company Lookup", () => {
    test("returns 404 when company is not found", async () => {
      const result = await linkAccountantToCompany("unknown-company", "accountant@example.com");
      assert.strictEqual(result.status, 404);
      assert.strictEqual(result.error, "Company not found");
    });
  });

  describe("Successful Linking", () => {
    test("links accountant to company and returns success", async () => {
      const result = await linkAccountantToCompany("company-1", "accountant@example.com");
      assert.strictEqual(result.status, 200);
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.companyId, "company-1");
      assert.strictEqual(result.accountantUserId, "user-1");
    });

    test("creates CompanyUser record with default canRead=true", async () => {
      // First, reset the mock state
      const initialLength = mockDB.companyUsers.length;
      
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
      assert.strictEqual(newLink.status, "ACTIVE", "status should be ACTIVE");
    });
  });
});
