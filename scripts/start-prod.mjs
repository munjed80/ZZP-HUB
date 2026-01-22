import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];
const OPTIONAL_ENV = [
  "RESEND_API_KEY",
];
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = "3000";

function getErrorMessage(error, fallback = "[unknown error]") {
  return error instanceof Error ? error.message : fallback;
}

function validateEnv() {
  const missing = REQUIRED_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missing.length > 0) {
    console.error(
      `[start-prod] Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  // Check optional env vars and warn if missing
  const missingOptional = OPTIONAL_ENV.filter(
    (key) => !process.env[key] || process.env[key].trim() === "",
  );

  if (missingOptional.length > 0) {
    console.warn(
      `[start-prod] WARNING: Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
    console.warn(
      "[start-prod] Email functionality will be disabled. Email verification and notifications will not work.",
    );
  }

  const baseUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BASE_URL ??
    process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    console.error(
      "[start-prod] Missing application URL. Set APP_URL or NEXT_PUBLIC_APP_URL (NEXTAUTH_URL is used as fallback).",
    );
    process.exit(1);
  }
}

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    let stdout = "";
    const child = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
    });

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("exit", (code) => {
      if (code === 0) return resolve(undefined);
      reject(
        new Error(
          `${command} ${args.join(" ")} exited with code ${code}. ${stderr ? `Error: ${stderr.trim()}` : ""}`,
        ),
      );
    });
    child.on("error", (error) => {
      reject(new Error(`Failed to start ${command}: ${error.message}`));
    });
  });
}

async function startServer() {
  const serverPath = path.join(process.cwd(), ".next", "standalone", "server.js");
  if (!fs.existsSync(serverPath)) {
    console.error(
      `[start-prod] Build output not found at ${serverPath}. Run "npm run build" before starting.`,
    );
    process.exit(1);
  }

  // Force binding to all interfaces for containerized deployments (e.g., Coolify).
  const host = DEFAULT_HOST;
  // Platform-as-a-Service providers (Railway, Heroku, Render, etc.) inject the PORT env var
  // to tell the app which port to bind to. We must respect this or the app won't be reachable.
  const port = process.env.PORT || DEFAULT_PORT;
  const { HOSTNAME: _ignoredHostname, ...passthroughEnv } = process.env;
  // Do not forward HOSTNAME in standalone mode or Next.js will bind to the container hostname instead of 0.0.0.0.
  const serverEnv = { ...passthroughEnv, HOST: host, PORT: port };

  console.log(`[start-prod] Starting server on ${host}:${port}`);

  const child = spawn("node", [serverPath], {
    stdio: "inherit",
    env: serverEnv,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("[start-prod] Failed to start server:", error);
    process.exit(1);
  });
}

/**
 * Validate migration name to ensure it's safe for use in shell commands.
 * Prisma migration names are alphanumeric with underscores only.
 */
