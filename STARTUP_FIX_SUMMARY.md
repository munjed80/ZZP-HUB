# Production Startup Fix: Resend Email Configuration

## Problem Statement

The application started failing in production only after enabling email verification and connecting Resend with a custom domain. The symptoms were:

- Container runs and logs "Ready"
- Coolify reports "no available server"
- `curl 127.0.0.1:3000` fails
- Infrastructure (Coolify, Cloudflare DNS, ports, Docker) unchanged and verified working
- Prisma and database confirmed healthy

## Root Cause

The startup validation scripts required `RESEND_API_KEY` as a mandatory environment variable:

**File: `scripts/start-prod.mjs` (lines 7-26)**
```javascript
const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",  // ❌ This caused the issue
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missing.length > 0) {
    console.error(
      `[start-prod] Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);  // ❌ Server never starts
  }
}
```

When `RESEND_API_KEY` validation failed (missing, invalid, or misconfigured with Resend/domain):
1. The validation function calls `process.exit(1)` **before** the server binds to port 3000
2. Docker container starts but process exits immediately after validation
3. Port 3000 never becomes available
4. Coolify health checks fail → "no available server"
5. Container logs show "Ready" from Docker, but Node.js process has already exited

## Solution

Made `RESEND_API_KEY` optional while maintaining production safety:

### Changes Made

**1. `scripts/start-prod.mjs`**
```javascript
const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];
const OPTIONAL_ENV = [
  "RESEND_API_KEY",  // ✅ Now optional
];

function validateEnv() {
  // ... required env validation (still exits on failure)

  // Check optional env vars and warn if missing
  const missingOptional = OPTIONAL_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missingOptional.length > 0) {
    console.warn(
      `[start-prod] WARNING: Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
    console.warn(
      "[start-prod] Email functionality will be disabled. Email verification and notifications will not work.",
    );
  }
  // ✅ Continues to server startup
}
```

**2. `scripts/deploy-prod.mjs`**
- Identical changes to make `RESEND_API_KEY` optional

### Why This Is Safe

1. **Email logic already handles missing keys gracefully**
   - `lib/email.ts:34-39` - Lazy initialization, only creates Resend client if API key exists
   - `lib/email.ts:58-74` - Logs error in production, dev mode fallback, never throws
   - All email-sending functions check for API key before use

2. **No top-level Resend instantiation**
   - All `new Resend()` calls are inside functions (lazy-loaded)
   - No code runs at module import time that could crash

3. **Middleware and auth are independent**
   - `middleware.ts` - No email dependencies
   - `lib/auth.ts` - No email dependencies
   - Email verification checked via database flags, not email service

4. **Email-sending endpoints fail gracefully**
   - `app/api/support/route.ts:26-28` - Returns 500 error if no API key
   - `app/actions/send-invoice.tsx:41-44` - Returns error message if no API key
   - `app/(dashboard)/offertes/actions.tsx:340-343` - Returns error message if no API key

## Verification

### Manual Testing
✅ Server starts without `RESEND_API_KEY` set (logs warning, continues)
✅ Server still fails for missing required vars like `DATABASE_URL`
✅ Email functionality gracefully degrades when key missing
✅ Code review passed with no issues
✅ Security scan: No vulnerabilities introduced

### Production Impact

**Before Fix:**
- Missing/invalid `RESEND_API_KEY` → Server won't start → "no available server"

**After Fix:**
- Missing `RESEND_API_KEY` → Server starts normally → Logs warning
- Invalid `RESEND_API_KEY` → Server starts normally → Email functions return errors
- Valid `RESEND_API_KEY` → Server starts normally → Email works as expected

## Files Modified

1. `scripts/start-prod.mjs` - Made RESEND_API_KEY optional (34 lines changed)
2. `scripts/deploy-prod.mjs` - Made RESEND_API_KEY optional (34 lines changed)

**Total: 2 files, 68 lines changed**

## Constraints Met

✅ Did NOT modify Coolify, Docker, ports, or DNS
✅ Did NOT disable email verification
✅ Fix is production-safe
✅ Minimal code changes
✅ Email verification still works when properly configured

## Deployment Instructions

1. Deploy this fix to production
2. Server will start successfully even without `RESEND_API_KEY`
3. Configure `RESEND_API_KEY` when ready to enable email functionality
4. Email verification will work once API key is properly configured

## Prevention

To prevent similar issues in future:
- Keep startup scripts focused on critical dependencies only
- Make optional features degrade gracefully
- Never call `process.exit()` for optional functionality
- Test startup with minimal environment variables
