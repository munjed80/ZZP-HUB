# Accountant Invite Flow - Testing Guide

## Overview
This document describes how to test the new accountant invite flow that allows accountants to access company data without requiring full NextAuth login.

## Key Changes

### 1. Database Schema
- Added `AccountantSession` table to store cookie-based sessions
- Sessions have 30-day expiry with automatic cleanup
- Each session is tied to a specific userId, email, companyId, and role

### 2. Session Management
- New `lib/auth/accountant-session.ts` - Manages accountant sessions
- New `lib/auth/combined-session.ts` - Unified session handling for both NextAuth and accountant sessions
- Updated `lib/auth/tenant.ts` - Supports both session types

### 3. Middleware Updates
- Middleware now checks for both NextAuth and accountant sessions
- Accountant sessions can access: `/accountant-portal`, `/dashboard`, `/facturen`, `/relaties`, `/uitgaven`, `/btw-aangifte`, `/agenda`
- Accountants accessing disallowed routes are redirected to `/accountant-portal`

### 4. Invite Accept Flow
- `/api/invite/accept` POST endpoint now creates an accountant session
- Sets secure HTTP-only cookie for session management
- New users get auto-created accounts with secure passwords
- Existing users get immediate session access
- All users redirect to `/accountant-portal` (no login page redirect)

### 5. Audit Logging
- New `lib/auth/security-audit.ts` - Security event logging
- Logs: invite creation, invite acceptance, session creation, company access grants
- Uses existing AiActionAuditLog table for storage

## Testing Steps

### Test 1: New User Invite Flow
**Goal**: Verify that a new accountant can accept an invite and access the portal without manual login.

1. **As Company Owner:**
   - Log in to the application
   - Navigate to `/accountant-access`
   - Enter a new email address (one not in the system)
   - Select role: `ACCOUNTANT_VIEW` or `ACCOUNTANT_EDIT`
   - Click "Uitnodiging versturen"
   - Copy the invite URL from the response

2. **As New Accountant (use incognito/private window):**
   - Open the invite URL
   - Verify you see company name and email
   - Verify message says "Nieuw account wordt aangemaakt"
   - Click "Uitnodiging Accepteren"
   - Wait for success message
   - **Expected**: Automatic redirect to `/accountant-portal`
   - **Expected**: You should see the company in the portal
   - **Expected**: No login page should appear

3. **Verify Session:**
   - Check browser cookies - should see `zzp-accountant-session` cookie
   - Cookie should be httpOnly, secure (in production), sameSite=lax
   - Navigate to allowed routes like `/facturen`, `/btw-aangifte`
   - **Expected**: All routes should work without login

4. **Verify Tenant Isolation:**
   - Try to access data from another company (if possible)
   - **Expected**: Should only see data for the invited company
   - Try to modify URL parameters to access other company data
   - **Expected**: Should be blocked or see no data

### Test 2: Existing User Invite Flow
**Goal**: Verify that an existing user can accept an invite and get immediate access.

1. **Setup**: Create a test user account first (via regular registration)

2. **As Company Owner:**
   - Navigate to `/accountant-access`
   - Invite the existing user's email
   - Select role: `ACCOUNTANT_EDIT`
   - Copy invite URL

3. **As Existing Accountant (incognito window):**
   - Open invite URL
   - **Expected**: Should NOT see "Nieuw account wordt aangemaakt"
   - Click "Uitnodiging Accepteren"
   - **Expected**: Redirect to `/accountant-portal`
   - **Expected**: Immediate access without login

### Test 3: Session Expiry and Security
**Goal**: Verify that sessions expire correctly and security measures are in place.

1. **Session Cookie Validation:**
   - Accept an invite
   - Check that cookie has 30-day expiry
   - Delete the cookie manually
   - Try to access `/accountant-portal`
   - **Expected**: Should be redirected to `/login`

2. **Invalid Token Test:**
   - Try to access `/accept-invite?token=invalid-token`
   - **Expected**: Should show error message "Uitnodiging niet gevonden"

3. **Expired Invite Test:**
   - Create invite, wait for expiry (or manually update DB)
   - Try to accept expired invite
   - **Expected**: Should show "Deze uitnodiging is verlopen"

4. **Already Used Invite:**
   - Accept an invite
   - Try to use the same invite link again
   - **Expected**: Should show "Deze uitnodiging is al geaccepteerd"

