#!/usr/bin/env node

/**
 * Capacitor Build Script
 * 
 * This script prepares the Next.js app for Capacitor by:
 * 1. Temporarily removing incompatible routes (API, dynamic pages, middleware)
 * 2. Running the static export build
 * 3. Restoring the removed files
 * 4. Creating documentation about limitations
 * 
 * Note: API routes, server actions, and dynamic routes won't work in the Capacitor build.
 * These require a separate backend server or refactoring to client-side alternatives.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const OUT_DIR = join(ROOT_DIR, 'out');

console.log('🚀 Starting Capacitor build process...\n');

// Step 1: Prepare for build (backup incompatible files)
try {
  console.log('📦 Preparing build environment...\n');
  execSync('node scripts/prepare-capacitor-build.mjs', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to prepare build environment');
  process.exit(1);
}

try {
  // Step 2: Run build
  console.log('🔨 Building static export...\n');
  execSync('IS_CAPACITOR=true next build', { 
    stdio: 'inherit',
    env: { ...process.env, IS_CAPACITOR: 'true' }
  });
  console.log('\n✅ Build completed successfully\n');

  // Step 3: Create documentation
  console.log('📝 Creating documentation...\n');
  const apiInfoPath = join(OUT_DIR, 'CAPACITOR_README.txt');
  const apiInfo = `
CAPACITOR BUILD - IMPORTANT INFORMATION
========================================

This is a static build for Capacitor (mobile app).

EXCLUDED FEATURES:
------------------
The following features have been EXCLUDED from this build and will NOT work:

1. API Routes (app/api/*)
   - Authentication (NextAuth)
   - AI endpoints
   - KVK search
   - Export functionality
   - Support form submissions

2. Dynamic Detail Pages
   - Invoice details (/facturen/[id])
   - Quotation details (/offertes/[id])
   - Support ticket details (/admin/support/[id])

3. Middleware
   - Route protection
   - Authentication redirects
   - Onboarding flow guards

WHY THESE ARE EXCLUDED:
-----------------------
Next.js static export (required by Capacitor) does not support:
- Server-side API routes
- Server actions ("use server")
- Middleware
- Dynamic routes with database lookups

TO MAKE THIS APP WORK IN CAPACITOR:
------------------------------------
You must:

1. Set up a separate backend server with all the API routes
2. Update the app to call your backend API instead of /api/* routes
3. Implement client-side authentication (e.g., Firebase, Auth0, Supabase)
4. Replace server actions with client-side API calls
5. Implement client-side route guards instead of middleware
6. Use environment variables to configure API endpoint URLs

ALTERNATIVE APPROACHES:
-----------------------
1. Use Capacitor with a hybrid approach (ship a Node.js server with the app)
2. Migrate to a fully client-side architecture
3. Use Backend-as-a-Service (Firebase, Supabase, AWS Amplify)

For more information, see:
- https://nextjs.org/docs/app/building-your-application/deploying/static-exports
- https://capacitorjs.com/docs
`;
  writeFileSync(apiInfoPath, apiInfo.trim());
  console.log('✅ Documentation created\n');

} finally {
  // Step 4: Restore backed up files
  try {
    execSync('node scripts/restore-after-build.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to restore files:', error.message);
    console.error('⚠️  You may need to manually restore from .capacitor-backup/');
    process.exit(1);
  }
}

console.log('✨ Capacitor build completed!\n');
console.log('📄 See out/CAPACITOR_README.txt for important information\n');
console.log('Next steps:');
console.log('  1. Run: npm run cap:sync');
console.log('  2. Open Android: npm run cap:open:android');
console.log('  3. Open iOS: npm run cap:open:ios\n');
