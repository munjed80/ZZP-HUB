import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Registration Role Tests
 * 
 * These tests verify:
 * - Role schema accepts valid roles (ZZP, ACCOUNTANT)
 * - Role mapping correctly maps registration roles to UserRole
 * - Invalid roles are rejected
 */

// Replicate the role schema validation from app/(auth)/register/schema.ts
const REGISTRATION_ROLES = ["ZZP", "ACCOUNTANT"];

function isValidRegistrationRole(role) {
  return REGISTRATION_ROLES.includes(role);
}

// Replicate the role mapping from app/(auth)/register/actions.ts
const UserRole = {
  SUPERADMIN: "SUPERADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  STAFF: "STAFF",
  ACCOUNTANT: "ACCOUNTANT",
};

function mapRegistrationRole(role) {
  switch (role) {
    case "ACCOUNTANT":
      return UserRole.ACCOUNTANT;
    case "ZZP":
    default:
      return UserRole.COMPANY_ADMIN;
  }
}

test("Role schema: ZZP is a valid registration role", () => {
  assert.ok(isValidRegistrationRole("ZZP"));
});

test("Role schema: ACCOUNTANT is a valid registration role", () => {
  assert.ok(isValidRegistrationRole("ACCOUNTANT"));
});

test("Role schema: invalid roles are rejected", () => {
  assert.equal(isValidRegistrationRole("ADMIN"), false);
  assert.equal(isValidRegistrationRole("SUPERADMIN"), false);
  assert.equal(isValidRegistrationRole(""), false);
  assert.equal(isValidRegistrationRole(null), false);
  assert.equal(isValidRegistrationRole(undefined), false);
  assert.equal(isValidRegistrationRole("zzp"), false); // case sensitive
  assert.equal(isValidRegistrationRole("accountant"), false); // case sensitive
});

test("Role mapping: ZZP maps to COMPANY_ADMIN", () => {
  const result = mapRegistrationRole("ZZP");
  assert.equal(result, UserRole.COMPANY_ADMIN);
});

test("Role mapping: ACCOUNTANT maps to ACCOUNTANT", () => {
  const result = mapRegistrationRole("ACCOUNTANT");
  assert.equal(result, UserRole.ACCOUNTANT);
});

test("Role mapping: unknown role defaults to COMPANY_ADMIN", () => {
  const result = mapRegistrationRole("UNKNOWN");
  assert.equal(result, UserRole.COMPANY_ADMIN);
});

test("Registration roles array has exactly 2 valid options", () => {
  assert.equal(REGISTRATION_ROLES.length, 2);
  assert.ok(REGISTRATION_ROLES.includes("ZZP"));
  assert.ok(REGISTRATION_ROLES.includes("ACCOUNTANT"));
});

// Test the role-based landing page logic from login page
function getDefaultLandingPage(role) {
  if (role === "ACCOUNTANT") {
    return "/accountant";
  }
  return "/dashboard";
}

test("Landing page: ACCOUNTANT users land on /accountant", () => {
  const result = getDefaultLandingPage("ACCOUNTANT");
  assert.equal(result, "/accountant");
});

test("Landing page: COMPANY_ADMIN users land on /dashboard", () => {
  const result = getDefaultLandingPage("COMPANY_ADMIN");
  assert.equal(result, "/dashboard");
});

test("Landing page: SUPERADMIN users land on /dashboard", () => {
  const result = getDefaultLandingPage("SUPERADMIN");
  assert.equal(result, "/dashboard");
});

test("Landing page: STAFF users land on /dashboard", () => {
  const result = getDefaultLandingPage("STAFF");
  assert.equal(result, "/dashboard");
});

test("Landing page: null role lands on /dashboard", () => {
  const result = getDefaultLandingPage(null);
  assert.equal(result, "/dashboard");
});
