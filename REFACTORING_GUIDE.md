# Quick Refactoring Reference

## Common Patterns

### Pattern 1: Simple findMany with scope
**Before:**
```typescript
const { id: userId, role } = await requireUser();
const items = await prisma.invoice.findMany({
  where: role === UserRole.SUPERADMIN ? {} : { userId },
  orderBy: { date: "desc" },
});
```

**After:**
```typescript
await requireUser();
const items = await tenantPrisma.invoice.findMany({
  orderBy: { date: "desc" },
});
```

---

### Pattern 2: findFirst/findUnique with ownership check
**Before:**
```typescript
const { id: userId, role } = await requireUser();
const item = await prisma.invoice.findFirst({
  where: role === UserRole.SUPERADMIN 
    ? { id: itemId } 
    : { id: itemId, userId },
  include: { client: true, lines: true },
});

if (!item) {
  throw new Error("Not found");
}
```

**After:**
```typescript
await requireUser();
const item = await tenantPrisma.invoice.findUnique({
  where: { id: itemId },
  include: { client: true, lines: true },
});
// Throws automatically if not found or wrong tenant
```

---

### Pattern 3: create with userId
**Before:**
```typescript
const userId = await getCurrentUserId();
if (!userId) {
  throw new Error("Not authenticated");
}

const item = await prisma.expense.create({
  data: {
    userId,
    description: data.description,
    amount: data.amount,
    // ... other fields
  },
});
```

**After:**
```typescript
const userId = await getCurrentUserId();
if (!userId) {
  throw new Error("Not authenticated");
}

const item = await tenantPrisma.expense.create({
  data: {
    userId,
    description: data.description,
    amount: data.amount,
    // ... other fields
    // companyId injected automatically
  },
});
```

---

### Pattern 4: update with ownership verification
**Before:**
```typescript
const { id: userId, role } = await requireUser();

// First verify ownership
const existing = await prisma.invoice.findFirst({
  where: role === UserRole.SUPERADMIN 
    ? { id: itemId }
    : { id: itemId, userId },
});

if (!existing) {
  throw new Error("Not found");
}

// Then update
const updated = await prisma.invoice.update({
  where: { id: itemId },
  data: { status: newStatus },
});
```

**After:**
```typescript
await requireUser();

const updated = await tenantPrisma.invoice.update({
  where: { id: itemId },
  data: { status: newStatus },
});
// Automatically verifies ownership and throws if not found
```

---

### Pattern 5: delete with ownership check
**Before:**
```typescript
const userId = await getCurrentUserId();
if (!userId) {
  throw new Error("Not authenticated");
}

const deleted = await prisma.client.deleteMany({
  where: { id: clientId, userId },
});

if (deleted.count === 0) {
  return { success: false, message: "Not found" };
}
```

**After:**
```typescript
await getCurrentUserId(); // Still validate auth

await tenantPrisma.client.delete({
  where: { id: clientId },
});
// Throws if not found or wrong tenant
```

---

### Pattern 6: updateMany/deleteMany
**Before:**
```typescript
const userId = await getCurrentUserId();
await prisma.client.updateMany({
  where: { id: clientId, userId },
  data: { name: newName },
});
```

**After:**
```typescript
await getCurrentUserId();
await tenantPrisma.client.update({
  where: { id: clientId },
  data: { name: newName },
});
// Use update instead of updateMany for single records
```

---

## Import Changes

### Add:
```typescript
import { tenantPrisma } from "@/lib/prismaTenant";
```

### Remove (usually):
```typescript
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client"; // If only used for scoping
```

---

## Common Mistakes to Avoid

❌ **DON'T** add companyId manually in where clauses:
```typescript
const items = await tenantPrisma.invoice.findMany({
  where: { companyId: someId }, // ❌ Already handled!
});
```

❌ **DON'T** use role checks for scoping:
```typescript
const scope = role === UserRole.SUPERADMIN ? {} : { userId }; // ❌ Not needed!
```

❌ **DON'T** use deleteMany/updateMany for single records:
```typescript
await tenantPrisma.client.deleteMany({ where: { id } }); // ❌ Use delete!
```

✅ **DO** keep userId for record ownership:
```typescript
await tenantPrisma.invoice.create({
  data: {
    userId,  // ✅ Still needed for user relation
    // companyId added automatically
  },
});
```

---

## Files Checklist

Copy this for tracking progress:

### Core Data Access
- [ ] app/(dashboard)/agenda/actions.ts
- [ ] app/(dashboard)/offertes/actions.tsx
- [ ] app/(dashboard)/facturen/[id]/page.tsx
- [ ] app/(dashboard)/facturen/[id]/edit/page.tsx
- [ ] app/(dashboard)/offertes/[id]/page.tsx
- [ ] actions/time-actions.ts

### Reporting
- [ ] app/(dashboard)/btw-aangifte/actions.ts
- [ ] app/(dashboard)/instellingen/actions.ts

### Support
- [ ] app/api/support/route.ts

---

## Testing After Each Change

1. **Type Check:**
   ```bash
   npx tsc --noEmit
   ```

2. **Tenant Safety:**
   ```bash
   npm run check:tenant-safety
   ```

3. **Manual Test:**
   - Login as regular user
   - Try the feature
   - Verify no cross-tenant access

---

## Special Cases

### Support Messages (Anonymous)
Support messages can be created without authentication:
```typescript
// May need custom handling
if (userId) {
  await tenantPrisma.supportMessage.create({
    data: { userId, companyId, message },
  });
} else {
  // Anonymous submission - no companyId
  await prisma.supportMessage.create({
    data: { message, companyId: null },
  });
}
```

### Admin Routes
Admin routes use different helper:
```typescript
import { adminPrisma } from "@/lib/prismaTenant";

// In /admin routes only
const companies = await adminPrisma.getCompanies({
  take: 50,
  skip: 0,
});
```

---

## Quick Wins (Easiest Files)

Start with these for fastest progress:
1. ✅ actions/time-actions.ts (1-2 methods)
2. ✅ app/(dashboard)/facturen/[id]/page.tsx (1 query)
3. ✅ app/(dashboard)/facturen/[id]/edit/page.tsx (1 query)
4. ✅ app/(dashboard)/offertes/[id]/page.tsx (1 query)

Then tackle:
5. ⏳ app/(dashboard)/agenda/actions.ts (medium)
6. ⏳ app/(dashboard)/btw-aangifte/actions.ts (medium)
7. ⏳ app/(dashboard)/offertes/actions.tsx (largest, save for last)

---

## Time Estimates

- Simple query file (1-2 operations): 10-15 min
- Medium file (3-5 operations): 20-30 min
- Complex file (10+ operations): 45-60 min
- Testing per file: 5-10 min

**Total remaining: 3-4 hours**