function isValidMigrationName(name) {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

/**
 * Extract failed migration name from P3009 error message.
 * Prisma outputs: "The `<migration_name>` migration"
 */
function extractFailedMigrationName(errorMessage) {
  const match = errorMessage.match(/The `(.*?)` migration/);
  if (!match) return null;
  const name = match[1];
  // Validate the extracted name to prevent potential injection
  return isValidMigrationName(name) ? name : null;
}

/**
 * Check if the CompanyUser permission columns exist in the database.
 * Returns true if all columns exist, false otherwise.
 */
async function checkCompanyUserPermissionColumnsExist() {
  const prisma = new PrismaClient();
  try {
    // Query information_schema to check if columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'CompanyUser'
        AND column_name IN ('canRead', 'canEdit', 'canExport', 'canBTW')
    `;
    // If all 4 columns exist, the migration was applied
    return Array.isArray(result) && result.length === 4;
  } catch (error) {
    console.error("[start-prod] Error checking column existence:", error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Print recovery instructions for a failed migration.
 */
function printMigrationRecoveryHelp(migrationName) {
  console.error("\n========================================");
  console.error("PRISMA MIGRATION FAILURE - MANUAL INTERVENTION REQUIRED");
  console.error("========================================\n");
  console.error(`Prisma has a FAILED migration: ${migrationName}`);
  console.error("You must resolve it manually before the application can start.\n");
  console.error("STEP 1: Diagnose the issue");
  console.error("  Check _prisma_migrations table for the failed migration status:");
  console.error(`    psql "$DATABASE_URL" -c "SELECT migration_name, started_at, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name = '${migrationName}';"`);
  console.error("");
  
  // If this is the company_user_permissions migration, provide specific column checks
  if (migrationName.includes("add_company_user_permissions")) {
    console.error("  Check if CompanyUser permission columns exist:");
    console.error(`    psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'CompanyUser' AND column_name IN ('canRead', 'canEdit', 'canExport', 'canBTW');"`);
    console.error("");
  }
  
  console.error("STEP 2: Choose ONE of the following resolutions:\n");
  console.error("  Option A - If the migration changes were NOT applied to the database:");
  console.error(`    npx prisma migrate resolve --rolled-back ${migrationName}`);
  console.error("    (This marks the migration as rolled back so it will be retried)\n");
  console.error("  Option B - If the migration changes WERE applied (columns/tables exist):");
  console.error(`    npx prisma migrate resolve --applied ${migrationName}`);
  console.error("    (This marks the migration as applied so Prisma skips it)\n");
  console.error("STEP 3: Re-run migrations:");
  console.error("    npx prisma migrate deploy\n");
  console.error("STEP 4: Restart the application\n");
  console.error("========================================\n");
}

/**
 * Check if an error message indicates P3018 with 42P01 (missing relation).
 * P3018 is thrown when a migration cannot be applied because a referenced relation does not exist.
 */
function isP3018MissingRelation(errorMessage) {
  // P3018 is the Prisma error code for migration apply failure
  // 42P01 is the PostgreSQL error code for "relation does not exist"
  return errorMessage.includes("P3018") && errorMessage.includes("42P01");
}

async function migrateDeployWithFallback() {
  // Track if we've already attempted recovery to prevent infinite loops
  let recoveryAttempted = false;

  async function attemptMigration() {
    try {
      console.log("[start-prod] Running prisma migrate deploy");
      await runCommand("npx", ["prisma", "migrate", "deploy"]);
      console.log("[start-prod] Prisma migrate deploy completed");
      return;
    } catch (error) {
      const message = getErrorMessage(error, "[unknown migrate error]");

      // Check for P3018 with 42P01: Missing relation (base tables don't exist)
      if (isP3018MissingRelation(message)) {
        if (recoveryAttempted) {
          console.error("\n[start-prod] P3018/42P01 recovery already attempted. Failing to prevent infinite loop.");
          throw error;
        }
        recoveryAttempted = true;

        console.log("[start-prod] Missing base tables detected (42P01). Running prisma db push to recover...");

        try {
          await runCommand("npx", ["prisma", "db", "push"]);
          console.log("[start-prod] prisma db push completed successfully");
        } catch (pushError) {
          console.error("[start-prod] prisma db push failed:", getErrorMessage(pushError));
          throw pushError;
        }

        // Re-run migrate deploy after successful db push
        console.log("[start-prod] Re-running prisma migrate deploy after db push...");
        await attemptMigration();
        return;
      }

      // Check for P3009: Failed migration exists in the database
      if (message.includes("P3009")) {
        const migrationName = extractFailedMigrationName(message);
        if (!migrationName) {
          console.error("\n[start-prod] Prisma migrate failed with P3009 (failed migration exists).");
          console.error("[start-prod] Could not extract migration name from error. Check _prisma_migrations table manually.");
          console.error(`[start-prod] Error details: ${message}\n`);
          process.exit(1);
        }

        console.log(`[start-prod] Detected failed migration: ${migrationName}`);

        // Check if this is the company_user_permissions migration
        if (migrationName.includes("add_company_user_permissions")) {
          console.log("[start-prod] Checking if CompanyUser permission columns exist...");
          const columnsExist = await checkCompanyUserPermissionColumnsExist();

          if (columnsExist) {
            console.log("[start-prod] Columns exist - marking migration as applied");
            await runCommand("npx", ["prisma", "migrate", "resolve", "--applied", migrationName]);
          } else {
            console.log("[start-prod] Columns do not exist - marking migration as rolled-back for retry");
            await runCommand("npx", ["prisma", "migrate", "resolve", "--rolled-back", migrationName]);
          }

          // Re-run migrations after resolution
          console.log("[start-prod] Re-running prisma migrate deploy after resolution...");
          await runCommand("npx", ["prisma", "migrate", "deploy"]);
          console.log("[start-prod] Prisma migrate deploy completed after auto-resolution");
          return;
        }

        // For other migrations, print recovery help and exit
        printMigrationRecoveryHelp(migrationName);
        console.error("[start-prod] Exiting. Manual intervention required for this migration.");
        process.exit(1);
      }

      // Re-throw other errors
      throw error;
    }
  }

  await attemptMigration();
}

async function main() {
  validateEnv();

  await migrateDeployWithFallback();

  // Bootstrap SUPERADMIN user after migrations
  console.log("[start-prod] Bootstrapping SUPERADMIN user");
  try {
    await runCommand("node", ["./scripts/bootstrap-superadmin.mjs"]);
  } catch (error) {
    console.warn("[start-prod] SUPERADMIN bootstrap failed, continuing anyway:", error.message);
    // Don't fail the startup if bootstrap fails - the server should still start
  }

  // Prisma client is generated during the image build (npm install/next build), so runtime only applies migrations before starting the server.
  await startServer();
}

main()
  .catch((error) => {
    console.error("[start-prod] Fatal error:", error);
    process.exit(1);
  });
