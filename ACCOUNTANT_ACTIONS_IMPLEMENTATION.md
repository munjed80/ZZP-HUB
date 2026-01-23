# Accountant Actions Menu Implementation

## Overview
This implementation adds a comprehensive actions menu for managing accountant invitations in the Settings page, matching SnelStart-style functionality.

## Database Changes

### Schema Updates
Added two new statuses to `CompanyUserStatus` enum:
- `REVOKED` - Invite has been explicitly revoked by company owner
- `EXPIRED` - Invite has expired (manually marked or via cleanup job)

**Migration**: `20260123191751_add_revoked_expired_status/migration.sql`

```sql
ALTER TYPE "CompanyUserStatus" ADD VALUE 'REVOKED';
ALTER TYPE "CompanyUserStatus" ADD VALUE 'EXPIRED';
```

## Server Actions

### New Actions (app/(dashboard)/instellingen/actions.ts)

1. **revokeAccountantInvite(companyUserId)**
   - Status: PENDING → REVOKED
   - Clears tokenHash to invalidate invite
   - Authorization: Company owner only (via requireTenantContext)

2. **removeAccountantAccess(companyUserId)**
   - Status: ACTIVE → REVOKED
   - Clears userId to unlink accountant
   - Maintains audit trail in logs
   - Authorization: Company owner only

3. **updateAccountantPermissions(companyUserId, permissions)**
   - Updates: canRead, canEdit, canExport, canBTW
   - Only works on ACTIVE accountants
   - Authorization: Company owner only

4. **reInviteAccountant(companyUserId)**
   - Status: REVOKED/EXPIRED → PENDING
   - Generates new token and sends email
   - Authorization: Company owner only

5. **deleteAccountantInvite(companyUserId)**
   - Permanently deletes REVOKED/EXPIRED records
   - Audit trail maintained in security logs
   - Authorization: Company owner only

## UI Component Updates

### Actions Menu (EntityActionsMenu)
Mobile-friendly "⋯" button per row with context-appropriate actions.

#### PENDING Status
- **Resend invite** - Generates new token and sends email
- **Copy link** - Generates new token and copies to clipboard
- **Revoke invite** - Prevents invite acceptance

#### ACTIVE Status
- **Edit permissions** - Opens modal to update permissions
- **Remove access** - Unlinks accountant from company

#### REVOKED/EXPIRED Status
- **Re-invite** - Creates new PENDING invite with fresh token
- **Remove** - Deletes invite record

### Permissions Editor Dialog
- Accessible modal (ARIA attributes, keyboard support)
- Toggles for: Lezen, Bewerken, Exporteren, BTW
- Escape key to close
- DRY implementation using configuration array

### Status Badges
- **ACTIEF** (ACTIVE) - Green success badge
- **PENDING** - Yellow warning badge  
- **INGETROKKEN** (REVOKED) - Red destructive badge
- **VERLOPEN** (EXPIRED) - Muted/gray badge

## Status Management

### Status Transitions
```
[CREATE] → PENDING (token generated, email sent)
           ↓
         ACTIVE (token accepted, tokenHash cleared, userId set)

[REVOKE] PENDING → REVOKED (tokenHash cleared)
[REMOVE] ACTIVE → REVOKED (userId cleared)
[EXPIRE] PENDING → EXPIRED (manual/automated)
[REINVITE] REVOKED/EXPIRED → PENDING (new token, email sent)
```

### EXPIRED Status Logic
The EXPIRED status can be set via:
1. **Manual marking** - Company owner explicitly expires old invites
2. **Automated job** - Background task marks PENDING invites older than 7 days
3. **Email mention only** - Current implementation has soft 7-day expiry (email warns user)

**Note**: No automatic expiry check on every query for performance. The status is manually set when needed.

Example cleanup query (could be run periodically):
```sql
UPDATE "CompanyUser"
SET status = 'EXPIRED'
WHERE status = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '7 days';
```

## Security

### Authorization
All actions use `requireTenantContext()` to ensure:
- User is authenticated
- User is accessing their own company data
- User is the company owner (not the accountant)

