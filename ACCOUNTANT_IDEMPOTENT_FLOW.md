# Accountant Invite + Accept Flow - Idempotent Implementation

## Summary

This document describes the idempotent behavior implemented for the accountant invite and accept flows to ensure robust handling of edge cases and prevent Server Components crashes.

## Changes Made

### 1. Invite Endpoint Idempotent (`linkAccountantToCompany`)

**File:** `app/(dashboard)/instellingen/actions.ts`

**Previous behavior:** Threw an error when accountant was already linked:
```typescript
throw new Error("Deze accountant is al gekoppeld aan uw bedrijf");
```

**New behavior:** Returns success with `alreadyLinked` flag:
```typescript
return {
  ok: true,
  alreadyLinked: true,
  companyId,
  companyUserId: existingInvite.id,
  accountantUserId: existingInvite.userId ?? null,
  status: "ACTIVE",
  emailSent: false,
};
```

**Why:** This prevents Server Components render crashes. The UI now shows an informational toast message instead of an error.

### 2. Accept Endpoint Idempotent (`/api/accountants/accept`)

**File:** `app/api/accountants/accept/route.ts`

**Previous behavior:** Returned error when token not found:
```typescript
return NextResponse.json({ error: "Ongeldige of gebruikte uitnodiging" }, { status: 400 });
```

**New behavior:** Falls back to checking if user is already linked:
```typescript
// Check if there's an existing active link for this user/email
const existingLink = await prisma.companyUser.findFirst({
  where: {
    OR: [
      { userId: sessionUserId },
      { invitedEmail: email },
    ],
    status: CompanyUserStatus.ACTIVE,
  },
});

if (existingLink) {
  // Return success - user is already linked (idempotent behavior)
  return NextResponse.json({
    success: true,
    alreadyLinked: true,
    companyUserId: existingLink.id,
    companies: [...],
  });
}
```

**Why:** This handles cases where:
- Token was already used (cleared after successful accept)
- Token expired but user manually linked
- Double-click on accept link
- User clicks an old email link after already accepting via a newer one

### 3. UI Handling (`AccountantInvites` component)

**File:** `app/(dashboard)/instellingen/accountant-invites.tsx`

**New behavior:** Shows informational toast when `alreadyLinked` is true:
```typescript
if (result.alreadyLinked) {
  toast.info("Deze accountant is al gekoppeld aan uw bedrijf.", {
    description: "Geen actie vereist.",
    duration: 5000,
  });
  setEmail("");
  return;
}
```

### 4. Switch Company Route Handler

**File:** `app/switch-company/route.ts`

**Status:** Already correctly implemented as a Route Handler (not a Server Component), so cookie modifications work properly. No changes needed.

## Testing

Run tests with:
```bash
npm test
```

New test suites added:
- `Idempotent invite creation (alreadyLinked)` - 4 tests
- `Accept flow fallback when token not found` - 4 tests

## Manual Testing Guide

### Test A: Accept invite idempotency
1. Invite an accountant via Instellingen page
2. Accountant logs in and accepts invite
3. Click the same accept link again (from email)
4. **Expected:** User is redirected to dashboard successfully (not an error page)

### Test B: Invite already linked idempotency
1. Have an accountant already linked to your company (status: ACTIVE)
2. Try to invite the same email again via Instellingen page
3. **Expected:** Toast shows "Deze accountant is al gekoppeld aan uw bedrijf" (info message, not error)
4. **Expected:** Settings page does NOT crash

### Test C: Double-click prevention
1. Open the accept invite link
2. Quickly click the "Accept" button multiple times
3. **Expected:** No errors, user ends up on dashboard

## Error Message Changes

| Scenario | Old Message | New Behavior |
|----------|-------------|--------------|
| Invite already linked | Error: "Deze accountant is al gekoppeld..." (throws) | Info toast: "Deze accountant is al gekoppeld..." (no throw) |
| Token not found but user linked | Error: "Ongeldige of gebruikte uitnodiging" | Success: redirects to dashboard |
| Token not found and user not linked | Error: "Ongeldige of gebruikte uitnodiging" | Error: "Ongeldige of verlopen uitnodiging" |

## Security Considerations

- The fallback lookup uses the session user ID and email to verify ownership
- Only ACTIVE CompanyUser records are considered for fallback
- Token is still cleared after use to prevent replay attacks
- No sensitive information is exposed in the idempotent responses
