#!/usr/bin/env node

/**
 * Tenant Safety Guard Script
 * 
 * This script scans the codebase for unsafe direct Prisma usage that bypasses
 * tenant isolation helpers. It ensures all tenant-bound queries use the
 * tenantPrisma wrapper to maintain multi-tenant security.
 * 
 * Usage: node scripts/check-tenant-safety.mjs
 * Exit codes: 0 = safe, 1 = unsafe patterns found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Tenant-bound models that MUST use tenantPrisma
// IMPORTANT: Keep this list in sync with prisma/schema.prisma
// When adding new tenant-bound models, add them here and in lib/prismaTenant.ts
const TENANT_MODELS = [
  'invoice',
  'client',
  'expense',
  'quotation',
  'timeEntry',
  'event',
  'supportMessage',
];

// Unsafe Prisma operations
const UNSAFE_OPERATIONS = [
  'findMany',
  'findFirst',
  'findUnique',
  'create',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'count',
];

// Files/directories to exclude from checks
const EXCLUDED_PATHS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'lib/prismaTenant.ts',  // The helper itself
  'lib/prisma.ts',        // Prisma client setup
  'scripts/migrate-multi-tenant.ts', // Migration script
  'scripts/check-tenant-safety.mjs', // This script
];

// Files that are allowed to use raw Prisma (admin routes, migrations, etc.)
const ALLOWED_RAW_PRISMA_FILES = [
  'app/(dashboard)/admin', // Admin routes can use cross-tenant queries
  'prisma/seed',           // Seed scripts
  'scripts/',              // Migration and setup scripts
];

let violations = [];

/**
 * Check if a file path should be excluded
 */
function shouldExclude(filePath) {
  return EXCLUDED_PATHS.some(excluded => filePath.includes(excluded));
}

/**
 * Check if a file is allowed to use raw Prisma
 */
function isAllowedRawPrisma(filePath) {
  return ALLOWED_RAW_PRISMA_FILES.some(allowed => filePath.includes(allowed));
}

/**
 * Recursively find all TypeScript files
 */
function findTypeScriptFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      
      if (shouldExclude(fullPath)) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        findTypeScriptFiles(fullPath, files);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return files;
}

/**
 * Check a file for unsafe Prisma usage
 */
function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(PROJECT_ROOT, filePath);
  
  // Skip if file is allowed to use raw Prisma
  if (isAllowedRawPrisma(relativePath)) {
    return;
  }
  
  // Check for imports of tenantPrisma
  const usesTenantPrisma = content.includes('tenantPrisma') || content.includes('adminPrisma');
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }
    
    // Check for unsafe patterns: prisma.<model>.<operation>
    for (const model of TENANT_MODELS) {
      for (const operation of UNSAFE_OPERATIONS) {
        const unsafePattern = `prisma.${model}.${operation}`;
        
        if (line.includes(unsafePattern)) {
          // Additional check: make sure it's not in a comment or string
          const beforePattern = line.substring(0, line.indexOf(unsafePattern));
          const isInComment = beforePattern.includes('//') || beforePattern.includes('/*');
          const isInString = (beforePattern.match(/"/g) || []).length % 2 === 1 ||
                            (beforePattern.match(/'/g) || []).length % 2 === 1 ||
                            (beforePattern.match(/`/g) || []).length % 2 === 1;
          
          if (!isInComment && !isInString) {
            violations.push({
              file: relativePath,
              line: lineNumber,
              pattern: unsafePattern,
              suggestion: usesTenantPrisma 
                ? `Use tenantPrisma.${model}.${operation}() instead`
                : `Import and use tenantPrisma.${model}.${operation}() from '@/lib/prismaTenant'`,
            });
          }
        }
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning codebase for tenant safety violations...\n');
  
  const appDir = join(PROJECT_ROOT, 'app');
  const actionsDir = join(PROJECT_ROOT, 'actions');
  
  const files = [
    ...findTypeScriptFiles(appDir),
    ...findTypeScriptFiles(actionsDir),
  ];
  
  console.log(`Checking ${files.length} TypeScript files...\n`);
  
  for (const file of files) {
    checkFile(file);
  }
  
  if (violations.length === 0) {
    console.log('✅ No tenant safety violations found!\n');
    console.log('All tenant-bound queries are using proper isolation helpers.\n');
    return 0;
  }
  
  console.error(`❌ Found ${violations.length} tenant safety violation(s):\n`);
  
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}`);
    console.error(`    ⚠️  Unsafe pattern: ${violation.pattern}`);
    console.error(`    💡 ${violation.suggestion}\n`);
  }
  
  console.error('⚠️  Tenant isolation requires using tenantPrisma helpers for all tenant-bound models.');
  console.error('   This ensures companyId filtering is always applied to prevent data leaks.\n');
  
  return 1;
}

const exitCode = main();
process.exit(exitCode);
