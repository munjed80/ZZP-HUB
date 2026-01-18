#!/usr/bin/env node
import { renameSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();

// Create backup directory
const BACKUP_DIR = join(ROOT_DIR, '.capacitor-backup');
if (existsSync(BACKUP_DIR)) {
  rmSync(BACKUP_DIR, { recursive: true, force: true });
}
mkdirSync(BACKUP_DIR, { recursive: true });

// Backup files/directories that won't work in static export
const backups = [
  { src: 'app/api', dest: '.capacitor-backup/api' },
  { src: 'app/actions', dest: '.capacitor-backup/actions' },
  { src: 'middleware.ts', dest: '.capacitor-backup/middleware.ts' },
  { src: 'app/(dashboard)/admin/support/[id]/page.tsx', dest: '.capacitor-backup/support-page.tsx' },
  { src: 'app/(dashboard)/facturen/[id]/page.tsx', dest: '.capacitor-backup/facturen-page.tsx' },
  { src: 'app/(dashboard)/offertes/[id]/page.tsx', dest: '.capacitor-backup/offertes-page.tsx' },
  { src: 'app/setup/actions.ts', dest: '.capacitor-backup/setup-actions.ts' },
  { src: 'app/(auth)/resend-verification/actions.ts', dest: '.capacitor-backup/resend-actions.ts' },
  { src: 'app/(auth)/register/actions.ts', dest: '.capacitor-backup/register-actions.ts' },
  { src: 'app/(auth)/verify-email/actions.ts', dest: '.capacitor-backup/verify-actions.ts' },
  { src: 'app/(dashboard)/admin/releases/actions.ts', dest: '.capacitor-backup/releases-actions.ts' },
  { src: 'app/(dashboard)/admin/support/actions.ts', dest: '.capacitor-backup/support-actions.ts' },
  { src: 'app/(dashboard)/admin/companies/actions.ts', dest: '.capacitor-backup/companies-actions.ts' },
  { src: 'app/(dashboard)/agenda/actions.ts', dest: '.capacitor-backup/agenda-actions.ts' },
  { src: 'app/(dashboard)/btw-aangifte/actions.ts', dest: '.capacitor-backup/btw-actions.ts' },
  { src: 'app/(dashboard)/facturen/actions.ts', dest: '.capacitor-backup/facturen-actions.ts' },
  { src: 'app/(dashboard)/uitgaven/actions.ts', dest: '.capacitor-backup/uitgaven-actions.ts' },
  { src: 'app/(dashboard)/instellingen/actions.ts', dest: '.capacitor-backup/instellingen-actions.ts' },
  { src: 'app/(dashboard)/relaties/actions.ts', dest: '.capacitor-backup/relaties-actions.ts' },
  { src: 'app/(dashboard)/offertes/actions.tsx', dest: '.capacitor-backup/offertes-actions.tsx' },
];

console.log('📦 Preparing for Capacitor build...\n');
console.log('  Backing up incompatible files (API routes, server actions, middleware)...\n');

let successCount = 0;
let errorCount = 0;

backups.forEach(({ src, dest }) => {
  const srcPath = join(ROOT_DIR, src);
  const destPath = join(ROOT_DIR, dest);
  
  if (existsSync(srcPath)) {
    try {
      console.log(`  ✓ ${src}`);
      renameSync(srcPath, destPath);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to backup ${src}:`, error.message);
      errorCount++;
    }
  }
});

console.log(`\n✅ Preparation complete (${successCount} backed up, ${errorCount} errors)\n`);

if (errorCount > 0) {
  console.warn('⚠️  Some files could not be backed up. Build may fail.\n');
}
