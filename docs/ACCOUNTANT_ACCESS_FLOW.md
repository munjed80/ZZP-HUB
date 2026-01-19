# Accountant Access Flow Documentation

## Overview

The ZZP-HUB application provides secure accountant access to client companies without requiring accountants to manually register accounts. This document explains the flow and security measures.

## Flow Diagram

```
1. Company Admin → Creates invite via /accountant-access
2. System → Generates secure token + 6-digit OTP
3. System → Sends email with OTP and verify link to accountant
4. Accountant → Opens /accountant-verify?token=xxx
5. Accountant → Enters 6-digit OTP code
6. System → Validates OTP and token
7. System → Auto-creates "shadow" user if email doesn't exist
8. System → Creates accountant session cookie (zzp-accountant-session)
9. System → Creates CompanyMember record linking user to company
10. Accountant → Redirected to /accountant-portal
```

## No Manual Registration

**Key principle:** Accountants never see a registration screen or set a password manually.

### How it works:

1. **Invite-only access**: Accountants can only get access through an invitation from a company admin
2. **Shadow user creation**: When an invite is accepted:
   - If the email doesn't exist → A new User record is auto-created
   - Password is auto-generated and never shown to user
   - User is marked as `emailVerified: true` (verified via invite)
   - User is marked as `onboardingCompleted: true` (skips onboarding)
3. **Session-based access**: Accountants use a cookie-based session, not password login

### Security benefits:

- No password to remember or manage
- No password reset flow needed for accountants
- Session is scoped to specific company
- Access can be revoked instantly by company admin

## Middleware Architecture (Edge-Compatible)

The middleware is designed to be Edge-compatible, meaning:

1. **No Prisma/DB calls in middleware** - Edge runtime doesn't support Prisma
2. **No `next/headers cookies()` for auth** - Can cause issues in Edge
3. **Cookie presence check only** - Middleware only checks if cookie EXISTS

### Middleware flow:

```javascript
// Simplified middleware logic
if (hasAccountantSessionCookie) {
  if (isAccountantAllowedRoute) {
    return NextResponse.next(); // Allow request
  }
  return NextResponse.redirect('/accountant-portal'); // Redirect
}

// Fall through to NextAuth check...
```

### Deep validation happens server-side:

In API routes, server actions, and server components:
- Session lookup in database
- Expiry check
- Permission verification
- Tenant isolation

## Structured Logging

The following events are logged for security auditing:

| Event | When | Data Logged |
|-------|------|-------------|
| `ACCOUNTANT_INVITE_ACCEPTED` | Invite is accepted | userId, email, companyId, role, isNewUser |
| `ACCOUNTANT_SESSION_COOKIE_SET` | Session cookie created | userId, companyId, role, isNewUser |
| `ACCOUNTANT_SESSION_COOKIE_SET_FAILED` | Cookie creation fails | error, userId |
| `ACCOUNTANT_PORTAL_SESSION_VALID` | Valid session found | userId, companyId, role |
| `ACCOUNTANT_PORTAL_SESSION_INVALID` | Session invalid/expired | reason, userId (if available) |

## Cookie Details

| Property | Value |
|----------|-------|
| Name | `zzp-accountant-session` |
| HttpOnly | `true` |
| Secure | `true` (production only) |
| SameSite | `lax` |
| Max-Age | 30 days |
| Path | `/` |

## Session Database Record

The `AccountantSession` model stores:

```prisma
model AccountantSession {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  email        String
  companyId    String
  role         UserRole
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  lastAccessAt DateTime @default(now())
}
```

## Allowed Routes for Accountants

Accountants can access:
- `/accountant-portal` - Company overview
- `/dashboard` - Company dashboard
- `/facturen` - Invoices
- `/relaties` - Clients
- `/uitgaven` - Expenses
- `/btw-aangifte` - VAT
- `/agenda` - Calendar

Accountants are redirected to `/accountant-portal` if trying to access:
- `/instellingen` - Settings
- `/admin/**` - Admin pages
- `/setup` - Onboarding
- Any other restricted routes

## Revoking Access

Company admins can revoke accountant access via:
1. Go to `/accountant-access`
2. Find the accountant in the "Current Access" list
3. Click "Revoke Access"

This will:
- Delete the `CompanyMember` record
- Any existing `AccountantSession` records for that user/company will fail validation on next request
