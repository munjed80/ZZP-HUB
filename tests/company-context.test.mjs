import { describe, test } from "node:test";
import assert from "node:assert/strict";

/**
 * Unit tests for company context and switch-company flow.
 * 
 * Tests the core logic for:
 * - Active company context resolution
 * - Company switch flow
 * - Permission checks based on membership
 */

// Mock UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value) {
  return typeof value === "string" && UUID_REGEX.test(value);
}

// Mock company context resolution logic
function resolveActiveCompanyContext({
  sessionUserId,
  sessionRole,
  cookieCompanyId,
  memberships, // Array of { companyId, role, status, canRead, canEdit, canBTW, canExport }
}) {
  // Get active memberships
  const activeMemberships = memberships.filter((m) => m.status === "ACTIVE");
  
  // Check if user has multi-company access
  const hasMultiCompanyMembership = activeMemberships.some(
    (m) => m.role === "ACCOUNTANT" || m.role === "STAFF"
  );
  
  let activeCompanyId;
  let activeMembership = null;
  let isOwnerContext = false;
  
  if (sessionRole === "SUPERADMIN" || sessionRole === "COMPANY_ADMIN") {
    // For owners, default to their own company unless they have cookie set
    if (cookieCompanyId && hasMultiCompanyMembership) {
      activeMembership = activeMemberships.find((m) => m.companyId === cookieCompanyId) || null;
      if (activeMembership) {
        activeCompanyId = cookieCompanyId;
        isOwnerContext = activeMembership.role === "OWNER";
      } else {
        activeCompanyId = sessionUserId;
        isOwnerContext = true;
      }
    } else {
      activeCompanyId = sessionUserId;
      isOwnerContext = true;
    }
  } else if (hasMultiCompanyMembership) {
    // For users with multi-company access
    if (cookieCompanyId) {
      activeMembership = activeMemberships.find((m) => m.companyId === cookieCompanyId) || null;
      if (activeMembership) {
        activeCompanyId = cookieCompanyId;
        isOwnerContext = activeMembership.role === "OWNER";
      } else if (activeMemberships.length > 0) {
        activeMembership = activeMemberships[0];
        activeCompanyId = activeMembership.companyId;
        isOwnerContext = activeMembership.role === "OWNER";
      } else {
        activeCompanyId = sessionUserId;
        isOwnerContext = true;
      }
    } else if (activeMemberships.length > 0) {
      activeMembership = activeMemberships[0];
      activeCompanyId = activeMembership.companyId;
      isOwnerContext = activeMembership.role === "OWNER";
    } else {
      activeCompanyId = sessionUserId;
      isOwnerContext = true;
    }
  } else {
    // Regular user without multi-company access
    activeCompanyId = sessionUserId;
    isOwnerContext = true;
  }
  
  return {
    activeCompanyId,
    activeMembership,
    memberships: activeMemberships,
    isOwnerContext,
  };
}

// Mock switch-company validation logic
function validateSwitchCompany({
  sessionUserId,
  companyId,
  memberships, // Array of { companyId, userId, status }
}) {
  // Validate UUID
  if (!isValidUUID(companyId)) {
    return { valid: false, error: "INVALID_COMPANY_ID" };
  }
  
  // Check if user has access to this company
  const membership = memberships.find(
    (m) => m.companyId === companyId && m.userId === sessionUserId && m.status === "ACTIVE"
  );
  
  if (!membership) {
    return { valid: false, error: "NO_ACCESS" };
  }
  
  return { valid: true, membership };
}

// Tests
describe("Company Context Resolution", () => {
  const companyAdminUserId = "11111111-1111-4111-8111-111111111111";
  const accountantUserId = "22222222-2222-4222-8222-222222222222";
  const clientCompanyId = "33333333-3333-4333-8333-333333333333";
  
  test("COMPANY_ADMIN defaults to their own company (owner context)", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: null,
      memberships: [],
    });
    
    assert.strictEqual(result.activeCompanyId, companyAdminUserId);
    assert.strictEqual(result.isOwnerContext, true);
    assert.strictEqual(result.activeMembership, null);
  });
  
  test("COMPANY_ADMIN with accountant membership uses cookie company", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: clientCompanyId,
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
      ],
    });
    
    assert.strictEqual(result.activeCompanyId, clientCompanyId);
    assert.strictEqual(result.isOwnerContext, false);
    assert.strictEqual(result.activeMembership?.role, "ACCOUNTANT");
  });
  
  test("COMPANY_ADMIN ignores cookie for inaccessible company", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: "invalid-company-id", // Company user doesn't have access to
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
      ],
    });
    
    // Falls back to own company
    assert.strictEqual(result.activeCompanyId, companyAdminUserId);
    assert.strictEqual(result.isOwnerContext, true);
  });
  
  test("Accountant user uses cookie company when available", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: accountantUserId,
      sessionRole: "STAFF", // Not an admin
      cookieCompanyId: clientCompanyId,
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
      ],
    });
    
    assert.strictEqual(result.activeCompanyId, clientCompanyId);
    assert.strictEqual(result.isOwnerContext, false);
    assert.strictEqual(result.activeMembership?.role, "ACCOUNTANT");
  });
  
  test("Accountant user defaults to first membership when no cookie", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: accountantUserId,
      sessionRole: "STAFF",
      cookieCompanyId: null,
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
        { companyId: "other-company", role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
      ],
    });
    
    assert.strictEqual(result.activeCompanyId, clientCompanyId);
    assert.strictEqual(result.memberships.length, 2);
  });
  
  test("PENDING memberships are excluded", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: accountantUserId,
      sessionRole: "STAFF",
      cookieCompanyId: clientCompanyId,
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "PENDING", canRead: true },
      ],
    });
    
    // No active memberships, falls back to user's own company
    assert.strictEqual(result.activeCompanyId, accountantUserId);
    assert.strictEqual(result.isOwnerContext, true);
    assert.strictEqual(result.memberships.length, 0);
  });
});

