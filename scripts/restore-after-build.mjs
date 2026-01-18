#!/usr/bin/env node
import { renameSync, existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();
const BACKUP_DIR = join(ROOT_DIR, '.capacitor-backup');

if (!existsSync(BACKUP_DIR)) {
  console.log('⚠️  No backup directory found, nothing to restore\n');
  process.exit(0);
}

// Restore backed up files
const backups = [
  { dest: 'app/api', src: '.capacitor-backup/api' },
  { dest: 'app/actions', src: '.capacitor-backup/actions' },
  { dest: 'middleware.ts', src: '.capacitor-backup/middleware.ts' },
  { dest: 'app/(dashboard)/admin/support/[id]/page.tsx', src: '.capacitor-backup/support-page.tsx' },
  { dest: 'app/(dashboard)/facturen/[id]/page.tsx', src: '.capacitor-backup/facturen-page.tsx' },
  { dest: 'app/(dashboard)/offertes/[id]/page.tsx', src: '.capacitor-backup/offertes-page.tsx' },
  { dest: 'app/setup/actions.ts', src: '.capacitor-backup/setup-actions.ts' },
  { dest: 'app/(auth)/resend-verification/actions.ts', src: '.capacitor-backup/resend-actions.ts' },
  { dest: 'app/(auth)/register/actions.ts', src: '.capacitor-backup/register-actions.ts' },
  { dest: 'app/(auth)/verify-email/actions.ts', src: '.capacitor-backup/verify-actions.ts' },
  { dest: 'app/(dashboard)/admin/releases/actions.ts', src: '.capacitor-backup/releases-actions.ts' },
  { dest: 'app/(dashboard)/admin/support/actions.ts', src: '.capacitor-backup/support-actions.ts' },
  { dest: 'app/(dashboard)/admin/companies/actions.ts', src: '.capacitor-backup/companies-actions.ts' },
  { dest: 'app/(dashboard)/agenda/actions.ts', src: '.capacitor-backup/agenda-actions.ts' },
  { dest: 'app/(dashboard)/btw-aangifte/actions.ts', src: '.capacitor-backup/btw-actions.ts' },
  { dest: 'app/(dashboard)/facturen/actions.ts', src: '.capacitor-backup/facturen-actions.ts' },
  { dest: 'app/(dashboard)/uitgaven/actions.ts', src: '.capacitor-backup/uitgaven-actions.ts' },
  { dest: 'app/(dashboard)/instellingen/actions.ts', src: '.capacitor-backup/instellingen-actions.ts' },
  { dest: 'app/(dashboard)/relaties/actions.ts', src: '.capacitor-backup/relaties-actions.ts' },
  { dest: 'app/(dashboard)/offertes/actions.tsx', src: '.capacitor-backup/offertes-actions.tsx' },
];

console.log('🔄 Restoring backed up files...\n');

let successCount = 0;
let errorCount = 0;

backups.forEach(({ src, dest }) => {
  const srcPath = join(ROOT_DIR, src);
  const destPath = join(ROOT_DIR, dest);
  
  if (existsSync(srcPath)) {
    try {
      if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true, force: true });
      }
      // Ensure parent directory exists
      const parentDir = join(ROOT_DIR, dest.split('/').slice(0, -1).join('/'));
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      console.log(`  ✓ ${dest}`);
      renameSync(srcPath, destPath);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to restore ${dest}:`, error.message);
      errorCount++;
    }
  }
});

// Remove backup directory
if (existsSync(BACKUP_DIR)) {
  try {
    rmSync(BACKUP_DIR, { recursive: true, force: true });
  } catch (error) {
    console.error('  ⚠️  Could not remove backup directory:', error.message);
  }
}

console.log(`\n✅ Restoration complete (${successCount} restored, ${errorCount} errors)\n`);

if (errorCount > 0) {
  console.warn('⚠️  Some files could not be restored. Check manually.\n');
  process.exit(1);
}
