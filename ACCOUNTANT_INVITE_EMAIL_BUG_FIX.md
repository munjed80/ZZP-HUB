# Accountant Invite Email Bug Fix

## Problem Summary

Valid email addresses like `abo-joud80@hotmail.com` were being rejected with "Ongeldig e-mailadres" (Invalid email) error, and the server was throwing Prisma P2011 null constraint violations when creating accountant invites.

## Root Cause

The database table `AccountantInvite` had **two email columns**:
1. `email` (NOT NULL) - from the original migration
2. `invitedEmail` (NOT NULL) - added in a later migration

The application code correctly used `invitedEmail`, but the old `email` column was never dropped. When creating a new invite:
- The code sent `invitedEmail: "abo-joud80@hotmail.com"`
- The old `email` column remained `NULL`
- PostgreSQL threw: **P2011: Null constraint violation on `email`**

## Solution

### 1. Database Migration ✅
**File:** `prisma/migrations/20260121012500_drop_old_email_column_from_accountant_invite/migration.sql`

```sql
-- Drop the old 'email' column from AccountantInvite table
ALTER TABLE "AccountantInvite" DROP COLUMN IF EXISTS "email";

-- Remove the old email index if it exists
DROP INDEX IF EXISTS "AccountantInvite_email_idx";
```

### 2. Email Normalization Utility ✅
**File:** `lib/utils.ts`

Added a strict `normalizeEmail()` function that:
- ✅ Validates input is a string
- ✅ Trims and lowercases email
- ✅ Validates email format with regex
- ✅ **NEVER returns null** - throws error instead
- ✅ Prevents any possibility of null email values

```typescript
export function normalizeEmail(input: unknown): string {
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
```

### 3. Server-Side Actions ✅
**File:** `app/actions/accountant-access-actions.ts`

**Before:**
```typescript
const rawEmail = (email ?? "").toString();
const normalizedEmail = rawEmail.trim().toLowerCase();
// Could potentially become empty string
```

**After:**
```typescript
let normalizedEmail: string;
try {
  normalizedEmail = normalizeEmail(email);
} catch (error) {
  // Proper error handling with user-friendly messages
  return { success: false, error: "EMAIL_INVALID", message: "..." };
}

// Runtime guard before Prisma
if (!normalizedEmail) {
  throw new Error("EMAIL_NORMALIZATION_FAILED");
}

// Build exact data object
const createData = {
  invitedEmail: normalizedEmail,  // Guaranteed non-null
  // ... other fields
};

// Detailed logging of exact data being sent to Prisma
console.log("[ACCOUNTANT_INVITE_CREATE_DATA]", {
  hasEmail: Boolean(createData.invitedEmail),
  emailLength: createData.invitedEmail.length,
  // ... other safe diagnostic info
});

const invite = await prisma.accountantInvite.create({ data: createData });
```

### 4. Client-Side Validation ✅
**File:** `app/(dashboard)/accountant-access/accountant-access-content.tsx`

Updated to normalize email before validation (consistent with server):

```typescript
const validateEmail = (value: string) => {
  const trimmed = value?.trim();
  const normalized = trimmed.toLowerCase();
  if (!emailRegex.test(normalized)) {
    return { valid: false, message: "Ongeldig e-mailadres." };
  }
  return { valid: true, email: normalized };
};
```

### 5. Regression Tests ✅
**File:** `tests/accountant-invite.test.mjs`

Added tests for:
- ✅ `abo-joud80@hotmail.com` (specific regression case)
- ✅ Emails with hyphens in username
- ✅ Emails with numbers in username
- ✅ Null/undefined/empty string rejection
- ✅ Invalid format rejection

**All 16 tests passing** ✅

## Changes Summary

| File | Changes |
|------|---------|
| `prisma/migrations/.../migration.sql` | Drop old `email` column |
| `lib/utils.ts` | Add `normalizeEmail()` utility |
| `app/actions/accountant-access-actions.ts` | Use new utility + runtime guards + detailed logging |
| `app/(dashboard)/accountant-access/accountant-access-content.tsx` | Consistent client-side normalization |
| `tests/accountant-invite.test.mjs` | Regression tests + updated test helper |

## Verification

✅ **Tests:** All 16 unit tests passing  
✅ **Build:** `npm run build` successful  
✅ **Code Review:** Completed, issues addressed  
✅ **Security:** CodeQL scan - no vulnerabilities  
✅ **P2011 Error:** Cannot occur anymore (column dropped)  
✅ **Valid Emails:** No longer rejected

## Acceptance Criteria Met

✅ Invite submit does NOT show "Ongeldig e-mailadres" for valid emails  
✅ Server creates AccountantInvite successfully (no P2011)  
✅ DB record has email = normalized string (non-null)  
✅ Tests pass: npm test  
✅ Build succeeds: npm run build  

## Migration Instructions

When deploying this fix:

1. **Apply the database migration:**
   ```bash
   npx prisma migrate deploy
   ```
   This will drop the old `email` column from the `AccountantInvite` table.

2. **Deploy the code changes** (already included in this PR)

3. **Verify:** Test creating a new accountant invite with `abo-joud80@hotmail.com`
   - Should succeed without errors
   - Should create record in database with `invitedEmail` set
   - Should send email successfully

## Notes

- The fix is **backward compatible** - existing records are not affected
- No data migration needed - old `email` column can be safely dropped
- All email normalization now uses a single, strict utility function
- Detailed logging helps diagnose any future issues
- Runtime guards prevent null values from ever reaching Prisma

---

**Status:** ✅ Complete and tested  
**Impact:** Critical bug fix  
**Risk:** Low (migration drops unused column only)
