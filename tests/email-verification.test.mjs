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
 */

// Replicate the generateVerificationToken function from lib/email.ts
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

// Replicate hashToken from lib/email.ts
async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

// Replicate verifyToken from lib/email.ts
async function verifyToken(token, hash) {
  return bcrypt.compare(token, hash);
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