describe("Switch Company Validation", () => {
  const validCompanyId = "11111111-1111-4111-8111-111111111111";
  const sessionUserId = "22222222-2222-4222-8222-222222222222";
  
  test("Validates UUID format", () => {
    const result = validateSwitchCompany({
      sessionUserId,
      companyId: "not-a-uuid",
      memberships: [],
    });
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "INVALID_COMPANY_ID");
  });
  
  test("Requires active membership", () => {
    const result = validateSwitchCompany({
      sessionUserId,
      companyId: validCompanyId,
      memberships: [],
    });
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "NO_ACCESS");
  });
  
  test("Rejects PENDING membership", () => {
    const result = validateSwitchCompany({
      sessionUserId,
      companyId: validCompanyId,
      memberships: [
        { companyId: validCompanyId, userId: sessionUserId, status: "PENDING" },
      ],
    });
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "NO_ACCESS");
  });
  
  test("Allows ACTIVE membership", () => {
    const result = validateSwitchCompany({
      sessionUserId,
      companyId: validCompanyId,
      memberships: [
        { companyId: validCompanyId, userId: sessionUserId, status: "ACTIVE", role: "ACCOUNTANT" },
      ],
    });
    
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.membership.role, "ACCOUNTANT");
  });
  
  test("Rejects REVOKED membership", () => {
    const result = validateSwitchCompany({
      sessionUserId,
      companyId: validCompanyId,
      memberships: [
        { companyId: validCompanyId, userId: sessionUserId, status: "REVOKED" },
      ],
    });
    
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "NO_ACCESS");
  });
});

describe("Permission Checks", () => {
  // Mock permission check logic
  function hasPermission(membership, permission) {
    if (!membership) return false;
    return !!membership[permission];
  }
  
  test("canRead permission check", () => {
    const membership = { canRead: true, canEdit: false, canBTW: false, canExport: false };
    
    assert.strictEqual(hasPermission(membership, "canRead"), true);
    assert.strictEqual(hasPermission(membership, "canEdit"), false);
    assert.strictEqual(hasPermission(membership, "canBTW"), false);
    assert.strictEqual(hasPermission(membership, "canExport"), false);
  });
  
  test("Full permissions", () => {
    const membership = { canRead: true, canEdit: true, canBTW: true, canExport: true };
    
    assert.strictEqual(hasPermission(membership, "canRead"), true);
    assert.strictEqual(hasPermission(membership, "canEdit"), true);
    assert.strictEqual(hasPermission(membership, "canBTW"), true);
    assert.strictEqual(hasPermission(membership, "canExport"), true);
  });
  
  test("No membership returns false for all permissions", () => {
    assert.strictEqual(hasPermission(null, "canRead"), false);
    assert.strictEqual(hasPermission(undefined, "canEdit"), false);
  });
});

describe("Owner Context vs Accountant Context", () => {
  const companyAdminUserId = "11111111-1111-4111-8111-111111111111";
  const clientCompanyId = "33333333-3333-4333-8333-333333333333";
  
  test("isOwnerContext is true for owner viewing own company", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: null,
      memberships: [],
    });
    
    assert.strictEqual(result.isOwnerContext, true);
  });
  
  test("isOwnerContext is false for accountant viewing client company", () => {
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: clientCompanyId,
      memberships: [
        { companyId: clientCompanyId, role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
      ],
    });
    
    assert.strictEqual(result.isOwnerContext, false);
    assert.strictEqual(result.activeMembership?.role, "ACCOUNTANT");
  });
  
  test("isOwnerContext is true for OWNER role in CompanyUser", () => {
    // When user has BOTH OWNER and ACCOUNTANT memberships, they can switch between companies
    // The OWNER membership should result in isOwnerContext=true
    const result = resolveActiveCompanyContext({
      sessionUserId: companyAdminUserId,
      sessionRole: "COMPANY_ADMIN",
      cookieCompanyId: clientCompanyId,
      memberships: [
        // User has ACCOUNTANT role for another company (enables multi-company mode)
        { companyId: "other-company", role: "ACCOUNTANT", status: "ACTIVE", canRead: true },
        // And OWNER role for the client company
        { companyId: clientCompanyId, role: "OWNER", status: "ACTIVE", canRead: true },
      ],
    });
    
    assert.strictEqual(result.isOwnerContext, true);
    assert.strictEqual(result.activeMembership?.role, "OWNER");
  });
});
