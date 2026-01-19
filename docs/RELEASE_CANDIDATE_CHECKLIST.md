# Release Candidate Checklist

**Project:** ZZP-HUB  
**Version:** v1.0.0-rc1  
**Date:** January 19, 2025  
**Branch:** `copilot/prepare-release-candidate`

---

## Overview

This checklist ensures all critical requirements are met before promoting this branch to production. Each section must be signed off before deployment.

---

## 1. Build Verification

### Requirements
- [ ] Production build completes without errors
- [ ] No TypeScript compilation errors
- [ ] All routes compile successfully
- [ ] Service worker generated correctly
- [ ] PWA manifest generated
- [ ] Static assets optimized

### Verification Commands
```bash
npm run build
```

### Expected Output
- Build completes with exit code 0
- Service worker at `public/sw.js`
- All routes listed in build summary
- No fatal errors or warnings

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Notes:** _________________

---

## 2. Test Suite

### Requirements
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] No test failures
- [ ] Coverage meets minimum threshold

### Test Categories
- Accountant Invitation Flow (30 tests)
- Invoice Notifications (8 tests)
- Agenda Notifications (6 tests)
- AI Intent Detection (18 tests)
- Offerte → Factuur Conversion (5 tests)
- PDF Template Validation (10 tests)
- Multi-Tenant Isolation (25+ tests)
- RBAC Tenant Isolation (13 tests)

### Verification Commands
```bash
npm test
```

### Expected Output
- Total: 130+ tests
- Pass: 130+
- Fail: 0
- Skipped: 1 (TypeScript-related, acceptable)

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Test Results:** _____ passed / _____ total
- **Notes:** _________________

---

## 3. Linting & Code Quality

### Requirements
- [ ] ESLint passes with no blocking errors
- [ ] TypeScript type checking passes
- [ ] No critical code smells

### Verification Commands
```bash
npm run lint
```

### Acceptable Status
- Errors: 0 blocking errors
- Warnings: Minor warnings acceptable if documented
- Pre-existing issues: Document but don't block

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Errors:** _________________
- **Warnings:** _________________
- **Notes:** _________________

---

## 4. Security Scanning

### Requirements
- [ ] No critical security vulnerabilities
- [ ] No high-severity vulnerabilities
- [ ] Medium/low vulnerabilities documented
- [ ] Dependency audit clean

### Security Checks
1. **CodeQL Analysis**
   - Tool: GitHub CodeQL
   - Expected: 0 critical/high alerts
   - Document any medium/low alerts

2. **Dependency Audit**
   ```bash
   npm audit
   ```
   - Expected: No critical or high vulnerabilities

3. **Code Review Security**
   - SQL injection: Protected via Prisma ORM
   - XSS: Validated (React escaping + input sanitization)
   - CSRF: Protected via NextAuth
   - Tenant Isolation: Verified via tests
   - Authentication: Session-based (NextAuth)
   - Authorization: RBAC implemented

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **CodeQL Alerts:** _________________
- **npm audit:** _________________
- **Critical Issues:** _________________
- **Notes:** _________________

---

## 5. Manual Verification

### Critical User Flows

#### 5.1 Authentication & Onboarding
- [ ] User registration works
- [ ] Email verification flow complete
- [ ] Onboarding wizard functional
- [ ] Login/logout works
- [ ] Password reset works

#### 5.2 Core Features
- [ ] Dashboard loads correctly
- [ ] Create invoice (factuur)
- [ ] Create quote (offerte)
- [ ] Convert offerte → factuur
- [ ] Manage clients (relaties)
- [ ] Manage expenses (uitgaven)
- [ ] Calendar/Agenda events

#### 5.3 Accountant Features
- [ ] Send accountant invite
- [ ] Accountant verification flow
- [ ] Accountant portal access
- [ ] Company dossier view

#### 5.4 AI Assistant
- [ ] AI chat interface
- [ ] Intent detection works
- [ ] Offerte creation via AI
- [ ] Invoice creation via AI
- [ ] Draft confirmation flow

#### 5.5 UI/UX
- [ ] Dark mode toggle works
- [ ] Theme persists across sessions
- [ ] Responsive on mobile (375px+)
- [ ] Responsive on tablet (768px+)
- [ ] Responsive on desktop (1920px+)
- [ ] No invisible text or buttons
- [ ] All modals close properly
- [ ] Dropdowns/menus readable

#### 5.6 PWA Features
- [ ] Service worker installs (production)
- [ ] Manifest accessible
- [ ] Offline page works
- [ ] Install to home screen works

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Environment:** _________________
- **Browsers Tested:** _________________
- **Issues Found:** _________________

---

## 6. Database Migrations

### Requirements
- [ ] All migrations applied
- [ ] Schema matches Prisma schema
- [ ] No breaking changes
- [ ] Rollback plan documented

