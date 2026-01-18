# Capacitor Setup Guide for ZZP-HUB

## Overview

This document explains the Capacitor configuration for ZZP-HUB and the **critical limitations** you need to understand before deploying to mobile platforms.

## ⚠️ CRITICAL: Static Export Limitations

**This application CANNOT function as a pure static site** because it heavily relies on server-side features that are incompatible with Next.js static export (required by Capacitor).

### What Doesn't Work in Static Export

#### 1. **Authentication System (NextAuth)**
- Location: `app/api/auth/[...nextauth]/route.ts`
- Impact: Users cannot log in, register, or manage sessions
- Reason: NextAuth requires server-side session management

#### 2. **Server Actions** (20+ files)
All these files use `"use server"` directive and won't work:
- `app/actions/invoice-actions.ts`
- `app/(dashboard)/facturen/actions.ts`
- `app/(dashboard)/offertes/actions.tsx`
- `app/(dashboard)/relaties/actions.ts`
- `app/(dashboard)/instellingen/actions.ts`
- `app/(dashboard)/uitgaven/actions.ts`
- `app/(dashboard)/btw-aangifte/actions.ts`
- `app/(dashboard)/agenda/actions.ts`
- `app/(dashboard)/admin/*/actions.ts`
- `app/(auth)/*/actions.ts`
- `app/setup/actions.ts`

**Impact**: No CRUD operations, no form submissions, no data mutations

#### 3. **API Routes** (17 endpoints)
- `/api/auth/*` - Authentication endpoints
- `/api/ai/*` - AI assistant features
- `/api/export/*` - Data export functionality
- `/api/health/*` - Health checks
- `/api/invoices/*` - Invoice operations
- `/api/kvk/*` - KVK company lookups
- `/api/support` - Support ticket submissions

**Impact**: No backend functionality

#### 4. **Middleware**
- Location: `middleware.ts`
- Impact: No route protection, no authentication checks, no redirects
- Reason: Middleware doesn't work in static export

#### 5. **Dynamic Routes with Database**
- `/facturen/[id]` - Invoice details
- `/offertes/[id]` - Quotation details
- `/admin/support/[id]` - Support ticket details

**Impact**: Cannot view individual items

## Current Configuration

### Installed Packages
```json
{
  "@capacitor/core": "latest",
  "@capacitor/cli": "latest",
  "@capacitor/android": "latest",
  "@capacitor/ios": "latest"
}
```

### Capacitor Config
File: `capacitor.config.ts`
```typescript
{
  appId: "com.zzphub.app",
  appName: "ZZP HUB",
  webDir: "out",
  bundledWebRuntime: false
}
```

### Build Scripts
```json
{
  "build:web": "node scripts/build-capacitor.mjs",
  "build:mobile": "npm run build:web && npx cap sync",
  "cap:sync": "npx cap sync",
  "cap:open:android": "npx cap open android",
  "cap:open:ios": "npx cap open ios"
}
```

### Platform Status
- ✅ Android platform added to `android/`
- ✅ iOS platform added to `ios/`
- ❌ Static build cannot complete due to server dependencies
- ❌ App won't function without backend changes

## Solutions & Approaches

### Option 1: Hybrid Architecture with External Backend (Recommended)

Keep the current Next.js architecture but deploy it differently:

#### Setup:
1. **Deploy Next.js as a standard server** (not static)
   - Use Vercel, Railway, DigitalOcean, or AWS
   - Keep all API routes, server actions, and middleware
   
2. **Configure Capacitor to point to the server**
   ```typescript
   // capacitor.config.ts
   const config = {
     appId: "com.zzphub.app",
     appName: "ZZP HUB",
     server: {
       url: "https://your-app.vercel.app",  // Your deployed Next.js app
       cleartext: true  // Only for development
     }
   };
   ```

3. **Build and deploy**
   ```bash
   # Server is already deployed at https://your-app.vercel.app
   npm run cap:sync
   npm run cap:open:android
   npm run cap:open:ios
   ```

#### Pros:
- ✅ No code changes required
- ✅ All features work
- ✅ Easiest to implement
- ✅ Can share codebase between web and mobile

#### Cons:
- ❌ Requires internet connection
- ❌ Server costs
- ❌ Not a "true" native app

