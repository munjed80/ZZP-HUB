# 🚀 Quick Deployment Fix for Coolify

If your ZZP-HUB deployment is broken, follow these steps **in order**:

## 1. Fix Current Deployment (In Coolify Terminal)

```bash
# Navigate to app directory
cd /app

# Run database migrations
npx prisma migrate deploy

# Check migration status (should show "Database schema is up to date!")
npx prisma migrate status

# Restart the container with correct command
# (Update start command in Coolify UI first)
```

## 2. Update Coolify Settings

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
./scripts/migrate-and-start.sh
```

**Alternative Start Command** (if script doesn't work):
```bash
npx prisma migrate deploy && npx prisma generate && node .next/standalone/server.js
```

### Port
```
3000
```

## 3. Required Environment Variables

```bash
DATABASE_URL="postgresql://user:password@host:5432/zzphub?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"
APP_BASE_URL="https://your-domain.com"
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="ZZP-HUB <noreply@your-domain.com>"
NODE_ENV="production"
```

Generate secret:
```bash
openssl rand -base64 32
```

## 4. Verify Deployment

```bash
# Check database columns exist
npx prisma db execute --stdin <<EOF
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'emailVerified';
EOF

# Should return: emailVerified

# Check landing page (should return HTML, not redirect)
curl https://your-domain.com/

# Check PWA assets (should return 200)
curl -I https://your-domain.com/sw.js
curl -I https://your-domain.com/manifest.webmanifest

# Check API health
curl https://your-domain.com/api/health
```

## 5. Common Issues & Solutions

### ❌ Prisma P2022: Column doesn't exist
```bash
npx prisma migrate deploy
```

### ❌ Landing page redirects to /login
✅ Fixed in middleware.ts - redeploy

### ❌ Static assets return 404
✅ Fixed in postbuild.js - rebuild

### ❌ "next start" warning
✅ Use `node .next/standalone/server.js` instead

### ❌ Email verification fails
1. Check `RESEND_API_KEY` is set
2. Check `APP_BASE_URL` or `NEXTAUTH_URL` is set
3. Run `npx prisma migrate deploy`

## 6. Deployment Checklist

Before deploying, run the pre-deployment check:
```bash
npm run pre-deploy
```

Manual checklist:
- [ ] Database migrations applied (`npx prisma migrate status` or `npm run db:status`)
- [ ] Start command updated to use standalone server
- [ ] All environment variables configured
- [ ] Landing page loads at `/` (no redirect)
- [ ] PWA assets accessible (`/sw.js`, `/manifest.webmanifest`)
- [ ] Registration and email verification work
- [ ] No Prisma P2022 errors in logs

Automated tests:
```bash
# Test middleware routes
npm run test:middleware

# Pre-deployment readiness check
npm run pre-deploy
```

## 📚 Full Documentation

See [docs/DEPLOY_COOLIFY.md](./DEPLOY_COOLIFY.md) for complete deployment guide.

## 🆘 Emergency Rollback

In Coolify dashboard:
1. Go to Deployments tab
2. Select previous working deployment
3. Click "Redeploy"
