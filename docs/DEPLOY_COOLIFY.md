# Coolify Deployment Guide for ZZP-HUB

This guide provides step-by-step instructions for deploying ZZP-HUB on Coolify with `output: "standalone"` and Prisma.

## Prerequisites

- Coolify instance running
- PostgreSQL database provisioned
- Domain configured (e.g., `app.zzp-hub.nl`)

## Environment Variables

Set these environment variables in Coolify's environment configuration:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/zzphub?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="ZZP-HUB <noreply@your-domain.com>"

# Application Base URL (for verification emails)
NEXT_PUBLIC_APP_URL="https://your-domain.com"
APP_BASE_URL="https://your-domain.com"

# Optional: KVK Integration
USE_REAL_KVK_API="false"
KVK_API_KEY=""

# Production mode
NODE_ENV="production"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Coolify Build Configuration

### Build Command

```bash
npm install && npm run build
```

This will:
1. Install all dependencies
2. Build the Next.js application with standalone output
3. Run `postbuild.js` to copy assets to `.next/standalone/`
   - `public/` directory
   - `.next/static/` directory
   - `prisma/` schema and migrations

### Start Command

```bash
./scripts/migrate-and-start.sh
```

Or if the script doesn't work, use:

```bash
npx prisma migrate deploy && npx prisma generate && node .next/standalone/server.js
```

This startup process:
1. Runs database migrations with `prisma migrate deploy`
2. Generates Prisma Client
3. Starts the standalone Next.js server

### Port

- **Port**: `3000` (default Next.js port)

## Initial Deployment

### 1. Create the Application in Coolify

1. Go to your Coolify dashboard
2. Create a new application
3. Connect your GitHub repository: `munjed80/ZZP-HUB`
4. Select the branch you want to deploy

### 2. Configure Build Settings

- **Build Command**: `npm install && npm run build`
- **Start Command**: `./scripts/migrate-and-start.sh`
- **Port**: `3000`

### 3. Add Environment Variables

Add all the environment variables listed above in Coolify's environment section.

### 4. Deploy

Click "Deploy" and monitor the build logs.

## Fixing a Broken Deployment

If your current deployment is broken with Prisma errors, follow these steps:

### Step 1: Access Coolify Terminal

Open the terminal for your application container in Coolify.

### Step 2: Run Migrations Manually

```bash
cd /app
npx prisma migrate deploy
```

Expected output:
```
✓ PostgreSQL database already exists
✓ Applied migrations:
  └─ 20260107172021_add_onboarding_and_email_verification
```

### Step 3: Verify Migration

```bash
npx prisma migrate status
```

Expected output:
```
Database schema is up to date!
```

### Step 4: Check Database Columns

```bash
npx prisma db execute --stdin <<EOF
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('emailVerified', 'emailVerificationToken', 'onboardingCompleted');
EOF
```

Expected output should show these columns exist.

### Step 5: Restart with Correct Start Command

Update the start command in Coolify to:

```bash
node .next/standalone/server.js
```

Or use the migration script:

```bash
./scripts/migrate-and-start.sh
```

Then restart the application.

## Verification

### Automated Pre-Deployment Check

Before deploying, run the comprehensive pre-deployment check:

```bash
npm run pre-deploy
```

This checks:
- Environment variables
- Dependencies and build files
- Configuration files
- Package.json scripts
- Middleware configuration
- Prisma schema

### Automated Middleware Tests

```bash
npm run test:middleware
```

This validates that all public routes are correctly configured.

### Manual Verification

### 1. Check Application Health

```bash
curl -I https://your-domain.com/api/health
```

Expected: `200 OK`

### 2. Verify Landing Page is Public

```bash
curl https://your-domain.com/
```

Expected: Should return HTML with landing page content, not a redirect.

### 3. Verify PWA Assets

```bash
curl -I https://your-domain.com/sw.js
curl -I https://your-domain.com/manifest.webmanifest
curl -I https://your-domain.com/offline.html
```

All should return `200 OK` without authentication.

### 4. Test Authentication Flow

1. Register a new account at `/register`
2. Check for verification email (check Resend dashboard)
3. Click verification link
4. Complete onboarding
5. Access dashboard

### 5. Check Logs

In Coolify terminal:

```bash
# View application logs
docker logs -f <container-name>
```

Look for:
- ✅ No Prisma P2022 errors
- ✅ Successful email sending logs
- ✅ No 404 errors for static assets

## Common Issues

### Issue 1: Prisma P2022 - Column doesn't exist

**Cause**: Migrations not applied to production database.

**Solution**:
```bash
npx prisma migrate deploy
```

### Issue 2: Landing page redirects to /login

**Cause**: Middleware not excluding `/` from auth requirements.

**Solution**: Already fixed in `middleware.ts` - landing page `/` is now in public routes.

### Issue 3: Static assets return 404

**Cause**: Assets not copied to standalone build.

**Solution**: Already fixed in `postbuild.js` - assets are now copied after build.

### Issue 4: "next start" doesn't work

**Cause**: Can't use `next start` with `output: "standalone"`.

**Solution**: Use `node .next/standalone/server.js` instead.

### Issue 5: Email verification fails

**Cause**: Missing environment variables or Prisma error.

**Solution**:
1. Verify `RESEND_API_KEY` is set
2. Verify `APP_BASE_URL` or `NEXTAUTH_URL` is set
3. Run migrations to ensure `User.emailVerified` column exists

## Database Maintenance

### Create a New Migration (Development)

```bash
npx prisma migrate dev --name descriptive_name
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Check Migration Status

```bash
npx prisma migrate status
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Monitoring

### Check Database Connection

```bash
npx prisma db execute --stdin <<EOF
SELECT 1 as healthy;
EOF
```

### View Recent Users

```bash
npx prisma db execute --stdin <<EOF
SELECT id, email, "emailVerified", "onboardingCompleted", "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;
EOF
```

## Rollback

If you need to rollback a deployment:

1. In Coolify, select a previous deployment
2. Click "Redeploy"
3. Monitor logs for successful startup

## Support

For issues:
1. Check Coolify logs
2. Verify environment variables
3. Run migration status check
4. Check GitHub repository issues

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Landing page loads without authentication
- [ ] Registration and email verification works
- [ ] Onboarding flow completes successfully
- [ ] Dashboard accessible after onboarding
- [ ] PWA assets load correctly (sw.js, manifest.webmanifest)
- [ ] Offline page works
- [ ] Favicon and meta tags correct
- [ ] HTTPS enabled
- [ ] Domain DNS configured
- [ ] Resend API key valid and tested
- [ ] Database backups configured
- [ ] Error monitoring setup (optional)
