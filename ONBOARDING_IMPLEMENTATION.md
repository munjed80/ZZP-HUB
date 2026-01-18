# Onboarding Flow Implementation Summary

This document provides an overview of the Moneybird-like onboarding flow implementation for ZZP-HUB.

## Overview

A complete user onboarding flow has been implemented featuring:
- Email verification
- 5-step wizard
- KVK integration for company lookup
- Route guards and middleware
- In-app assistant widget

## Flow Diagram

```
User Registration
    ↓
Email Verification Required
    ↓
Onboarding Step 1: Welcome
    ↓
Onboarding Step 2: Company Setup (KVK Search)
    ↓
Onboarding Step 3: Add First Client
    ↓
Onboarding Step 4: Security (2FA - Optional)
    ↓
Onboarding Step 5: Celebration
    ↓
Dashboard Access Granted
```

## Key Features

### 1. Email Verification
- **Token-based verification** with 24-hour expiry
- **Secure token generation** using rejection sampling (no modulo bias)
- **Rate limiting** on resend requests (1 email per minute)
- **Development-friendly**: Logs verification links to console in dev mode
- **Production-ready**: Uses Resend for email delivery

**Routes:**
- `/check-email` - Shown after registration
- `/verify-email?token=...` - Verification endpoint
- `/verify-required` - Shown to unverified users trying to access protected routes
- `/resend-verification` - Request new verification email

### 2. Onboarding Wizard

#### Step 1: Welcome
- Overview of setup process
- Clear expectations for users

#### Step 2: Company Setup
- **KVK Search**: Search Dutch Chamber of Commerce
- **Auto-fill**: Select from results to auto-populate form
- **Manual Entry**: Fallback for companies not in KVK
- **Fields**: Company name, address, postal code, city, KVK number, BTW number, IBAN, bank name

#### Step 3: First Client
- Add initial client/customer
- **Fields**: Name, email, address, postal code, city, BTW-ID (optional)
- Enables immediate invoicing after onboarding

#### Step 4: Security
- Optional 2FA enrollment
- Can be skipped and enabled later in settings
- **Future**: TOTP implementation ready

#### Step 5: Celebration
- Confetti animation (performance-optimized)
- Summary of completed setup
- "Aan de slag" button to dashboard

### 3. KVK Integration

**Architecture:**
- Abstract `KVKProvider` interface for easy swapping
- Mock provider with 4 test companies
- Ready for real KVK API integration

**API Endpoints:**
- `GET /api/kvk/search?q=<query>` - Search companies
- `GET /api/kvk/details?kvk=<number>` - Get company details

**Mock Data:**
- Test BV (12345678)
- Demo Consultancy (87654321)
- Voorbeeld Diensten (11223344)
- Sample Solutions (99887766)

**Environment Variables:**
```bash
USE_REAL_KVK_API=true
KVK_API_KEY=your-api-key
```

### 4. Route Guards & Middleware

**Protection Layers:**
1. Not authenticated → `/login`
2. Authenticated but not verified → `/verify-required`
3. Verified but onboarding incomplete → `/onboarding`
4. Onboarding complete → Dashboard access granted

**Implementation:**
- Next.js middleware at root level
- Server-side layout guards
- Client-side redirects for UX

### 5. Assistant Widget

**Features:**
- Context-aware help messages
- Progress tracking during onboarding
- Dismissible and non-intrusive
- Outside-click to close
- Available post-onboarding for support links

**Onboarding Messages:**
- Step 1: "Laten we beginnen met je account instellen"
- Step 2: "Zoek je bedrijf via KVK of vul handmatig in"
- Step 3: "Voeg je eerste klant toe om te kunnen factureren"
- Step 4: "Optioneel: activeer 2FA voor extra veiligheid"
- Step 5: "Je bent klaar om aan de slag te gaan"

## Database Schema

### User Model Additions
```prisma
model User {
  // Email verification
  emailVerified             Boolean    @default(false)
  emailVerificationToken    String?
  emailVerificationExpiry   DateTime?
  emailVerificationSentAt   DateTime?
  
  // Onboarding
  onboardingStep            Int        @default(0)
  onboardingCompleted       Boolean    @default(false)
  
  // 2FA (future)
  twoFactorEnabled          Boolean    @default(false)
  twoFactorSecret           String?
  recoveryCodes             String?
  
  verificationTokens        EmailVerificationToken[]
}
```

