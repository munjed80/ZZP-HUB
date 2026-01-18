# Accountant Access Feature

## Overview

The Accountant Access feature enables company owners to invite accountants to access their company data with granular role-based permissions. Accountants can manage multiple companies from a centralized portal with secure company context switching.

## Features

### 1. Role-Based Access Control

Four user roles with specific permissions:

- **COMPANY_ADMIN** (Owner): Full access to company data, can invite accountants
- **STAFF**: Can create and edit invoices, clients, expenses
- **ACCOUNTANT_VIEW**: Read-only access + export functionality
- **ACCOUNTANT_EDIT**: Full edit access + export + VAT closure actions

### 2. Invitation System

Company owners can invite accountants via email:
1. Navigate to `/accountant-access`
2. Enter accountant's email and select role
3. System generates secure invitation link (7-day expiry)
4. Accountant accepts invitation at `/accept-invite?token=...`
5. Access is automatically granted

### 3. Accountant Portal

Accountants access all their companies at `/accountant-portal`:
- Search and filter companies
- View company status cards with:
  - Unpaid invoices count
  - Invoices due soon
  - VAT deadline indicators
- Click to switch company context

### 4. Company Context Switching

For accountants managing multiple companies:
- Active company shown in header with dropdown switcher
- Secure cookie-based context storage
- All queries automatically filtered to active company
- No data leakage between companies

### 5. Export Functionality

Export comprehensive data packages for accounting:
- Invoices (CSV)
- Expenses (CSV)
- VAT Summary (JSON + CSV)
- Period-based filtering
- Accessible via ExportButton component on BTW-aangifte page

## Security Architecture

### Multi-Tenant Isolation

```typescript
// All queries are automatically scoped by company context
const { userId } = await requireTenantContext(); // Returns active companyId
```

- **Hard isolation**: Every query filtered by companyId
- **Permission checks**: All actions verified via `requireCompanyAccess()`
- **Audit logging**: All access attempts logged with user, company, permission
- **Token-based invites**: Secure 7-day expiring invitation tokens

### Permission System

```typescript
type Permission = "read" | "write" | "export" | "vat_actions";

// Check access before any operation
await requireCompanyAccess(userId, companyId, "export");
```

### Company Context Flow

1. User logs in → Session created
2. For accountants → Active company context loaded from cookie
3. All queries use `requireTenantContext()` → Returns active companyId
4. Company owners always see their own data (userId)
5. Accountants see data for active company context

## Implementation Details

### Database Schema

```prisma
model CompanyMember {
  id        String   @id @default(uuid())
  companyId String
  userId    String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  company    User @relation("CompanyOwner", ...)
  accountant User @relation("AccountantMember", ...)
  
  @@unique([companyId, userId])
  @@index([companyId])
  @@index([userId])
}

model AccountantInvite {
  id         String    @id @default(uuid())
  companyId  String
  email      String
  role       UserRole
  token      String    @unique
  expiresAt  DateTime
  acceptedAt DateTime?
  createdAt  DateTime  @default(now())
  
  company User @relation(...)
  
  @@index([companyId])
  @@index([token])
  @@index([email])
}
```

### Server Actions

Located in `app/actions/accountant-access-actions.ts`:

- `inviteAccountant(email, role)` - Create invitation
- `acceptInvite(token)` - Accept invitation
- `revokeAccountantAccess(memberId)` - Remove access
- `listCompanyMembers()` - List linked accountants
- `getAccountantCompanies()` - Get companies for accountant
- `getPendingInvites()` - View pending invitations
- `cancelInvite(inviteId)` - Cancel invitation

### UI Components

**Pages:**
- `/accountant-access` - Manage accountant access (company side)
- `/accountant-portal` - View and switch companies (accountant side)
- `/accept-invite` - Accept invitation token

**Components:**
- `CompanySwitcher` - Header dropdown for switching companies
- `ExportButton` - Export data for accountants
- `AccountantAccessContent` - Invitation and member management
- `AccountantPortalContent` - Company cards with status

## Usage Examples

### For Company Owners

**Invite an accountant:**
```typescript
// Navigate to /accountant-access
// 1. Enter email: accountant@example.com
// 2. Select role: ACCOUNTANT_VIEW or ACCOUNTANT_EDIT
// 3. Click "Uitnodiging versturen"
// 4. Share generated link with accountant
```

**Revoke access:**
```typescript
// Navigate to /accountant-access
// Click revoke button next to accountant's name
```

### For Accountants

**Accept invitation:**
```typescript
// Click invitation link
// Auto-redirected after acceptance
// Company appears in /accountant-portal
```

**Switch between companies:**
```typescript
// Method 1: Click company in /accountant-portal
// Method 2: Use header dropdown switcher
```

**Export data:**
```typescript
// Navigate to /btw-aangifte
// Click "Export voor accountant" button
// Select date range
// Download 4 files (invoices, expenses, VAT summaries)
```

## Testing

### Manual Testing Checklist

- [ ] Company owner can invite accountant
- [ ] Invitation email/link is generated
- [ ] Accountant can accept invitation
- [ ] Accountant sees company in portal
- [ ] Accountant can switch between companies
- [ ] Data is correctly filtered per company
- [ ] Role permissions are enforced (VIEW vs EDIT)
- [ ] Export generates correct files
- [ ] SUPERADMIN has appropriate access
- [ ] No cross-company data leakage

### Security Testing

- [ ] Cannot access other companies' data
- [ ] Token expiry works (7 days)
- [ ] Invalid tokens are rejected
- [ ] Permission checks prevent unauthorized actions
- [ ] Audit logs capture access attempts

## API Reference

### Helper Functions

```typescript
// Check company access
await requireCompanyAccess(userId, companyId, "read");

// Get active company ID
const companyId = await getActiveCompanyId();

// Switch company context
await setActiveCompanyId(newCompanyId);

// Get user's companies
const companies = await getUserCompanies(userId);

// Get company members
const members = await getCompanyMembers(companyId);
```

## Migration Guide

Migration file: `prisma/migrations/20260118151555_add_accountant_access/migration.sql`

**Run migration:**
```bash
npx prisma migrate deploy
```

**Generate client:**
```bash
npx prisma generate
```

## Configuration

No additional configuration needed. The feature uses:
- Secure HTTP-only cookies for context storage
- Environment variables already in place
- Existing authentication system

## Troubleshooting

**Issue: Accountant cannot see company data**
- Check CompanyMember record exists
- Verify active company context is set
- Check user role permissions

**Issue: Invitation link doesn't work**
- Verify token hasn't expired (7 days)
- Check AccountantInvite record exists
- Ensure email matches logged-in user

**Issue: Export fails**
- Verify user has "export" permission
- Check company access is granted
- Ensure date range is valid

## Future Enhancements

Potential improvements:
- Email notifications for invitations
- Activity logs for accountants
- Custom permission templates
- Multi-company bulk export
- Accountant notes/annotations
- Client communication through platform
