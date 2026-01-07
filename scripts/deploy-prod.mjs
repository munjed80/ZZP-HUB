import { PrismaClient, Prisma } from "@prisma/client";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const prisma = new PrismaClient();

const log = (message) => console.log(`[deploy] ${message}`);
const logStep = (message) => console.log(`\n[deploy] === ${message} ===`);

function runCommand(command) {
  log(`RUN ${command}`);
  execSync(command, { stdio: "inherit", env: process.env });
}

function getMigrationFolders() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Missing migrations directory at ${migrationsDir}`);
  }

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function tableExists(tableName) {
  const result = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
      AND table_name = ${tableName}
    ) AS "exists"
  `;

  return Boolean(result?.[0]?.exists);
}

async function hasUserTables() {
  const result = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = current_schema()
    AND table_type = 'BASE TABLE'
  `;

  return Number(result?.[0]?.count ?? 0) > 0;
}

async function verifyRequiredColumns() {
  const requiredColumns = [
    "emailVerified",
    "emailVerificationToken",
    "emailVerificationExpiry",
    "emailVerificationSentAt",
    "onboardingStep",
    "onboardingCompleted",
    "twoFactorEnabled",
    "twoFactorSecret",
    "recoveryCodes",
  ];

  const columnRows = await prisma.$queryRaw`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
    AND table_name = 'User'
    AND column_name IN (${Prisma.join(requiredColumns)})
  `;

  const foundColumns = new Set(columnRows.map((row) => row.column_name));
  const missingColumns = requiredColumns.filter(
    (column) => !foundColumns.has(column),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns on "User": ${missingColumns.join(", ")}`,
    );
  }

  const hasTokenTable = await tableExists("EmailVerificationToken");

  if (!hasTokenTable) {
    throw new Error('Missing table "EmailVerificationToken"');
  }

  log("PASS: Required columns and tables are present.");
}

async function deployMigrations(migrationFolders) {
  log(`Detected migrations: ${migrationFolders.join(", ") || "none found"}`);

  const hasMigrationsTable = await tableExists("_prisma_migrations");
  const hasExistingTables = await hasUserTables();

  if (hasMigrationsTable) {
    log("Found _prisma_migrations table -> running migrate deploy.");
    runCommand("npx prisma migrate deploy");
    return;
  }

  if (hasExistingTables) {
    const baselineMigration =
      migrationFolders.find((name) =>
        name.toLowerCase().includes("baseline"),
      ) ?? migrationFolders[0];

    if (!baselineMigration) {
      throw new Error("No migration folders found to mark as baseline.");
    }

    log(
      `_prisma_migrations missing, but database has tables -> marking baseline ${baselineMigration} as applied.`,
    );
    runCommand(`npx prisma migrate resolve --applied ${baselineMigration}`);
    runCommand("npx prisma migrate deploy");
    return;
  }

  log("Database empty -> running migrate deploy from scratch.");
  runCommand("npx prisma migrate deploy");
}

async function main() {
  logStep("Prisma generate");
  runCommand("npx prisma generate");

  logStep("Inspecting migrations and database state");
  const migrationFolders = getMigrationFolders();
  await deployMigrations(migrationFolders);

  logStep("Verifying schema after migrations");
  await verifyRequiredColumns();

  logStep("Starting Next.js standalone server");
  await prisma.$disconnect();
  const serverPath = path.join(".next", "standalone", "server.js");

  if (!fs.existsSync(serverPath)) {
    throw new Error(
      `Missing build output at ${serverPath}. Run "npm run build" before deploy.`,
    );
  }

  runCommand(`node ${serverPath}`);
}

main()
  .catch(async (error) => {
    console.error("[deploy] FAIL:", error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
