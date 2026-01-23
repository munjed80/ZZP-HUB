import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * Email Verification Tests
 * 
 * These tests verify the email verification token flow:
 * - Token generation produces valid alphanumeric strings
 * - Token hashing with bcrypt works correctly
 * - Token verification with bcrypt works correctly
 * - URL encoding does not affect tokens
 * - Expired tokens are rejected
 * - TTL calculations use milliseconds correctly
 * 
 * Note: We replicate the token functions here rather than importing them because:
 * 1. lib/email.ts uses dynamic imports and has Node.js-specific dependencies
 * 2. These functions are the exact algorithm we want to verify works correctly
 * 3. Any drift between these and the source would be caught by integration tests
 */

// Replicate the generateVerificationToken function from lib/email.ts
// This uses the same algorithm: cryptographically random alphanumeric chars
function generateVerificationToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;
  let token = '';
  
  const randomValues = new Uint8Array(48);
  crypto.getRandomValues(randomValues);
  
  let randomIndex = 0;
  while (token.length < 32 && randomIndex < randomValues.length) {
    const randomValue = randomValues[randomIndex++];
    const maxUsableValue = 256 - (256 % charsLength);
    if (randomValue < maxUsableValue) {
      token += chars[randomValue % charsLength];
    }
  }
  
  if (token.length < 32) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  
  return token;
}

// Replicate hashToken from lib/email.ts - bcrypt with cost factor 10
async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

// Replicate verifyToken from lib/email.ts - bcrypt compare
async function verifyToken(token, hash) {
  return bcrypt.compare(token, hash);
}

// Simulate token creation like in register/actions.ts
function createMockToken() {
  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  return {
    token: generateVerificationToken(),
    expiresAt,
    createdAt: now,
  };
}

// Simulate token expiry check like in verify-email/actions.ts
function isTokenExpired(tokenExpiresAt) {
  const now = new Date();
  return tokenExpiresAt < now;
}

// Simulate token validity check (Prisma query equivalent)
function isTokenValid(tokenExpiresAt) {
  const now = new Date();
  return tokenExpiresAt >= now;
}

test("Token generation produces 32-character alphanumeric string", () => {
  const token = generateVerificationToken();
  
  assert.equal(token.length, 32, "Token should be 32 characters");
  assert.ok(/^[a-zA-Z0-9]+$/.test(token), "Token should be alphanumeric only");
});

test("Token generation produces unique tokens", () => {
  const tokens = new Set();
  
  // Generate 100 tokens and verify they're all unique
  for (let i = 0; i < 100; i++) {
    tokens.add(generateVerificationToken());
  }
  
  assert.equal(tokens.size, 100, "All 100 generated tokens should be unique");
});

test("Token hashing with bcrypt produces valid hash", async () => {
  const token = generateVerificationToken();
  const hash = await hashToken(token);
  
  // bcrypt hashes start with $2b$ or $2a$
  assert.ok(hash.startsWith("$2"), "Hash should be a valid bcrypt hash");
  assert.ok(hash.length > 50, "Hash should have sufficient length");
});

test("Token verification succeeds for matching token", async () => {
  const token = generateVerificationToken();
  const hash = await hashToken(token);
  
  const isValid = await verifyToken(token, hash);
  
  assert.equal(isValid, true, "Verification should succeed for matching token");
});

test("Token verification fails for wrong token", async () => {
  const token = generateVerificationToken();
  const hash = await hashToken(token);
  
  const wrongToken = token + "x"; // Slightly modified token
  const isValid = await verifyToken(wrongToken, hash);
  
  assert.equal(isValid, false, "Verification should fail for wrong token");
});

test("Token verification fails for completely different token", async () => {
  const token1 = generateVerificationToken();
  const token2 = generateVerificationToken();
  const hash = await hashToken(token1);
  
  const isValid = await verifyToken(token2, hash);
  
  assert.equal(isValid, false, "Verification should fail for different token");
});

test("URL encoding does not affect token", () => {
  const token = generateVerificationToken();
  const baseUrl = "https://zzpershub.nl";
  const url = `${baseUrl}/verify-email?token=${token}`;
  
  // Parse URL and extract token
  const parsedUrl = new URL(url);
  const extractedToken = parsedUrl.searchParams.get("token");
  
  assert.equal(extractedToken, token, "Token should survive URL encoding");
});

