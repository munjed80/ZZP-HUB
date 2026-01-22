#!/usr/bin/env node
/**
 * Helper script to print migration recovery commands for a failed Prisma migration.
 * 
 * Usage:
 *   node scripts/print-migration-recovery.mjs <migration_name>
 * 
 * Example:
 *   node scripts/print-migration-recovery.mjs 20260122000000_add_company_user_permissions
 */

import process from "node:process";

const KNOWN_MIGRATIONS = {
  "20260122000000_add_company_user_permissions": {
    description: "Adds permission columns to CompanyUser table",
    columns: ["canRead", "canEdit", "canExport", "canBTW"],
    table: "CompanyUser",
  },
};

/**
 * Validate migration name to ensure it's safe for use in shell commands.
 * Prisma migration names are alphanumeric with underscores only.
 */
function isValidMigrationName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

function printUsage() {
  console.log("Usage: node scripts/print-migration-recovery.mjs <migration_name>");
  console.log("");
  console.log("Example:");
  console.log("  node scripts/print-migration-recovery.mjs 20260122000000_add_company_user_permissions");
}

function printRecoveryCommands(migrationName) {
  // Validate migration name before using in shell commands
  if (!isValidMigrationName(migrationName)) {
    console.error(`Error: Invalid migration name "${migrationName}". Migration names must be alphanumeric with underscores only.`);
    process.exit(1);
  }

  const knownMigration = KNOWN_MIGRATIONS[migrationName];
  
  console.log("========================================");
  console.log("PRISMA MIGRATION RECOVERY COMMANDS");
  console.log("========================================\n");
  console.log(`Migration: ${migrationName}`);
  
  if (knownMigration) {
    console.log(`Description: ${knownMigration.description}\n`);
  } else {
    console.log("");
  }
  
  console.log("STEP 1: Check migration status in _prisma_migrations table:");
  console.log("--------");
  console.log(`psql "$DATABASE_URL" -c "SELECT migration_name, started_at, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations WHERE migration_name = '${migrationName}';"`);
  console.log("");
  
  if (knownMigration && knownMigration.columns && knownMigration.table) {
    console.log(`STEP 2: Check if ${knownMigration.table} columns exist:`);
    console.log("--------");
    const columnsQuoted = knownMigration.columns.map(c => `'${c}'`).join(", ");
    console.log(`psql "$DATABASE_URL" -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = '${knownMigration.table}' AND column_name IN (${columnsQuoted});"`);
    console.log("");
    console.log("Expected columns:");
    for (const col of knownMigration.columns) {
      console.log(`  - ${col}`);
    }
    console.log("");
  }
  
  console.log("STEP 3: Choose ONE resolution:");
  console.log("--------\n");
  
  console.log("Option A - Migration changes were NOT applied (columns don't exist):");
  console.log(`  npx prisma migrate resolve --rolled-back ${migrationName}`);
  console.log("  # This marks the migration as rolled back so it will be retried on next deploy\n");
  
  console.log("Option B - Migration changes WERE applied (columns exist):");
  console.log(`  npx prisma migrate resolve --applied ${migrationName}`);
  console.log("  # This marks the migration as successfully applied\n");
  
  console.log("STEP 4: Re-run migrations:");
  console.log("--------");
  console.log("npx prisma migrate deploy\n");
  
  console.log("STEP 5: Restart the application");
  console.log("--------");
  console.log("npm run start\n");
  
  console.log("========================================");
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(args.includes("--help") || args.includes("-h") ? 0 : 1);
  }
  
  const migrationName = args[0];
  printRecoveryCommands(migrationName);
}

main();