### Option 2: Backend-as-a-Service (BaaS)

Refactor to use a third-party backend:

#### Recommended Services:
1. **Supabase** (PostgreSQL + Auth + Real-time + Storage)
2. **Firebase** (Auth + Firestore + Functions + Storage)
3. **AWS Amplify** (Full backend stack)
4. **Appwrite** (Open-source BaaS)

#### Migration Steps:
1. Replace NextAuth with Supabase/Firebase Auth
2. Replace Prisma/Database with Supabase/Firebase DB
3. Replace server actions with client-side SDK calls
4. Remove middleware, implement client-side route guards
5. Replace API routes with BaaS functions or SDKs

#### Example: Supabase Migration
```typescript
// Before (Server Action)
"use server"
export async function createInvoice(data) {
  const invoice = await prisma.invoice.create({ data });
  return invoice;
}

// After (Client-side with Supabase)
import { supabase } from '@/lib/supabase'

export async function createInvoice(data) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return invoice;
}
```

#### Pros:
- ✅ Works offline (with local caching)
- ✅ True static app
- ✅ Can use Capacitor native features
- ✅ Scalable infrastructure

#### Cons:
- ❌ Major code refactoring required
- ❌ BaaS service costs
- ❌ Learning curve for new platform
- ❌ Migration time: 2-4 weeks

### Option 3: Capacitor with Embedded Server

Use Capacitor plugins to run a local server within the app:

#### Plugins:
- `@capacitor-community/http` - HTTP client
- Custom Node.js bridge (advanced)

#### Pros:
- ✅ Some server-side logic possible
- ✅ Minimal code changes

#### Cons:
- ❌ Limited functionality
- ❌ Complex setup
- ❌ Performance issues
- ❌ Not officially supported

### Option 4: Progressive Web App (PWA) Instead of Capacitor

Keep the app as a PWA instead of native:

#### Setup:
The app already has PWA support via `@ducanh2912/next-pwa`

#### Pros:
- ✅ No changes needed
- ✅ All features work
- ✅ Easy deployment
- ✅ Works on all platforms

#### Cons:
- ❌ No native app store presence
- ❌ Limited native features
- ❌ Requires browser

## Recommended Approach

### For Quick Deployment (Option 1):
1. Deploy Next.js to Vercel/Railway
2. Configure Capacitor to use deployed URL
3. Build and distribute mobile apps

### For Long-term Solution (Option 2):
1. Choose a BaaS provider (Supabase recommended)
2. Create migration plan
3. Refactor authentication first
4. Migrate database operations
5. Replace server actions with client calls
6. Test and deploy

## Build Instructions

### Current Attempt (Will Fail)
```bash
npm run build:web
```
**Error**: Cannot resolve action imports, server features not supported

### Working Approach (Option 1)
```bash
# 1. Deploy Next.js normally (don't use static export)
npm run build
# Deploy to your hosting provider

# 2. Update capacitor.config.ts with your URL
# 3. Sync and build
npm run cap:sync
npm run cap:open:android  # Opens in Android Studio
npm run cap:open:ios      # Opens in Xcode
```

## Testing Checklist

- [ ] Next.js app deployed and accessible at URL
- [ ] `capacitor.config.ts` updated with server URL
- [ ] Android platform synced: `npm run cap:sync`
- [ ] iOS platform synced: `npm run cap:sync`
- [ ] Android Studio opens project: `npm run cap:open:android`
- [ ] Xcode opens project: `npm run cap:open:ios`
- [ ] App loads deployed website in WebView
- [ ] Authentication works in mobile app
- [ ] All features functional in mobile app

## Additional Resources

- [Next.js Static Exports Documentation](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Firebase + Next.js Guide](https://firebase.google.com/docs/web/setup)
- [Capacitor Server Configuration](https://capacitorjs.com/docs/guides/deploying-updates)

## Support

For questions or issues:
1. Review this documentation
2. Check [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor)
3. Review [Next.js Discussions](https://github.com/vercel/next.js/discussions)

## Conclusion

**The current application architecture is NOT compatible with Capacitor's static export requirement.** You MUST choose one of the solutions above to proceed. Option 1 (Hybrid with External Backend) is the fastest path to a working mobile app, while Option 2 (BaaS Migration) provides the best long-term solution.
