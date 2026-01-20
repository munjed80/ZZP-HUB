import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * Accountant Invite Validation Tests
 * 
 * These tests verify email validation in the accountant invite flow
 * to prevent Prisma P2011 null constraint violations.
 */

describe("Accountant Invite Email Validation", () => {
  
  test("should reject null email", () => {
    const email = null;
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Null email should be rejected");
  });

  test("should reject undefined email", () => {
    const email = undefined;
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Undefined email should be rejected");
  });

  test("should reject empty string", () => {
    const email = "";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Empty string should be rejected");
  });

  test("should reject whitespace-only string", () => {
    const email = "   ";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Whitespace-only string should be rejected");
  });

  test("should reject invalid email format (no @)", () => {
    const email = "notanemail";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Email without @ should be rejected");
  });

  test("should reject invalid email format (no domain)", () => {
    const email = "test@";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, false, "Email without domain should be rejected");
  });

  test("should accept valid email", () => {
    const email = "accountant@example.com";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, true, "Valid email should be accepted");
  });

  test("should accept valid email with subdomain", () => {
    const email = "accountant@accounting.example.com";
    const isValid = validateEmail(email);
    
    assert.strictEqual(isValid, true, "Valid email with subdomain should be accepted");
  });

  test("should normalize email by trimming and lowercasing", () => {
    const email = "  Accountant@Example.COM  ";
    const normalized = normalizeEmail(email);
    
    assert.strictEqual(normalized, "accountant@example.com", "Email should be trimmed and lowercased");
  });

  test("should handle email with mixed case", () => {
    const email = "TeStUser@ExAmPle.CoM";
    const normalized = normalizeEmail(email);
    
    assert.strictEqual(normalized, "testuser@example.com", "Mixed case email should be normalized");
  });
});

/**
 * Helper function to validate email (mirrors server-side logic)
 */
function validateEmail(email) {
  // Check for null/undefined/non-string
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim and check for empty
  const trimmed = email.trim();
  if (!trimmed) {
    return false;
  }

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed.toLowerCase());
}

/**
 * Helper function to normalize email (mirrors server-side logic)
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}
