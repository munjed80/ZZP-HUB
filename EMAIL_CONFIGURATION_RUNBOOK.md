# Email Configuration - Deployment Runbook

## Overview
This document describes the email configuration changes and how to deploy them.

## Changes Made

### 1. Centralized Email Configuration
- **Created** `/config/emails.ts`: Single source of truth for all email addresses
  - Default `SUPPORT_EMAIL`: `support@zzpershub.nl`
  - Default `NO_REPLY_EMAIL`: `no-reply@zzpershub.nl`
  - Default `FROM_EMAIL`: `ZZP Hub <no-reply@zzpershub.nl>`

- **Created** `/lib/publicConfig.ts`: Client-safe email configuration helpers

### 2. Updated Components
- `components/assistant/assistant-widget.tsx`: Uses centralized support email
- `components/assistant/assistant-drawer.tsx`: Uses centralized support email
- `app/(auth)/login/page.tsx`: Uses centralized support email for "forgot password" link
- `lib/assistant/guide.ts`: FAQ uses centralized support email
- `content/help/zzp-hub-knowledge.md`: Documentation updated to zzpershub.nl

### 3. Updated Email Sending
- `lib/email.ts`: 
  - Uses centralized config
  - Added structured JSON logging for production
  - Logs: `email_send_attempt`, `email_send_success`, `email_send_failure`
  
- `app/(auth)/register/actions.ts`: Better error messages with support email
- `app/api/support/route.ts`: Uses centralized support email config

### 4. New Health Check
- **Created** `/app/api/health/email/route.ts`: Validates RESEND_API_KEY is configured (without exposing the key)

## Environment Variables (Coolify Setup)

### Required
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

### Optional (with defaults)
```bash
# Override support email (default: support@zzpershub.nl)
SUPPORT_EMAIL="support@zzpershub.nl"
NEXT_PUBLIC_SUPPORT_EMAIL="support@zzpershub.nl"

# Override no-reply email (default: no-reply@zzpershub.nl)
NO_REPLY_EMAIL="no-reply@zzpershub.nl"
```

## Deployment Steps

### 1. In Coolify Dashboard

1. Navigate to your ZZP-HUB application
2. Go to **Environment Variables**
3. Ensure `RESEND_API_KEY` is set (required)
4. (Optional) Add override variables if needed:
   - `SUPPORT_EMAIL`
   - `NEXT_PUBLIC_SUPPORT_EMAIL`
   - `NO_REPLY_EMAIL`

### 2. Verify Resend Configuration

1. Log into [Resend Dashboard](https://resend.com/domains)
2. Verify domain `zzpershub.nl` is verified
3. Verify sender addresses are authorized:
   - `no-reply@zzpershub.nl`
   - `support@zzpershub.nl`

### 3. Deploy

```bash
# Coolify will auto-deploy on push to main/production branch
git push origin main
```

### 4. Health Check

After deployment, test the health endpoint:

```bash
curl https://your-domain.com/api/health/email
```

Expected response:
```json
{
  "status": "ok",
  "email": "configured",
  "message": "RESEND_API_KEY is set"
}
```

## Testing

### Local Testing

1. Set up `.env.local`:
```bash
RESEND_API_KEY="re_test_xxxxx"
# Optional overrides
SUPPORT_EMAIL="support@zzpershub.nl"
NO_REPLY_EMAIL="no-reply@zzpershub.nl"
```

2. Start dev server:
```bash
npm run dev
```

3. Test email functionality:
   - Register a new account → verification email sent
   - Check console for structured logs:
     ```json
     {"event":"email_send_attempt","type":"verification","to":"user@example.com",...}
     {"event":"email_send_success","messageId":"abc123",...}
     ```

4. Test UI elements:
   - Login page → "Forgot password" link uses correct email
   - Support widget → "Contact support" link uses correct email
   - Assistant drawer → displays correct email

### Production Testing

1. Check health endpoint:
```bash
curl https://your-domain.com/api/health/email
```

2. Monitor logs for email events:
```bash
# In Coolify, check application logs for:
{"event":"email_send_attempt",...}
{"event":"email_send_success",...}
```

3. Test user registration flow:
   - Register a test account
   - Verify email is sent to correct address
   - Check email is from `no-reply@zzpershub.nl`

4. Test support form:
   - Submit support form
   - Verify email arrives at `support@zzpershub.nl`

## Rollback Plan

If issues occur:

1. **Quick Fix**: Set environment variable overrides in Coolify
2. **Full Rollback**: Revert the PR and redeploy previous version

## Verification Checklist

- [ ] `RESEND_API_KEY` configured in Coolify
- [ ] Domain `zzpershub.nl` verified in Resend
- [ ] Sender addresses authorized in Resend
- [ ] Health check returns `{"status":"ok"}`
- [ ] Registration sends verification email
- [ ] Support form delivers to correct address
- [ ] All UI elements show correct support email
- [ ] Logs show structured JSON email events

## Support

If you encounter issues:
- Check Coolify logs for error details
- Verify Resend domain/sender configuration
- Test health endpoint: `/api/health/email`
- Review email logs: grep for `"event":"email_send_`

## Security Notes

- ✅ No email addresses hardcoded (all use centralized config)
- ✅ No secrets exposed in health check
- ✅ Structured logging for production monitoring
- ✅ Clear error messages without exposing internals
- ✅ SUPERADMIN bypass logic preserved
