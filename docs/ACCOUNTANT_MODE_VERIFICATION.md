# Accountant Mode Verification Checklist

This document describes how to verify the SnelStart-style "Accountant Mode" implementation.

## Architecture Overview

The accountant mode is implemented at the **company membership level**, not as a global user role.

### Key Data Model

```prisma
enum CompanyRole {
  OWNER
  STAFF
  ACCOUNTANT
}

enum CompanyUserStatus {
  PENDING
  ACTIVE
  REVOKED
  EXPIRED
}

model CompanyUser {
  id           String            @id @default(uuid())
  companyId    String            // The company being accessed
  userId       String?           // The user with access (null when PENDING)
  invitedEmail String?           // Email invited (before user accepts)
  role         CompanyRole       // OWNER | STAFF | ACCOUNTANT
  status       CompanyUserStatus // PENDING | ACTIVE | REVOKED | EXPIRED
  canRead      Boolean           @default(true)
  canEdit      Boolean           @default(false)
  canExport    Boolean           @default(false)
  canBTW       Boolean           @default(false)
  // ... timestamps
}
```

### Active Company Context

- Stored in cookie: `zzp-hub-active-company`
- Set via Route Handler: `POST /api/session/active-company`
- Alternative: `GET /switch-company?companyId=X&next=/dashboard`
- Context utility: `lib/auth/company-context.ts`

## Verification Steps

### 1. Create Invite Flow

1. Log in as a company owner (COMPANY_ADMIN)
2. Go to `/instellingen`
3. Scroll to "Accountant uitnodigingen" section
4. Enter an email address and click "Uitnodigen"
5. Verify:
   - Success toast appears
   - Invite appears in the list with status "In afwachting"
   - Email is sent (or copy link provided if email fails)

### 2. Accept Invite Flow

1. Log in as the invited accountant (or create a new account with that email)
2. Use the invite link: `/accept-invite?token=...`
3. Verify:
   - Page shows "Toegang verleend" after processing
   - For single company: auto-redirects to `/switch-company?companyId=X&next=/dashboard`
   - For multiple companies: shows company selector
4. Verify after redirect:
   - Cookie `zzp-hub-active-company` is set with the company UUID
   - Dashboard shows with accountant mode UI

### 3. Accountant Mode UI

When in accountant mode, verify:

1. **Header**: Shows company name + "Accountant" badge
2. **Company Switcher**: Visible in header for switching between companies
3. **Navigation**: Limited menu items (no Relaties, Offertes, Agenda, Uren, AI Assist, Instellingen)
4. **Actions**: New invoice/expense buttons may be disabled

### 4. Permission Guards

Test route access with an accountant:

| Route | Expected Behavior |
|-------|-------------------|
| `/dashboard` | ✅ Accessible |
| `/facturen` | ✅ Accessible |
| `/uitgaven` | ✅ Accessible |
| `/btw-aangifte` | ✅ Accessible |
| `/relaties` | ❌ Blocked (owner-only) |
| `/offertes` | ❌ Blocked (owner-only) |
| `/agenda` | ❌ Blocked (owner-only) |
| `/uren` | ❌ Blocked (owner-only) |
| `/instellingen` | ❌ Blocked (owner-only) |

### 5. API Permission Guards

Test API endpoints:

```bash
# Should work with canRead permission
GET /api/invoices
GET /api/expenses

# Should be blocked without canEdit permission
POST /api/invoices
PUT /api/expenses/:id

# Should be blocked without canBTW permission
GET /api/btw/summary (if checking canBTW)

# Should be blocked without canExport permission
GET /api/export/invoices
```

### 6. Company Switch Flow

1. Access `/switch-company?companyId={VALID_UUID}&next=/dashboard`
2. Verify:
   - Cookie is set correctly
   - Redirects to `/dashboard`
   - Dashboard shows correct company context

### 7. Revoke/Remove Access

1. As company owner, go to `/instellingen`
2. For pending invite: click "Intrekken" (revoke)
3. For active accountant: click "Verwijderen" (remove access)
4. Verify:
   - Accountant can no longer access the company
   - Attempting to switch to that company fails

## Cookie Handling

The implementation correctly uses Route Handlers for cookie operations:

- `GET /switch-company` - Route Handler (`app/switch-company/route.ts`)
- `POST /api/session/active-company` - Route Handler (`app/api/session/active-company/route.ts`)

**Important**: Cookies are NOT set in Server Component pages, which would cause Next.js errors.

## Files Changed

### Core Implementation

- `prisma/schema.prisma` - CompanyUser model with permissions
- `lib/auth/company-context.ts` - Active company context utilities
- `lib/auth/route-guards.ts` - Server-side route guards
- `lib/auth/tenant.ts` - Tenant isolation utilities

### API Routes

- `app/api/accountants/invite/route.ts` - Create invite
- `app/api/accountants/accept/route.ts` - Accept invite
- `app/api/session/active-company/route.ts` - Set active company cookie
- `app/switch-company/route.ts` - Switch company with redirect

### UI Components

- `app/(dashboard)/layout.tsx` - Dashboard shell with accountant mode
- `components/layout/sidebar.tsx` - Navigation with role-based visibility
- `components/layout/company-switcher.tsx` - Company switcher UI

### Actions

- `app/(dashboard)/instellingen/actions.ts` - Server actions for invite management

## Known Limitations

1. `UserRole.ACCOUNTANT` exists in the schema but is NOT used for actual accountant functionality. The proper `CompanyRole.ACCOUNTANT` from `CompanyUser` is used instead.

2. The notes API (`/api/notes/*`) is not yet implemented - the `notes-list.tsx` component is a work-in-progress.
