import { Prisma, PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
];
const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = "3000";
const USER_TABLE = "User";

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
    const child = spawn(command, args, {
      stdio: ["inherit", "inherit", "pipe"],
      shell: false,
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

const prisma = new PrismaClient();

function getMigrationFolders() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`[start-prod] Missing migrations directory at ${migrationsDir}`);
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

async function hasExistingTables() {
  const result = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = current_schema()
    AND table_type = 'BASE TABLE'
  `;

  return Number(result?.[0]?.count ?? 0) > 0;
}

async function ensureBaselineResolved(migrationFolders) {
  const hasMigrationsTable = await tableExists("_prisma_migrations");
  const hasTables = await hasExistingTables();

  if (hasMigrationsTable || !hasTables) {
    return;
  }

  const baselineMigration =
    migrationFolders.find((name) =>
      name.toLowerCase().includes("baseline"),
    ) ?? migrationFolders[0];

  if (!baselineMigration) {
    throw new Error("[start-prod] No migration folders found to mark as baseline.");
  }

  console.log(
    `[start-prod] Marking existing database as baseline with migration "${baselineMigration}"`,
  );

  await runCommand("npx", [
    "prisma",
    "migrate",
    "resolve",
    "--applied",
    baselineMigration,
  ]);
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
    AND table_name = ${USER_TABLE}
    AND column_name IN (${Prisma.join(requiredColumns)})
  `;

  const foundColumns = new Set(columnRows.map((row) => row.column_name));
  const missingColumns = requiredColumns.filter(
    (column) => !foundColumns.has(column),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `[start-prod] Missing required columns on "User": ${missingColumns.join(", ")}`,
    );
  }

  const hasTokenTable = await tableExists("EmailVerificationToken");

  if (!hasTokenTable) {
    throw new Error('[start-prod] Missing table "EmailVerificationToken"');
  }
}

async function verifyDatabase() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1 as ok");
    console.log("[start-prod] Database connectivity check: OK");
  } catch (error) {
    throw new Error(
      `[start-prod] Database connectivity check failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function startServer() {
  const serverPath = path.join(process.cwd(), ".next", "standalone", "server.js");
  if (!fs.existsSync(serverPath)) {
    console.error(
      `[start-prod] Build output not found at ${serverPath}. Run "npm run build" before starting.`,
    );
    process.exit(1);
  }

  const host = DEFAULT_HOST;
  const port = DEFAULT_PORT;
  const serverEnv = { ...process.env, HOST: host, HOSTNAME: host, PORT: port };

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

async function main() {
  validateEnv();

  const migrationFolders = getMigrationFolders();
  await ensureBaselineResolved(migrationFolders);

  console.log("[start-prod] Running prisma migrate deploy");
  await runCommand("npx", ["prisma", "migrate", "deploy"]);

  console.log("[start-prod] Running prisma generate");
  await runCommand("npx", ["prisma", "generate"]);

  await verifyRequiredColumns();
  await verifyDatabase();
  await startServer();
}

main()
  .catch((error) => {
    console.error("[start-prod] Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