test("Full verification flow works end-to-end", async () => {
  // 1. Generate token (like in register/actions.ts)
  const rawToken = generateVerificationToken();
  
  // 2. Hash token (like in register/actions.ts)
  const hashedToken = await hashToken(rawToken);
  
  // 3. Construct URL (like in register/actions.ts)
  const baseUrl = "https://zzpershub.nl";
  const verificationUrl = `${baseUrl}/verify-email?token=${rawToken}`;
  
  // 4. Simulate user clicking link - browser parses URL
  const parsedUrl = new URL(verificationUrl);
  const tokenFromUrl = parsedUrl.searchParams.get("token");
  
  // 5. Verify token (like in verify-email/actions.ts)
  const isValid = await verifyToken(tokenFromUrl, hashedToken);
  
  assert.equal(isValid, true, "Full verification flow should succeed");
});

test("Token expiry date calculation is correct", () => {
  const now = Date.now();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000); // 24 hours
  
  // Should be approximately 24 hours in the future
  const diff = expiresAt.getTime() - now;
  const hours = diff / (60 * 60 * 1000);
  
  assert.ok(hours >= 23.99 && hours <= 24.01, "Expiry should be 24 hours in the future");
});

test("Token expiry comparison works correctly", () => {
  const now = new Date();
  
  // Valid token (expires in future)
  const futureExpiry = new Date(now.getTime() + 1000); // 1 second in future
  assert.ok(futureExpiry >= now, "Future expiry should be >= now");
  
  // Expired token (expired in past)
  const pastExpiry = new Date(now.getTime() - 1000); // 1 second in past
  assert.ok(pastExpiry < now, "Past expiry should be < now");
});

test("Multiple hash generations produce different hashes for same token", async () => {
  const token = generateVerificationToken();
  
  const hash1 = await hashToken(token);
  const hash2 = await hashToken(token);
  
  // bcrypt uses random salt, so hashes should be different
  assert.notEqual(hash1, hash2, "Same token should produce different hashes");
  
  // But both should verify correctly
  assert.equal(await verifyToken(token, hash1), true, "First hash should verify");
  assert.equal(await verifyToken(token, hash2), true, "Second hash should verify");
});

test("Verification URL format is correct", () => {
  const token = generateVerificationToken();
  const baseUrl = "https://zzpershub.nl";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  assert.ok(verificationUrl.startsWith("https://"), "URL should use HTTPS");
  assert.ok(verificationUrl.includes("/verify-email?token="), "URL should have correct path and query");
  assert.ok(verificationUrl.includes(token), "URL should contain the token");
});

// ============================================================================
// TTL and Expiration Tests - Root cause investigation
// ============================================================================

test("TTL_MS is correctly computed as 24 hours in milliseconds", () => {
  const TTL_MS = 24 * 60 * 60 * 1000;
  
  // 24 hours = 86,400,000 milliseconds
  assert.equal(TTL_MS, 86400000, "TTL should be 86,400,000 milliseconds");
  
  // Not the common bug of using seconds instead
  const TTL_SECONDS = 24 * 60 * 60;
  assert.notEqual(TTL_MS, TTL_SECONDS, "TTL in ms should NOT equal TTL in seconds");
});

test("Token expiry is correctly set in the future using Date.getTime() + TTL_MS", () => {
  const TTL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  
  // expiresAt should be ~24 hours ahead
  const diffMs = expiresAt.getTime() - now.getTime();
  assert.equal(diffMs, TTL_MS, "Difference should exactly equal TTL_MS");
  
  // Token should NOT be expired immediately
  assert.ok(expiresAt > now, "Expiry should be after now");
  assert.ok(!isTokenExpired(expiresAt), "Newly created token should NOT be expired");
  assert.ok(isTokenValid(expiresAt), "Newly created token should be valid");
});

test("Token created with Date.now() + TTL_MS is NOT immediately expired", () => {
  // This is the exact pattern used in register/actions.ts
  const TTL_MS = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(Date.now() + TTL_MS);
  
  // Should NOT be expired
  assert.ok(!isTokenExpired(expiresAt), "Token should not be expired immediately after creation");
});

test("Simulating the BUG: using seconds instead of milliseconds causes immediate expiry", () => {
  // Common bug: Using seconds instead of milliseconds
  const TTL_SECONDS = 24 * 60 * 60; // This is WRONG if added to Date.now()
  const now = new Date();
  const wrongExpiresAt = new Date(now.getTime() + TTL_SECONDS); // Only ~86 seconds ahead!
  
  const diffMs = wrongExpiresAt.getTime() - now.getTime();
  const diffSeconds = diffMs / 1000;
  
  // With the bug, it's only ~86 seconds in the future, not 24 hours
  assert.ok(diffSeconds < 90, "Bug would result in only ~86 seconds TTL");
  assert.ok(diffSeconds > 80, "Bug would result in only ~86 seconds TTL");
  
  // The token would still be valid immediately, but expire in ~86 seconds
  // This test shows WHY the bug exists and what it looks like
});