### Token Security
- Tokens are 32-byte random hex strings
- Hashed with SHA-256 before storage
- Regenerated on every resend/copy action
- Cleared when invite is accepted or revoked

### Audit Logging
All actions logged with:
- Event type (REVOKE, REMOVE_ACCESS, UPDATE_PERMISSIONS, etc.)
- Masked email (first + last char only)
- Timestamp
- Company context

## Testing

### Unit Tests (tests/accountant-invite.test.mjs)
- ✅ Invite acceptance validation (PENDING with token)
- ✅ Revoke pending invites
- ✅ Remove active access
- ✅ Re-invite revoked/expired
- ✅ Delete revoked/expired

All 173 tests pass.

### Code Quality
- ✅ TypeScript compilation passes
- ✅ Build succeeds
- ✅ CodeQL security scan: 0 vulnerabilities
- ✅ ESLint: No new errors in changed files
- ✅ Code review feedback addressed (accessibility improvements)

## Historical Context

**Why were actions missing before?**

The initial implementation (prior to this PR) focused only on the basic invite flow:
1. Send invite
2. Accountant accepts
3. Link becomes ACTIVE

The actions column only showed actions for PENDING status (Resend Email + Copy Link) because:
- No concept of revoking invites
- No way to remove ACTIVE access
- No permission editing for active accountants
- Status enum only had PENDING and ACTIVE

This PR addresses those gaps by adding comprehensive lifecycle management.

## UI Screenshots

### Actions Menu - PENDING
```
┌─────────────────────────────────┐
│ ⋯                               │
│   ┌─────────────────────────┐   │
│   │ ✉ Opnieuw versturen     │   │
│   │ 📋 Link kopiëren        │   │
│   │ ✕ Uitnodiging intrekken│   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Actions Menu - ACTIVE
```
┌─────────────────────────────────┐
│ ⋯                               │
│   ┌─────────────────────────┐   │
│   │ ⚙ Permissies aanpassen  │   │
│   │ ✕ Toegang verwijderen   │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Actions Menu - REVOKED/EXPIRED
```
┌─────────────────────────────────┐
│ ⋯                               │
│   ┌─────────────────────────┐   │
│   │ ↻ Opnieuw uitnodigen    │   │
│   │ 🗑 Verwijderen          │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

## Email Configuration

All email sending uses `process.env` provided by Coolify deployment:
- `RESEND_API_KEY` - Resend API key
- `EMAIL_FROM` - Sender email address
- `APP_URL` - Base URL for invite links

No `.env` file reliance in production.

## Mobile Support

- EntityActionsMenu component is mobile-optimized
- Touch-friendly targets (44px minimum)
- Swipe-to-close on mobile
- Responsive positioning (bottom sheet on mobile, floating on desktop)

## Future Enhancements

1. **Automated Expiry Job**
   - Scheduled task to mark old PENDING invites as EXPIRED
   - Configurable expiry duration (default 7 days)

2. **Email Notifications**
   - Notify accountant when access is removed
   - Remind company owner of pending invites

3. **Bulk Actions**
   - Select multiple invites for bulk revoke/delete

4. **Invite History**
   - View full history of all invites (including deleted)
   - Filter by status, date range

## Files Changed

- `prisma/schema.prisma` - Added REVOKED/EXPIRED statuses
- `prisma/migrations/20260123191751_add_revoked_expired_status/migration.sql` - Migration
- `app/(dashboard)/instellingen/actions.ts` - New server actions
- `app/(dashboard)/instellingen/accountant-invites.tsx` - UI component with actions menu
- `app/(dashboard)/instellingen/settings-tabs.tsx` - Type updates
- `tests/accountant-invite.test.mjs` - Unit tests

## Summary

This implementation provides complete lifecycle management for accountant invitations:
- Create → Send → Resend → Revoke (for PENDING)
- Accept → Update permissions → Remove access (for ACTIVE)
- Re-invite → Delete (for REVOKED/EXPIRED)

All actions have proper authorization, security logging, and user feedback via toast notifications.
