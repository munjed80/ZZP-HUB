# ZZP-HUB Production Deployment Flow

## 🔄 Complete Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COOLIFY DEPLOYMENT                          │
└─────────────────────────────────────────────────────────────────────┘

Step 1: Build Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command: npm install && npm run build

┌──────────────┐
│ npm install  │  Install dependencies
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ npm run build│  Next.js build with standalone output
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ postbuild.js    │  Copy assets to .next/standalone/
└──────┬──────────┘
       │
       ├──────────► public/              (PWA assets, favicons)
       ├──────────► .next/static/        (Next.js static files)
       └──────────► prisma/              (schema + migrations) ✓

Result: .next/standalone/ ready for deployment


Step 2: Start Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Command: ./scripts/migrate-and-start.sh

┌─────────────────────────┐
│ Check standalone build  │  Verify .next/standalone/server.js exists
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ prisma migrate deploy   │  Apply database migrations ✓
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ prisma generate         │  Generate Prisma Client
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ node server.js          │  Start standalone Next.js server
└─────────────────────────┘

Result: Application running on port 3000


Step 3: Runtime Flow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Public Routes (No Auth)          Protected Routes (Auth Required)
┌─────────────────────┐          ┌─────────────────────┐
│ /                   │          │ /dashboard          │
│ /login              │          │ /facturen           │
│ /register           │          │ /uitgaven           │
│ /check-email        │          │ /agenda             │
│ /verify-email       │          │ /instellingen       │
│ /resend-verification│          │ /onboarding         │
│ /offline            │          └─────────────────────┘
│ /pricing            │
│ /about              │
└─────────────────────┘

Public Assets (No Auth)          Protected API (Auth Required)
┌─────────────────────┐          ┌─────────────────────┐
│ /sw.js              │          │ /api/kvk/*          │
│ /manifest.webmanifest│         └─────────────────────┘
│ /offline.html       │
│ /robots.txt         │
│ /sitemap.xml        │
│ /favicon.ico        │
│ /_next/*            │
└─────────────────────┘
```

## 📊 Database Migration Flow

```
Development                 Production (Coolify)
━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━━━

1. Create Migration          1. Deploy Code
   ├─ prisma migrate dev        ├─ git push
   └─ Creates migration file    └─ Trigger build

2. Test Locally               2. Automatic Migration
   ├─ npm run dev               ├─ migrate-and-start.sh
   └─ Verify schema             ├─ prisma migrate deploy ✓
                                └─ prisma generate

3. Commit & Push              3. Application Starts
   ├─ git add migrations/       ├─ node server.js
   └─ git push                  └─ Ready on port 3000

Migration Files Included:
prisma/
├── schema.prisma
└── migrations/
    └── 20260107172021_add_onboarding_and_email_verification/
        └── migration.sql  (Adds emailVerified, onboardingCompleted, etc.)
```

## 🔐 Authentication & Onboarding Flow

```
New User Journey
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit Landing Page
   ┌──────────────┐
   │ GET /        │  Public - No redirect ✓
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Click Sign Up│
   └──────┬───────┘

2. Register
   ┌──────────────────┐
   │ POST /register   │  Creates user with emailVerified=false
   └──────┬───────────┘
          │
          ├─────────► Create User record
          ├─────────► Generate verification token
          ├─────────► Create EmailVerificationToken record
          └─────────► Send email via Resend
          │
          ▼
   ┌──────────────────┐
   │ Redirect to      │
   │ /check-email     │  Public route
   └──────────────────┘

3. Verify Email
   ┌──────────────────────┐
   │ Click link in email  │
   │ /verify-email?token= │
   └──────┬───────────────┘
          │
          ├─────────► Verify token hash
          ├─────────► Update emailVerified=true
          └─────────► Delete verification token
          │
          ▼
   ┌──────────────────┐
   │ Redirect to      │
   │ /onboarding      │  Now accessible
   └──────────────────┘

4. Complete Onboarding
   ┌──────────────────────┐
   │ 5-step wizard        │
   ├──────────────────────┤
   │ 1. Welcome           │
   │ 2. Company Info      │
   │ 3. First Client      │
   │ 4. Security (opt)    │
   │ 5. Celebration       │
   └──────┬───────────────┘
          │
          ├─────────► Update onboardingCompleted=true
          └─────────► Create CompanyProfile record
          │
          ▼
   ┌──────────────────┐
   │ Redirect to      │
   │ /dashboard       │  Full access granted
   └──────────────────┘
```

## 🛠️ Troubleshooting Decision Tree

```
Issue: Prisma P2022 Error
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ Column emailVerified not found  │
└───────────────┬─────────────────┘
                │
                ▼
         Check migration status
                │
       ┌────────┴────────┐
       │                 │
  ✓ Applied         ✗ Not Applied
       │                 │
       │                 ▼
       │          Run: npx prisma migrate deploy
       │                 │
       │                 ▼
       │          Restart application
       │                 │
       └────────┬────────┘
                ▼
        Problem Resolved ✓


Issue: Landing Page Redirects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ / redirects to /login           │
└───────────────┬─────────────────┘
                │
                ▼
       Check middleware.ts
                │
       ┌────────┴────────┐
       │                 │
  ✓ / in public     ✗ Missing
       │                 │
       │                 ▼
       │          Redeploy latest code
       │                 │
       │                 ▼
       │          Clear browser cache
       │                 │
       └────────┬────────┘
                ▼
        Problem Resolved ✓


Issue: Email Not Sending
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────────────┐
│ Verification email not received │
└───────────────┬─────────────────┘
                │
                ▼
       Check environment variables
                │
       ┌────────┴────────┐
       │                 │
  ✓ Set            ✗ Missing
       │                 │
       │                 ▼
       │          Add: RESEND_API_KEY
       │          Add: APP_BASE_URL
       │          Add: EMAIL_FROM
       │                 │
       │                 ▼
       │          Restart application
       │                 │
       └────────┬────────┘
                ▼
        Check Resend dashboard
                │
       ┌────────┴────────┐
       │                 │
  ✓ Sent           ✗ Failed
       │                 │
       │                 ▼
       │          Check API key validity
       │          Check sender domain
       │                 │
       └────────┬────────┘
                ▼
        Problem Resolved ✓
```

## ✅ Verification Checklist

### Pre-Deployment (Local)
```bash
□ npm run test:middleware     # All 28 tests pass
□ npm run pre-deploy          # 25 checks pass
□ npm run build               # Build succeeds
□ ls .next/standalone/prisma  # Prisma assets present
```

### Post-Deployment (Production)
```bash
□ npx prisma migrate status   # Migrations applied
□ curl https://domain.com/    # Landing page loads (no redirect)
□ curl https://domain.com/sw.js               # PWA assets accessible
□ curl https://domain.com/manifest.webmanifest # Manifest accessible
□ Register new account        # Email verification works
□ Complete onboarding         # Onboarding accessible
□ Access dashboard            # Dashboard accessible
```

## 📝 Summary

- **Build**: Standalone output with all assets copied
- **Migrations**: Automatic on startup via migrate-and-start.sh
- **Routes**: Landing page public, dashboard protected
- **Email**: Verification working with proper configuration
- **Testing**: 28 route tests + 25 deployment checks
- **Docs**: Complete guides for deployment and troubleshooting