### New EmailVerificationToken Model
```prisma
model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

## Security Considerations

### Token Generation
- Uses `crypto.getRandomValues()` for cryptographic randomness
- Implements rejection sampling to eliminate modulo bias
- 32-character alphanumeric tokens

### Token Verification
- Tokens are hashed (bcrypt) before storage
- Constant-time comparison to prevent timing attacks
- Filters by expiry date before checking tokens
- Tokens are single-use (deleted after verification)

### Rate Limiting
- Email resend limited to 1 request per minute per user
- Tracked via `emailVerificationSentAt` timestamp

### Session Management
- NextAuth JWT-based sessions
- Session includes `emailVerified` and `onboardingCompleted` flags
- Middleware enforces access control

## Environment Configuration

Required variables:
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl"

# Email (optional in dev)
RESEND_API_KEY="re_..."
EMAIL_FROM="ZZP-HUB <no-reply@zzpershub.nl>"

# KVK (optional - uses mock by default)
USE_REAL_KVK_API="false"
KVK_API_KEY=""

# Debug
AUTH_DEBUG="true"
```

## Deployment Checklist

- [ ] Configure environment variables
- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Build application: `npm run build`
- [ ] Test email delivery (Resend API key)
- [ ] Test full flow: register → verify → onboard → dashboard
- [ ] Verify route guards work correctly
- [ ] Test KVK search functionality
- [ ] Check assistant widget displays correctly

## Future Enhancements

### Short-term
- [ ] Implement real KVK API integration
- [ ] Add TOTP 2FA enrollment in Step 4
- [ ] Generate and display recovery codes
- [ ] Email templates for other actions (password reset, etc.)

### Long-term
- [ ] Multi-language support
- [ ] Customizable onboarding steps per plan
- [ ] Analytics tracking for onboarding completion rates
- [ ] A/B testing for onboarding flow variations

## Troubleshooting

### Email verification link not working
- Check token hasn't expired (24 hours)
- Verify DATABASE_URL is correct
- Check Prisma client is generated
- Review server logs for errors

### KVK search not returning results
- Ensure user is authenticated
- Check API endpoint is accessible
- Verify mock provider is being used (or KVK API key if real)
- Review browser console for API errors

### Redirect loops
- Clear browser cookies/session
- Check middleware.ts public routes array
- Verify user emailVerified and onboardingCompleted status in DB
- Review NextAuth session configuration

### Build errors
- Run `npx prisma generate` after schema changes
- Clear .next folder: `rm -rf .next`
- Verify all dependencies installed: `npm install`
- Check TypeScript errors: `npx tsc --noEmit`

## File Structure

```
app/
├── (auth)/
│   ├── check-email/
│   ├── verify-email/
│   ├── verify-required/
│   ├── resend-verification/
│   ├── login/
│   └── register/
├── onboarding/
│   ├── layout.tsx
│   ├── page.tsx
│   └── actions.ts
└── api/
    └── kvk/
        ├── search/
        └── details/

components/
├── onboarding/
│   ├── welcome-step.tsx
│   ├── company-step.tsx
│   ├── client-step.tsx
│   ├── security-step.tsx
│   └── celebration-step.tsx
├── assistant/
│   └── assistant-widget.tsx
└── emails/
    └── VerificationEmail.tsx

lib/
├── email.ts
└── kvk/
    ├── interface.ts
    ├── mock-provider.ts
    └── index.ts

prisma/
├── schema.prisma
└── migrations/
    └── 20260107172021_add_onboarding_and_email_verification/

middleware.ts
```

## Testing

Manual testing checklist is available in README.md under "Onboarding Flow Verification".

Key test scenarios:
1. Complete flow: register → verify → onboard → dashboard
2. Expired token handling
3. Resend email rate limiting
4. Route guard enforcement
5. KVK search and selection
6. Manual company entry fallback
7. Skip 2FA option
8. Confetti animation performance

## Support

For issues or questions:
- Review README.md verification checklist
- Check server logs for errors
- Verify environment configuration
- Contact support: support@zzpershub.nl
