#!/bin/bash

# Production Verification Script for ZZP-HUB
# Tests key endpoints and functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL (can be overridden with environment variable)
BASE_URL="${APP_BASE_URL:-http://localhost:3000}"

echo "🔍 Verifying ZZP-HUB deployment at: $BASE_URL"
echo ""

# Function to check HTTP status
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    echo -n "Testing $description ($url)... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 --fail 2>/dev/null || echo "000")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $status)"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $status, expected $expected_status)"
        return 1
    fi
}

# Function to check content
check_content() {
    local url=$1
    local search_text=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    content=$(curl -s "$url" --max-time 10 --fail 2>/dev/null || echo "")
    
    if echo "$content" | grep -q "$search_text"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (content not found)"
        return 1
    fi
}

# Track failures
FAILURES=0

# 1. Landing Page
check_endpoint "$BASE_URL/" 200 "Landing Page"
FAILURES=$((FAILURES + $?))

check_content "$BASE_URL/" "ZZP" "Landing page content"
FAILURES=$((FAILURES + $?))

# 2. Public Routes
check_endpoint "$BASE_URL/login" 200 "Login Page"
FAILURES=$((FAILURES + $?))

check_endpoint "$BASE_URL/register" 200 "Register Page"
FAILURES=$((FAILURES + $?))

check_endpoint "$BASE_URL/offline" 200 "Offline Page"
FAILURES=$((FAILURES + $?))

# 3. PWA Assets
check_endpoint "$BASE_URL/sw.js" 200 "Service Worker"
FAILURES=$((FAILURES + $?))

check_endpoint "$BASE_URL/manifest.webmanifest" 200 "PWA Manifest"
FAILURES=$((FAILURES + $?))

check_endpoint "$BASE_URL/offline.html" 200 "Offline Fallback"
FAILURES=$((FAILURES + $?))

# 4. Static Assets
check_endpoint "$BASE_URL/favicon.ico" 200 "Favicon"
FAILURES=$((FAILURES + $?))

check_endpoint "$BASE_URL/robots.txt" 200 "Robots.txt"
FAILURES=$((FAILURES + $?))

# 5. API Health Check (if exists)
echo -n "Testing API Health... "
if curl -s "$BASE_URL/api/health" --max-time 5 > /dev/null 2>&1; then
    check_endpoint "$BASE_URL/api/health" 200 "API Health"
    FAILURES=$((FAILURES + $?))
else
    echo -e "${YELLOW}⚠ SKIPPED${NC} (endpoint may not exist)"
fi

echo ""
echo "================================"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $FAILURES check(s) failed${NC}"
    exit 1
fi
