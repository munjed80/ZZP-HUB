# AI Assist - Tenant Isolation & Security

## Overview
The AI Assist feature is designed with strict tenant isolation to ensure that users can only access and manipulate their own data. This document outlines the security measures implemented.

## Tenant Isolation Strategy

### 1. Session-Based Context
Every AI request requires authentication:
```typescript
// In /api/ai/chat/route.ts
const { userId } = await requireTenantContext();
```

The `requireTenantContext()` function:
- Validates the user session via NextAuth
- Throws an error if not authenticated
- Throws an error if account is suspended
- Returns the userId which serves as the tenant key

### 2. Tool-Level Scoping
All AI tool functions receive a `ToolContext` with `userId`:
```typescript
interface ToolContext {
  userId: string;
}
```

Every database query in tool functions is scoped:
```typescript
// Example from toolCreateInvoiceDraft
const client = await prisma.client.findFirst({
  where: {
    userId,  // Enforces tenant isolation
    name: { contains: action.clientName, mode: "insensitive" }
  }
});
```

### 3. Data Access Patterns

#### Creating Resources
All resources created through AI tools include the userId:
```typescript
await prisma.invoice.create({
  data: {
    userId,  // Tenant key
    clientId: client.id,
    // ...
  }
});
```

#### Querying Resources
All queries include userId filter:
```typescript
const invoices = await prisma.invoice.findMany({
  where: {
    userId,  // Only returns current tenant's data
    // ... other filters
  }
});
```

## Security Measures

### Authentication
- All API routes use `requireTenantContext()` which validates NextAuth session
- Unauthenticated requests receive 401 error
- Suspended accounts cannot use AI features

### Authorization
- Users can ONLY create/read/update/delete their own data
- No cross-tenant data visibility
- No elevated privileges for AI actions

### Audit Logging
All AI actions are logged to `AiActionAuditLog` table:
```typescript
await logAIAction({
  userId,              // Who performed the action
  actionType,          // What type of action
  payloadHash,         // SHA-256 hash of input (privacy)
  resultId,            // ID of created resource (if applicable)
  success,             // Whether it succeeded
  errorMessage,        // Error details (if failed)
});
```

### Input Validation
- All action parameters validated with Zod schemas
- Strict typing prevents injection attacks
- Client names searched with parameterized queries (Prisma)

## Verification Tests

### Manual Verification Steps

1. **Create Invoice as User A**
   - Login as User A
   - Navigate to AI Assist
   - Type: "Maak een factuur voor TestClient bedrag 100"
   - Verify invoice is created with User A's userId

2. **Verify Isolation**
   - Login as User B
   - Navigate to AI Assist
   - Type: "Toon alle facturen"
   - Verify only User B's invoices are returned (not User A's)

3. **Database Verification**
   ```sql
   SELECT userId, COUNT(*) FROM Invoice GROUP BY userId;
   SELECT userId, COUNT(*) FROM AiActionAuditLog GROUP BY userId;
   ```
   Verify each user has separate data

### Automated Testing (Future)
Create integration tests that:
1. Create two test users/companies
2. Create invoices for each via AI
3. Query invoices for each user
4. Assert complete isolation
5. Attempt cross-tenant access (should fail)

Example test outline:
```typescript
test("AI tools enforce tenant isolation", async () => {
  const user1 = await createTestUser("user1@test.com");
  const user2 = await createTestUser("user2@test.com");
  
  // Create invoice for user1
  const result1 = await routeAIRequest(
    "Create invoice for Client1 amount 100",
    { userId: user1.id }
  );
  
  // Query as user2
  const result2 = await routeAIRequest(
    "Show all invoices",
    { userId: user2.id }
  );
  
  // Assert user2 cannot see user1's invoice
  assert(!result2.data.invoices.some(inv => inv.id === result1.data.invoice.id));
});
```

## Potential Risks & Mitigations

### Risk: Session Hijacking
**Mitigation**: 
- NextAuth handles session security
- HTTPS enforced in production
- Session tokens are httpOnly cookies

### Risk: SQL Injection
**Mitigation**:
- Using Prisma ORM (parameterized queries)
- No raw SQL in AI tools
- All inputs validated with Zod

### Risk: Parameter Tampering
**Mitigation**:
- userId comes from server session, not client
- Cannot be overridden via API request
- Client has no control over tenant context

### Risk: Data Leakage in Responses
**Mitigation**:
- All queries filtered by userId
- Response data includes only tenant-scoped results
- Citations come from static docs (no user data)

## Compliance

### GDPR Considerations
- Users can only access their own data
- Audit log tracks all AI actions
- Payload is hashed (not stored in plain text)
- Data deletion would cascade through userId foreign keys

### Access Logs
- `AiActionAuditLog` table records:
  - Who (userId)
  - What (actionType)
  - When (createdAt)
  - Result (success/failure)
  - Hash of input (payloadHash)

## Superadmin Bypass
Note: Superadmin bypass is **NOT** implemented for AI Assist.

Unlike admin pages where `getTenantWhereClause(allowAdminBypass=true)` might return empty where clause, AI tools NEVER bypass tenant scoping.

This is intentional:
- AI Assist is a user-facing feature
- Admins use dedicated admin pages for cross-tenant access
- Prevents accidental cross-tenant modifications via natural language

## Monitoring & Alerts

### Recommended Monitoring
1. **Failed Authentication Attempts**
   - Monitor 401 errors from `/api/ai/chat`
   - Alert on spike of unauthorized access

2. **Cross-Tenant Violations**
   - Should never occur
   - If logged in TENANT_GUARD_BLOCKED, investigate immediately

3. **Audit Log Review**
   - Periodically review `AiActionAuditLog`
   - Check for unusual patterns
   - Verify userId matches expected users

## Conclusion
The AI Assist feature enforces strict tenant isolation at multiple layers:
1. Session authentication (API route)
2. Tool context scoping (all database queries)
3. Audit logging (accountability)
4. Input validation (security)

No cross-tenant data access is possible through the AI system.