### Verification Commands
```bash
npx prisma migrate status
npx prisma generate
```

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Migrations Applied:** _________________
- **Notes:** _________________

---

## 7. Environment Configuration

### Production Environment Variables

Required variables:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Strong random secret (32+ chars)
- [ ] `NEXTAUTH_URL` - Production URL
- [ ] `RESEND_API_KEY` - Email service key
- [ ] `NODE_ENV=production`

Optional variables:
- [ ] `KVK_API_KEY` - KVK API (optional, uses mock if missing)
- [ ] `USE_REAL_KVK_API` - Enable real KVK API

### Security Checklist
- [ ] No secrets in code
- [ ] No secrets in git history
- [ ] Environment variables in secure vault
- [ ] Database credentials encrypted
- [ ] API keys rotated regularly

### Sign-Off
- **Status:** ⏳ PENDING
- **Configured By:** _________________
- **Date:** _________________
- **Environment:** _________________
- **Notes:** _________________

---

## 8. Performance & Optimization

### Requirements
- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] Lighthouse score > 90 (Best Practices)
- [ ] Lighthouse score > 90 (SEO)
- [ ] Time to Interactive < 3s
- [ ] First Contentful Paint < 1.5s

### Verification
Run Lighthouse in Chrome DevTools (Incognito mode):
1. Open production build
2. DevTools → Lighthouse → Analyze page load
3. Record scores

### Sign-Off
- **Status:** ⏳ PENDING
- **Tested By:** _________________
- **Date:** _________________
- **Performance:** _____ / 100
- **Accessibility:** _____ / 100
- **Best Practices:** _____ / 100
- **SEO:** _____ / 100
- **Notes:** _________________

---

## 9. Documentation Review

### Required Documentation
- [x] README.md updated
- [x] API documentation (in code comments)
- [x] Environment setup guide
- [x] Deployment guide
- [x] Security documentation
- [x] Feature documentation
- [x] Release notes prepared

### Documentation Files
- `README.md` - Project overview and setup
- `docs/PRODUCTION_VERIFICATION.md` - Manual testing checklist
- `docs/SECURITY_TENANT_ISOLATION.md` - Security model
- `docs/AI_ASSIST_ARCHITECTURE.md` - AI features
- `docs/PDF_TEMPLATES.md` - PDF generation
- `TASK_6_COMPLETION_REPORT.md` - Accountant flow
- `TASK_7_COMPLETION_REPORT.md` - Dashboard notifications
- `docs/RC_PREP_TASKS_4_5_SUMMARY.md` - Theme/UI fixes
- `docs/RELEASE_CANDIDATE_CHECKLIST.md` - This document
- `docs/FINAL_VERIFICATION_REPORT.md` - Final verification

### Sign-Off
- **Status:** ⏳ PENDING
- **Reviewed By:** _________________
- **Date:** _________________
- **Notes:** _________________

---

## 10. Deployment Readiness

### Pre-Deployment Checklist
- [ ] All above sections signed off
- [ ] Production database backup created
- [ ] Rollback plan tested
- [ ] Monitoring configured
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] CDN configured (if applicable)
- [ ] Domain SSL certificate valid
- [ ] DNS records configured

### Deployment Plan
1. Create database backup
2. Apply migrations: `npx prisma migrate deploy`
3. Build application: `npm run build`
4. Run smoke tests: `npm run verify:prod`
5. Deploy to production
6. Verify health endpoint: `/api/health`
7. Monitor error logs for 1 hour
8. Test critical user flows

### Rollback Plan
1. Revert deployment to previous version
2. Rollback database migrations (if needed)
3. Clear CDN cache
4. Notify stakeholders
5. Document issues for next release

### Sign-Off
- **Status:** ⏳ PENDING
- **Deployment By:** _________________
- **Date:** _________________
- **Deployment URL:** _________________
- **Notes:** _________________

---

## Final Approval

### Sign-Off Authority

**Technical Lead**
- Name: _________________
- Signature: _________________
- Date: _________________

**QA Lead**
- Name: _________________
- Signature: _________________
- Date: _________________

**Product Owner**
- Name: _________________
- Signature: _________________
- Date: _________________

---

## Related Documentation

- [Production Verification Guide](./PRODUCTION_VERIFICATION.md)
- [Security & Tenant Isolation](./SECURITY_TENANT_ISOLATION.md)
- [Final Verification Report](./FINAL_VERIFICATION_REPORT.md)
- [AI Assistant Architecture](./AI_ASSIST_ARCHITECTURE.md)
- [Tasks 4-5 Summary](./RC_PREP_TASKS_4_5_SUMMARY.md)

---

## Support & Contact

For questions or issues:
- **Repository:** github.com/munjed80/ZZP-HUB
- **Documentation:** `/docs` directory
- **Emergency Contact:** [To be filled]

---

**Checklist Version:** 1.0  
**Created:** January 19, 2025  
**Last Updated:** January 19, 2025
