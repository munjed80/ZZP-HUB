# Deployment Guide

This guide covers deploying ZZP HUB to various platforms. The application is built with Next.js (standalone output), Prisma ORM, and PostgreSQL.

## Prerequisites

- **Node.js 20.x** (LTS) — Required for production builds
- **PostgreSQL 14+** — Database backend
- **npm 9+** or compatible package manager

## Node.js Version Requirements

ZZP HUB requires **Node.js 20.x** for production deployments. This is enforced via:

1. **`package.json` engines field**: `"node": ">=20 <21"`
2. **`.nvmrc` file**: Contains `20` for nvm users
3. **`nixpacks.toml`**: Pins Node 20 for Nixpacks-based platforms (Railway, Coolify)
4. **Build-time guard**: `scripts/check-node-version.mjs` fails the build if Node != 20.x

### Why Node 20?

- Tested and validated runtime for all dependencies
- Long-Term Support (LTS) version with security updates until 2026
- Prevents silent breakage from untested Node 21/22 features

## Platform-Specific Setup

### Railway

Railway uses Nixpacks by default, which respects our `nixpacks.toml` configuration.

**Steps:**
1. Connect your GitHub repository
2. Railway will auto-detect Next.js and use `nixpacks.toml`
3. Set environment variables in the Railway dashboard:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=https://your-app.railway.app
   ```
4. Railway injects `PORT` automatically — the app respects this

**Manual Node version override (if needed):**
```toml
# In nixpacks.toml (already configured)
[phases.setup]
nixPkgs = ["nodejs_20", "npm-9_x"]
```

### Coolify

Coolify supports Nixpacks, Dockerfile, and Docker Compose deployments.

**Nixpacks (recommended):**
1. Create a new application from GitHub
2. Build pack: Nixpacks (auto-detects `nixpacks.toml`)
3. Set environment variables in Coolify UI
4. Start command: `npm run start`

**Docker (alternative):**

Create a `Dockerfile` in your project root:

```dockerfile
# Dockerfile for ZZP HUB
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "scripts/start-prod.mjs"]
```

### VPS (Manual Deployment)

**Using nvm:**
```bash
# Install nvm if not present
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use Node 20 (reads .nvmrc)
nvm install
nvm use

# Verify version
node --version  # Should output v20.x.x

# Install and build
npm ci
npm run build

# Start with PM2 (recommended)
pm2 start npm --name "zzp-hub" -- run start
```

**Using system Node:**
```bash
# Install Node 20.x on Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # v20.x.x
```

### Heroku

Heroku respects `package.json` engines. Add a `Procfile`:

```
web: npm run start
```

Set the Node version in `package.json` (already configured):
```json
{
  "engines": {
    "node": ">=20 <21"
  }
}
```

### Render

Render uses the `engines` field from `package.json`. Configure in the Render dashboard:

1. Build Command: `npm ci && npm run build`
2. Start Command: `npm run start`
3. Environment: Node 20.x (auto-detected from engines)

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Random secret for session encryption | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL of the application | `https://app.zzpershub.nl` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port to bind the server to | `3000` |
| `RESEND_API_KEY` | Resend API key for emails | — |
| `APP_URL` | Base URL for email links | Falls back to `NEXTAUTH_URL` |
| `EXPECTED_NEXTAUTH_URL` | Strict URL validation (deploy-prod.mjs only) | — |

### PORT Behavior

Platform-as-a-Service providers (Railway, Heroku, Render, etc.) inject the `PORT` environment variable to tell the app which port to bind to. The application automatically respects this:

```javascript
// The app uses PORT from environment, falling back to 3000
const port = process.env.PORT || "3000";
```

**Important:** Do not hardcode ports in production. Always let the platform control `PORT`.

## Deployment Sanity Check

Run these commands to verify your deployment environment before starting the server:

### 1. Verify Node Version

```bash
node --version
# Expected: v20.x.x

# Or run the built-in check:
node scripts/check-node-version.mjs
# Expected: ✓ Node.js version 20.x verified
```

### 2. Verify Required Environment Variables

```bash
# Quick check (prints error if missing)
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('Missing:', missing.join(', '));
  process.exit(1);
}
console.log('✓ All required env vars present');
"
```

### 3. Verify PORT Behavior

```bash
# Test that PORT is respected
PORT=8080 node -e "console.log('PORT:', process.env.PORT || '3000')"
# Expected: PORT: 8080

# Without PORT set
node -e "console.log('PORT:', process.env.PORT || '3000')"
# Expected: PORT: 3000
```

### 4. Verify Prisma Migrations

```bash
# Generate Prisma client (uses project-specified version)
npm run db:generate

# Check pending migrations (dry run)
npx prisma migrate status

# Apply migrations (uses project-specified version)
npm run db:migrate
```

> **Note:** Use `npm run db:generate` and `npm run db:migrate` instead of running `npx prisma` directly. This ensures the project-specified Prisma version (6.1.0) is used, preventing version mismatch issues.

### 5. Full Sanity Check Script

```bash
#!/bin/bash
set -e

echo "=== Deployment Sanity Check ==="

# 1. Node version
echo -n "Node version: "
node --version
node scripts/check-node-version.mjs

# 2. Environment variables
echo "Checking environment variables..."
node -e "
const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error('✗ Missing:', missing.join(', '));
  process.exit(1);
}
console.log('✓ All required env vars present');
"

# 3. Database connection
echo "Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1" > /dev/null && echo "✓ Database connection OK"

# 4. Migrations
echo "Checking migrations..."
npx prisma migrate status

echo "=== All checks passed ==="
```

## Simulated Production Start

To test the production startup locally:

```bash
# 1. Build the application
npm run build

# 2. Set required environment variables
export DATABASE_URL="postgresql://localhost:5432/zzphub"
export NEXTAUTH_SECRET="test-secret-min-32-chars-long!!"
export NEXTAUTH_URL="http://localhost:3000"

# 3. Start production server
npm run start
```

**Expected log output:**
```
[start-prod] Running prisma migrate deploy
[start-prod] Prisma migrate deploy completed
[start-prod] Bootstrapping SUPERADMIN user
[start-prod] Starting server on 0.0.0.0:3000
```

With a custom port:
```bash
PORT=8080 npm run start
# Expected: [start-prod] Starting server on 0.0.0.0:8080
```

## Troubleshooting

### "Missing required environment variables"

Ensure all required env vars are set. Check for typos and trailing whitespace:
```bash
env | grep -E '^(DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL)='
```

### "Node.js major version X detected, but version 20.x is required"

Your runtime is using the wrong Node version. Solutions:
- Railway/Coolify: Verify `nixpacks.toml` is committed
- VPS: Use nvm (`nvm use`) or install Node 20 system-wide
- Docker: Use `FROM node:20-alpine`

### "Build output not found"

Run `npm run build` before starting the server. The standalone output is required.

### Prisma migration errors

1. Check database connectivity: `npx prisma db execute --stdin <<< "SELECT 1"`
2. View migration status: `npx prisma migrate status`
3. For P3009 errors (history mismatch), the start script auto-resolves known migrations

### PORT not being respected

Verify no hardcoded ports in your deployment config. The app reads `process.env.PORT` at runtime.
