#!/bin/bash

# Production Readiness Checklist for ZZP-HUB
# Run this script before deploying to production

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ZZP-HUB Production Deployment Readiness Check         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to check a condition
check() {
    local description=$1
    local command=$2
    local type=${3:-critical}  # critical, warning
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        return 0
    else
        if [ "$type" = "warning" ]; then
            echo -e "${YELLOW}⚠ WARNING${NC}"
            CHECKS_WARNING=$((CHECKS_WARNING + 1))
        else
            echo -e "${RED}✗ FAIL${NC}"
            CHECKS_FAILED=$((CHECKS_FAILED + 1))
        fi
        return 1
    fi
}

echo -e "${BLUE}[1/6] Environment Variables${NC}"
echo "--------------------------------"

check "DATABASE_URL set" "[ ! -z \"\$DATABASE_URL\" ]"
check "NEXTAUTH_SECRET set" "[ ! -z \"\$NEXTAUTH_SECRET\" ]"
check "NEXTAUTH_URL or APP_BASE_URL set" "[ ! -z \"\$NEXTAUTH_URL\" ] || [ ! -z \"\$APP_BASE_URL\" ]"
check "RESEND_API_KEY set" "[ ! -z \"\$RESEND_API_KEY\" ]" "warning"
check "EMAIL_FROM set" "[ ! -z \"\$EMAIL_FROM\" ]" "warning"
check "NODE_ENV is production" "[ \"\$NODE_ENV\" = \"production\" ]" "warning"

echo ""
echo -e "${BLUE}[2/6] Dependencies & Build Files${NC}"
echo "--------------------------------"

check "node_modules exists" "[ -d node_modules ]"
check "Prisma Client generated" "[ -d node_modules/@prisma/client ]"
check "Next.js build exists" "[ -d .next ]" "warning"
check "Standalone build exists" "[ -d .next/standalone ]" "warning"
check "Prisma schema exists" "[ -f prisma/schema.prisma ]"
check "Migrations directory exists" "[ -d prisma/migrations ]"

echo ""
echo -e "${BLUE}[3/6] Configuration Files${NC}"
echo "--------------------------------"

check "package.json exists" "[ -f package.json ]"
check "next.config.ts exists" "[ -f next.config.ts ]"
check "middleware.ts exists" "[ -f middleware.ts ]"
check "Deployment docs exist" "[ -f docs/DEPLOY_COOLIFY.md ]"
check "Migration startup script exists" "[ -f scripts/migrate-and-start.sh ]"
check "Migration script is executable" "[ -x scripts/migrate-and-start.sh ]"

echo ""
echo -e "${BLUE}[4/6] Package.json Scripts${NC}"
echo "--------------------------------"

check "db:migrate script defined" "grep -q '\"db:migrate\"' package.json"
check "db:generate script defined" "grep -q '\"db:generate\"' package.json"
check "db:status script defined" "grep -q '\"db:status\"' package.json"
check "Start command uses standalone" "grep -q 'node .next/standalone/server.js' package.json"

echo ""
echo -e "${BLUE}[5/6] Middleware Configuration${NC}"
echo "--------------------------------"

check "Landing page (/) is public" "grep -q \"'/'\" middleware.ts"
check "Login page is public" "grep -q \"'/login'\" middleware.ts"
check "Register page is public" "grep -q \"'/register'\" middleware.ts"
check "PWA assets are public" "grep -q \"'/sw.js'\" middleware.ts"
check "Manifest is public" "grep -q \"'/manifest.webmanifest'\" middleware.ts"

echo ""
echo -e "${BLUE}[6/6] Prisma Schema${NC}"
echo "--------------------------------"

check "User model has emailVerified field" "grep -q 'emailVerified' prisma/schema.prisma"
check "User model has onboardingCompleted field" "grep -q 'onboardingCompleted' prisma/schema.prisma"
check "EmailVerificationToken model exists" "grep -q 'model EmailVerificationToken' prisma/schema.prisma"
check "Migration exists for email verification" "find prisma/migrations -type d -name '*email*' | grep -q . || find prisma/migrations -type d -name '*verification*' | grep -q ." "warning"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "Results:"
echo -e "  ${GREEN}✓ Passed:  $CHECKS_PASSED${NC}"
echo -e "  ${YELLOW}⚠ Warnings: $CHECKS_WARNING${NC}"
echo -e "  ${RED}✗ Failed:  $CHECKS_FAILED${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ System is ready for production deployment!${NC}"
    if [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Please review warnings above before deploying.${NC}"
    fi
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Run: npm run build"
    echo "2. Deploy to Coolify with:"
    echo "   - Build command: npm install && npm run build"
    echo "   - Start command: ./scripts/migrate-and-start.sh"
    echo "3. Verify deployment: npm run verify:endpoints"
    exit 0
else
    echo -e "${RED}❌ System is NOT ready for deployment!${NC}"
    echo -e "${RED}Please fix the failed checks above before deploying.${NC}"
    exit 1
fi
