# Multi-Tenant Migration Guide

## Overview
This document provides a step-by-step guide for completing the multi-tenant migration for ZZP-HUB.

## Prerequisites
- Database backup completed
- All current data is consistent
- No active users during migration

## Migration Steps

### Step 1: Update Prisma Schema
The schema has been updated with:
- Company model as tenant anchor
- companyId FK on all tenant-bound models
- Composite indexes for performance
- Cascade delete rules

### Step 2: Generate Prisma Migration
```bash
npx prisma migrate dev --name add_multi_tenant_support
```

This will:
- Add the Company table
- Add companyId columns to all tenant models
- Add all composite indexes
- Update unique constraints to be company-scoped

### Step 3: Run Data Migration
After the schema migration, populate companyId values:

```bash
npx tsx scripts/migrate-multi-tenant.ts
```

This script:
- Creates a Company for each existing CompanyProfile
- Links Users to their Companies
- Populates companyId on all tenant entities

### Step 4: Make companyId Non-Nullable (Optional but Recommended)
After data migration, make companyId required:

1. Update schema.prisma - change `companyId String?` to `companyId String` on all tenant models
2. Run: `npx prisma migrate dev --name make_company_id_required`

### Step 5: Refactor Remaining Code
Use the tenant safety checker to find remaining direct Prisma usage:

```bash
node scripts/check-tenant-safety.mjs
```

For each violation, refactor to use tenantPrisma:
- Replace `prisma.model.findMany(...)` with `tenantPrisma.model.findMany(...)`
- Replace `prisma.model.create(...)` with `tenantPrisma.model.create(...)`
- Remove manual userId filtering (tenant helpers do this automatically)

## Files Still Requiring Refactoring

Based on the safety checker, the following files need updates:

### High Priority (Data Access)
1. `app/(dashboard)/agenda/actions.ts` - Event CRUD operations
2. `app/(dashboard)/offertes/actions.tsx` - Quotation operations
3. `app/(dashboard)/facturen/[id]/page.tsx` - Invoice detail page
4. `app/(dashboard)/facturen/[id]/edit/page.tsx` - Invoice edit page
5. `app/(dashboard)/offertes/[id]/page.tsx` - Quotation detail page
6. `actions/time-actions.ts` - Time entry operations

### Medium Priority (Admin/Settings)
7. `app/(dashboard)/instellingen/actions.ts` - Settings page
8. `app/(dashboard)/btw-aangifte/actions.ts` - VAT reporting

### Low Priority (Support)
9. `app/api/support/route.ts` - Support message creation

## Refactoring Pattern

### Before:
```typescript
const { id: userId, role } = await requireUser();
const invoices = await prisma.invoice.findMany({
  where: role === UserRole.SUPERADMIN ? {} : { userId },
});
```

### After:
```typescript
await requireUser();
const invoices = await tenantPrisma.invoice.findMany({});
```

## Testing

### Run Integration Tests
```bash
npx tsx tests/multi-tenant-isolation.test.ts
```

Expected results:
- ✅ Company A cannot read Company B's data
- ✅ SUPERADMIN can access cross-tenant data
- ✅ Unique constraints are tenant-scoped
- ✅ Cascade delete works

### Run Tenant Safety Check
```bash
node scripts/check-tenant-safety.mjs
```

Should show 0 violations after all refactoring is complete.

## Rollback Plan

If issues arise:

1. Revert Prisma migrations:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

2. Restore database from backup

3. Revert code changes via git

## Performance Monitoring

After deployment, monitor:
- Query performance (should improve with indexes)
- Database size
- API response times

## Security Verification

Verify tenant isolation:
1. Login as Company A user
2. Attempt to access Company B data via API/UI
3. Confirm proper 404/403 errors
4. Test SUPERADMIN access in admin routes only

## Production Deployment Checklist

- [ ] Database backup completed
- [ ] Prisma migration generated and reviewed
- [ ] Data migration script tested on staging
- [ ] All tests passing
- [ ] Tenant safety checker shows 0 violations
- [ ] Performance benchmarks acceptable
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window
- [ ] Monitoring dashboards ready