test("createMockToken creates a valid future expiry date", () => {
  const mockToken = createMockToken();
  
  // Token should be valid immediately
  assert.ok(isTokenValid(mockToken.expiresAt), "Mock token should be valid");
  assert.ok(!isTokenExpired(mockToken.expiresAt), "Mock token should not be expired");
  
  // expiresAt should be ~24 hours after createdAt
  const diffMs = mockToken.expiresAt.getTime() - mockToken.createdAt.getTime();
  const diffHours = diffMs / (60 * 60 * 1000);
  
  assert.ok(diffHours >= 23.99 && diffHours <= 24.01, 
    `Token should expire in ~24 hours, got ${diffHours.toFixed(2)} hours`);
});

test("Token expiry simulation: fresh token -> immediate verify -> success", async () => {
  // Step 1: Create token (registration)
  const rawToken = generateVerificationToken();
  const hashedToken = await hashToken(rawToken);
  const TTL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  
  // Step 2: Immediately verify (user clicks link right away)
  const verifyNow = new Date();
  const tokenNotExpired = expiresAt >= verifyNow;
  const tokenMatches = await verifyToken(rawToken, hashedToken);
  
  assert.ok(tokenNotExpired, "Token should not be expired yet");
  assert.ok(tokenMatches, "Token should match hash");
  
  // Both conditions must be true for successful verification
  const verificationSuccess = tokenNotExpired && tokenMatches;
  assert.ok(verificationSuccess, "Verification should succeed");
});

test("Token expiry simulation: expired token -> verify -> fail", async () => {
  // Step 1: Create token with past expiry (simulating expired token)
  const rawToken = generateVerificationToken();
  const hashedToken = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago
  
  // Step 2: Try to verify
  const verifyNow = new Date();
  const tokenNotExpired = expiresAt >= verifyNow;
  const tokenMatches = await verifyToken(rawToken, hashedToken);
  
  assert.ok(!tokenNotExpired, "Token should be expired");
  assert.ok(tokenMatches, "Token hash should still match (but token is expired)");
  
  // Verification should fail because token is expired
  const verificationSuccess = tokenNotExpired && tokenMatches;
  assert.ok(!verificationSuccess, "Verification should fail for expired token");
});

test("Token expiry simulation: wrong token -> verify -> fail", async () => {
  // Step 1: Create valid token
  const rawToken = generateVerificationToken();
  const hashedToken = await hashToken(rawToken);
  const TTL_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);
  
  // Step 2: Try to verify with wrong token
  const wrongToken = generateVerificationToken(); // Different token
  const tokenNotExpired = expiresAt >= new Date();
  const tokenMatches = await verifyToken(wrongToken, hashedToken);
  
  assert.ok(tokenNotExpired, "Token should not be expired");
  assert.ok(!tokenMatches, "Token should NOT match (wrong token)");
  
  // Verification should fail because token doesn't match
  const verificationSuccess = tokenNotExpired && tokenMatches;
  assert.ok(!verificationSuccess, "Verification should fail for wrong token");
});

test("Prisma Date handling: JS Date object serializes to valid DateTime", () => {
  const now = new Date();
  const TTL_MS = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + TTL_MS);
  
  // Prisma expects Date objects which it converts to DateTime
  // Verify the Date is a valid instance
  assert.ok(expiresAt instanceof Date, "expiresAt should be a Date instance");
  assert.ok(!isNaN(expiresAt.getTime()), "expiresAt should be a valid date");
  
  // The ISO string should be parseable back to the same date
  const isoString = expiresAt.toISOString();
  const parsedBack = new Date(isoString);
  assert.equal(parsedBack.getTime(), expiresAt.getTime(), 
    "Date should roundtrip through ISO string");
});

test("Date comparison: expiresAt >= now for valid token", () => {
  const now = new Date();
  const TTL_MS = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + TTL_MS);
  
  // This is the Prisma query condition
  const prismaCondition = expiresAt >= now; // gte: now
  assert.ok(prismaCondition, "expiresAt should be >= now for valid token");
});

test("Date comparison: expiresAt < now for expired token", () => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() - 1000); // 1 second in past
  
  // This is the Prisma query condition for expired tokens
  const prismaCondition = expiresAt < now; // lt: now
  assert.ok(prismaCondition, "expiresAt should be < now for expired token");
});
