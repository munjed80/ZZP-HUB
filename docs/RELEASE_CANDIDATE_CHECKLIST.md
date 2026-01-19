# Release Candidate Checklist

## Pre-Deployment Checklist

### Database Migrations

Before deploying to production, ensure database migrations are applied:

```bash
# Run in production environment
npx prisma migrate deploy
```

This will apply any pending migrations to the production database.

### Build and Test

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Run lint checks:**
   ```bash
   npm run lint
   ```

4. **Run tests:**
   ```bash
   npm run test
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

### Environment Variables

Ensure the following environment variables are set in production:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Full URL of your deployed application
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js session encryption
- `RESEND_API_KEY` - API key for email sending (if using Resend)

### Security Checklist

- [ ] All secrets are stored in environment variables, not in code
- [ ] HTTPS is enabled in production
- [ ] Session cookies are set with `secure: true` in production
- [ ] Database connection uses SSL in production

## Accountant Experience Features

### Invite Flow

1. Company admin creates invite via `/accountant-access`
2. Accountant receives email with OTP code and link
3. Accountant verifies OTP at `/accountant-verify`
4. System auto-creates shadow user if needed (no manual registration)
5. Accountant session cookie is set (`zzp-accountant-session`)
6. Accountant redirected to `/accountant-portal`

### Middleware Authentication

The middleware is Edge-compatible and checks for:
- `zzp-accountant-session` cookie for accountant sessions
- NextAuth JWT token for regular user sessions

Deep session validation (expiry, permissions, tenant isolation) happens server-side only.

### Structured Logging Events

The following events are logged for auditing:

- `ACCOUNTANT_INVITE_ACCEPTED` - When an invite is accepted
- `ACCOUNTANT_SESSION_COOKIE_SET` - When a session cookie is created
- `ACCOUNTANT_SESSION_COOKIE_SET_FAILED` - When session creation fails
- `ACCOUNTANT_PORTAL_SESSION_VALID` - When a valid session is found
- `ACCOUNTANT_PORTAL_SESSION_INVALID` - When session is invalid/expired

## Post-Deployment Verification

1. **Verify authentication flow:**
   - Test login/logout for regular users
   - Test accountant invite flow end-to-end

2. **Verify theme switching:**
   - Test System/Light/Dark mode in Settings
   - Verify inputs are visible in dark mode

3. **Verify navigation:**
   - Check sidebar order: Facturen, Relaties, Offertes, Uitgaven, BTW, Agenda
   - Check mobile navigation and active states

4. **Run smoke tests:**
   ```bash
   npm run smoke:prod
   ```

## Rollback Procedure

If issues are found after deployment:

1. Revert to previous deployment
2. If database migration was applied, check if rollback is needed
3. Notify stakeholders of rollback

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | Current | Initial release with accountant experience |