### Test 4: Middleware Protection
**Goal**: Verify that accountants can only access allowed routes.

1. **After accepting invite:**
   - Navigate to `/accountant-portal` - **Expected**: ✓ Access granted
   - Navigate to `/dashboard` - **Expected**: ✓ Access granted
   - Navigate to `/facturen` - **Expected**: ✓ Access granted
   - Navigate to `/btw-aangifte` - **Expected**: ✓ Access granted
   - Navigate to `/instellingen` - **Expected**: ✗ Redirect to `/accountant-portal`
   - Navigate to `/admin` - **Expected**: ✗ Redirect to `/accountant-portal`
   - Navigate to `/onboarding` - **Expected**: ✗ Redirect to `/accountant-portal`

### Test 5: Audit Logging
**Goal**: Verify that security events are logged.

1. **Check Database Logs:**
   - After invite creation, check `AiActionAuditLog` table
   - **Expected**: Entry with actionType = `SECURITY_INVITE_CREATED`
   
2. **After invite acceptance:**
   - Check `AiActionAuditLog` table
   - **Expected**: Entries for:
     - `SECURITY_INVITE_ACCEPTED`
     - `SECURITY_COMPANY_ACCESS_GRANTED`
     - `SECURITY_ACCOUNTANT_SESSION_CREATED`

3. **Verify Log Contents:**
   - Logs should include userId, companyId, email, role
   - Logs should NOT include passwords or sensitive data

### Test 6: Multiple Companies (for accountants)
**Goal**: Verify accountants can access multiple companies.

1. **Setup**: Get invites from two different companies

2. **Accept both invites** (same email, different companies)

3. **Navigate to `/accountant-portal`:**
   - **Expected**: Should see both companies listed
   - Click on one company
   - **Expected**: Should access that company's data
   - Use company switcher to change companies
   - **Expected**: Should see different company's data

### Test 7: Migration from Old Flow (if applicable)
**Goal**: Verify existing invites still work.

1. **Check existing pending invites:**
   - Existing invites should still be in `AccountantInvite` table
   - Try accepting an old invite
   - **Expected**: Should work with new session flow

## Expected Behavior Summary

### New Users
- ✓ Auto-created account with secure password
- ✓ Email sent with credentials (optional - they won't need it immediately)
- ✓ Immediate accountant session created
- ✓ Redirect to `/accountant-portal`
- ✓ No manual login required

### Existing Users
- ✓ Link to company created
- ✓ Immediate accountant session created
- ✓ Redirect to `/accountant-portal`
- ✓ No manual login required

### Security
- ✓ Sessions expire after 30 days
- ✓ Secure HTTP-only cookies
- ✓ Tenant isolation enforced
- ✓ All security events logged
- ✓ Invalid/expired tokens rejected
- ✓ Accountants restricted to allowed routes

## Troubleshooting

### Issue: "Niet geauthenticeerd" error
**Cause**: Session cookie not set or expired
**Fix**: Accept invite again or check cookie settings

### Issue: Cannot access company data
**Cause**: CompanyMember relationship not created
**Fix**: Check database for CompanyMember record

### Issue: Redirected to login after accept
**Cause**: Session creation failed or middleware not checking accountant session
**Fix**: Check server logs for session creation errors

### Issue: Can access other companies' data
**Cause**: Tenant isolation not working
**Fix**: Critical security issue - check `requireTenantContext()` implementation

## Database Verification Queries

```sql
-- Check accountant sessions
SELECT * FROM "AccountantSession" WHERE "userId" = 'user-id';

-- Check company members
SELECT * FROM "CompanyMember" WHERE "userId" = 'user-id';

-- Check invites
SELECT * FROM "AccountantInvite" WHERE email = 'accountant@example.com';

-- Check audit logs
SELECT * FROM "AiActionAuditLog" 
WHERE "actionType" LIKE 'SECURITY_%' 
ORDER BY "createdAt" DESC;
```

## Success Criteria

- [ ] New accountants can accept invites without creating accounts manually
- [ ] Existing accountants get immediate access after accepting
- [ ] No redirect to `/login` page
- [ ] All allowed routes accessible with accountant session
- [ ] Disallowed routes redirect to `/accountant-portal`
- [ ] Sessions expire after 30 days
- [ ] Tenant isolation prevents cross-company data access
- [ ] All security events are logged
- [ ] Build passes without errors
- [ ] No TypeScript errors
- [ ] Linter passes
